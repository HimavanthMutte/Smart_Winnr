const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');
const Document = require('../models/Document');

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

        query.$or = [
            { isPublic: true },
            { uploadedBy: req.user.id },
            { 'permissions.canView': req.user.id }
        ];

        const documents = await Document.find(query)
            .populate('uploadedBy', 'username email')
            .populate('versions.uploadedBy', 'username')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Document.countDocuments(query);

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

        const hasPermission = document.isPublic ||
                            document.uploadedBy._id.toString() === req.user.id ||
                            document.permissions.canView.some(id => id.toString() === req.user.id) ||
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

        const hasEditPermission = document.uploadedBy.toString() === req.user.id ||
                                 document.permissions.canEdit.some(id => id.toString() === req.user.id) ||
                                 req.user.role === 'admin';

        if (!hasEditPermission) {
            return res.status(403).json({ message: 'Edit access denied' });
        }

        if (title) document.title = title;
        if (description) document.description = description;
        if (tags) document.tags = tags.split(',').map(tag => tag.trim());
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

        const hasDeletePermission = document.uploadedBy.toString() === req.user.id ||
                                   document.permissions.canDelete.some(id => id.toString() === req.user.id) ||
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

module.exports = {
    upload,
    uploadDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    updatePermissions
};
