const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filepath: {
        type: String,
        required: true
    },
    filesize: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        trim: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    permissions: {
        canView: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        canEdit: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        canDelete: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        sharedWith: [{
            email: {
                type: String,
                lowercase: true,
                trim: true
            },
            permission: {
                type: String,
                enum: ['view', 'edit', 'delete'],
                default: 'view'
            },
            sharedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    versions: [{
        version: {
            type: Number,
            required: true
        },
        filename: {
            type: String,
            required: true
        },
        filepath: {
            type: String,
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        changelog: {
            type: String,
            trim: true
        }
    }],
    currentVersion: {
        type: Number,
        default: 1
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', documentSchema);
