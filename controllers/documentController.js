const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { validationResult } = require('express-validator');
const Document = require('../models/Document');
const User = require('../models/User');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
        }
    }
});

const uploadDocument = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { title, description, tags, category, isPublic } = req.body;

        const document = new Document({
            title,
            description,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filepath: req.file.path,
            filesize: req.file.size,
            mimetype: req.file.mimetype,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            category,
            uploadedBy: req.user.id,
            isPublic: isPublic === 'true',
            versions: [{
                version: 1,
                filename: req.file.filename,
                filepath: req.file.path,
                uploadedBy: req.user.id,
                changelog: 'Initial version'
            }]
        });

        await document.save();
        await document.populate('uploadedBy', 'username email');

        res.json(document);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const getDocuments = async (req, res) => {
    try {
        const { search, tags, category, page = 1, limit = 10 } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        if (category) {
            query.category = category;
        }

        // Security query: Public doc, Owned doc, ObjectId shared, or Email shared
        const securityQuery = {
            $or: [
                { isPublic: true },
                { uploadedBy: req.user.id },
                { 'permissions.canView': req.user.id },
                { 'permissions.sharedWith.email': req.user.email }
            ]
        };

        const finalQuery = search ? { $and: [query, securityQuery] } : securityQuery;

        const documents = await Document.find(finalQuery)
            .populate('uploadedBy', 'username email')
            .populate('versions.uploadedBy', 'username')
            .sort({ updatedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Document.countDocuments(finalQuery);

        res.json({
            documents,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'username email')
            .populate('versions.uploadedBy', 'username');

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const hasEmailPermission = document.permissions.sharedWith.some(share =>
            share.email.toLowerCase() === req.user.email.toLowerCase()
        );

        const hasPermission = document.isPublic ||
            document.uploadedBy._id.toString() === req.user.id ||
            document.permissions.canView.some(id => id.toString() === req.user.id) ||
            hasEmailPermission ||
            req.user.role === 'admin';

        if (!hasPermission) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(document);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const updateDocument = async (req, res) => {
    try {
        const { title, description, tags, category, isPublic } = req.body;

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const emailPermission = document.permissions.sharedWith.find(share =>
            share.email.toLowerCase() === req.user.email.toLowerCase()
        );
        const hasEmailEditPermission = emailPermission && (emailPermission.permission === 'edit' || emailPermission.permission === 'delete');

        const hasEditPermission = document.uploadedBy.toString() === req.user.id ||
            document.permissions.canEdit.some(id => id.toString() === req.user.id) ||
            hasEmailEditPermission ||
            req.user.role === 'admin';

        if (!hasEditPermission) {
            return res.status(403).json({ message: 'Edit access denied' });
        }

        if (title) document.title = title;
        if (description) document.description = description;
        if (tags) document.tags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
        if (category) document.category = category;
        if (isPublic !== undefined) document.isPublic = isPublic === 'true';

        document.updatedAt = Date.now();
        await document.save();

        await document.populate('uploadedBy', 'username email');
        res.json(document);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const emailPermission = document.permissions.sharedWith.find(share =>
            share.email.toLowerCase() === req.user.email.toLowerCase()
        );
        const hasEmailDeletePermission = emailPermission && emailPermission.permission === 'delete';

        const hasDeletePermission = document.uploadedBy.toString() === req.user.id ||
            document.permissions.canDelete.some(id => id.toString() === req.user.id) ||
            hasEmailDeletePermission ||
            req.user.role === 'admin';

        if (!hasDeletePermission) {
            return res.status(403).json({ message: 'Delete access denied' });
        }

        // Delete all version files
        document.versions.forEach(version => {
            if (fs.existsSync(version.filepath)) {
                fs.unlinkSync(version.filepath);
            }
        });

        await Document.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const updatePermissions = async (req, res) => {
    try {
        const { canView, canEdit, canDelete } = req.body;

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const hasPermission = document.uploadedBy.toString() === req.user.id || req.user.role === 'admin';

        if (!hasPermission) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        if (canView) document.permissions.canView = canView;
        if (canEdit) document.permissions.canEdit = canEdit;
        if (canDelete) document.permissions.canDelete = canDelete;

        await document.save();
        res.json(document);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

const shareDocumentViaEmail = async (req, res) => {
    try {
        const { emails, message, permission } = req.body;
        const documentId = req.params.id;

        const document = await Document.findById(documentId).populate('uploadedBy', 'username email');
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const hasPermission = document.uploadedBy._id.toString() === req.user.id || req.user.role === 'admin';

        if (!hasPermission) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        // Update document with shared emails
        emails.forEach(email => {
            const lowerEmail = email.toLowerCase().trim();
            // Check if already shared
            const existingIndex = document.permissions.sharedWith.findIndex(s => s.email === lowerEmail);
            if (existingIndex > -1) {
                document.permissions.sharedWith[existingIndex].permission = permission || 'view';
            } else {
                document.permissions.sharedWith.push({
                    email: lowerEmail,
                    permission: permission || 'view'
                });
            }
        });

        await document.save();

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const documentUrl = `${baseUrl}/document/${documentId}`;

        for (const email of emails) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: `${document.uploadedBy.username} shared a document with you: ${document.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #3498db; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">📁 Shared Document</h1>
                        </div>
                        <div style="padding: 20px; line-height: 1.6; color: #333;">
                            <p>Hello,</p>
                            <p><strong>${document.uploadedBy.username}</strong> has shared a document with you on Smart Winnr.</p>
                            
                            <div style="background-color: #f9f9f9; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #2c3e50;">${document.title}</h3>
                                <p style="margin-bottom: 5px;"><strong>Description:</strong> ${document.description || 'No description'}</p>
                                <p style="margin-bottom: 5px;"><strong>Access Level:</strong> ${permission || 'view'}</p>
                                <p style="margin-bottom: 0;"><strong>File Size:</strong> ${formatFileSize(document.filesize)}</p>
                            </div>

                            ${message ? `<p><strong>Message from ${document.uploadedBy.username}:</strong><br><em>"${message}"</em></p>` : ''}

                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${documentUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">View in Application</a>
                            </div>

                            <p style="font-size: 14px; color: #7f8c8d;">If you don't have an account, please register with <strong>${email}</strong> to access this document.</p>
                        </div>
                        <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #95a5a6;">
                            This is an automated message from the Smart Winnr Document Management System.
                        </div>
                    </div>
                `
            };

            // Only attempt to send if credentials are set
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                try {
                    await transporter.sendMail(mailOptions);
                } catch (e) {
                    console.error('Failed to send email to', email, e.message);
                }
            } else {
                console.log('Skipping email send - no credentials. Document shared in DB.');
            }
        }

        res.json({ message: `Document shared successfully with ${emails.length} recipient(s)` });
    } catch (error) {
        console.error('Email sharing error:', error);
        res.status(500).json({ message: 'Failed to share document' });
    }
};

const uploadNewVersion = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const emailPermission = document.permissions.sharedWith.find(share =>
            share.email.toLowerCase() === req.user.email.toLowerCase()
        );
        const hasEditPermission = document.uploadedBy.toString() === req.user.id ||
            document.permissions.canEdit.some(id => id.toString() === req.user.id) ||
            (emailPermission && (emailPermission.permission === 'edit' || emailPermission.permission === 'delete')) ||
            req.user.role === 'admin';

        if (!hasEditPermission) {
            return res.status(403).json({ message: 'Permission denied to upload new version' });
        }

        const newVersionNumber = (document.currentVersion || 1) + 1;

        const newVersion = {
            version: newVersionNumber,
            filename: req.file.filename,
            filepath: req.file.path,
            uploadedBy: req.user.id,
            changelog: req.body.changelog || `Updated on ${new Date().toLocaleDateString()}`
        };

        document.versions.push(newVersion);
        document.currentVersion = newVersionNumber;
        document.filename = req.file.filename;
        document.filepath = req.file.path;
        document.filesize = req.file.size;
        document.updatedAt = Date.now();

        await document.save();
        await document.populate('uploadedBy', 'username email');
        await document.populate('versions.uploadedBy', 'username');

        res.json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to upload new version' });
    }
};

const restoreVersion = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const versionToRestore = document.versions.find(v => v.version === parseInt(req.params.versionNumber));
        if (!versionToRestore) {
            return res.status(404).json({ message: 'Version not found' });
        }

        const emailPermission = document.permissions.sharedWith.find(share =>
            share.email.toLowerCase() === req.user.email.toLowerCase()
        );
        const hasEditPermission = document.uploadedBy.toString() === req.user.id ||
            document.permissions.canEdit.some(id => id.toString() === req.user.id) ||
            (emailPermission && (emailPermission.permission === 'edit' || emailPermission.permission === 'delete')) ||
            req.user.role === 'admin';

        if (!hasEditPermission) {
            return res.status(403).json({ message: 'Permission denied to restore version' });
        }

        // We "restore" by creating a NEW version that is a copy of the old one
        // Note: In a production app, we might want to copy the file itself to avoid two versions pointing to same path
        // but here they are just paths on disk.

        const newVersionNumber = document.currentVersion + 1;
        const newVersion = {
            version: newVersionNumber,
            filename: versionToRestore.filename,
            filepath: versionToRestore.filepath,
            uploadedBy: req.user.id,
            changelog: `Restored from version ${versionToRestore.version}`
        };

        document.versions.push(newVersion);
        document.currentVersion = newVersionNumber;
        document.filename = versionToRestore.filename;
        document.filepath = versionToRestore.filepath;
        document.updatedAt = Date.now();

        await document.save();
        await document.populate('uploadedBy', 'username email');
        await document.populate('versions.uploadedBy', 'username');

        res.json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to restore version' });
    }
};

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    upload,
    uploadDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    updatePermissions,
    shareDocumentViaEmail,
    uploadNewVersion,
    restoreVersion
};
