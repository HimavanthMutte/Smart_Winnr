const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const {
    upload,
    uploadDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    updatePermissions,
    shareDocumentViaEmail
} = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', auth, upload.single('document'), [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('tags').optional().trim(),
    body('category').optional().trim(),
    body('isPublic').optional().isBoolean()
], uploadDocument);

router.get('/', auth, getDocuments);

router.get('/:id', auth, getDocumentById);

router.put('/:id', auth, [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('tags').optional().trim(),
    body('category').optional().trim(),
    body('isPublic').optional().isBoolean()
], updateDocument);

router.delete('/:id', auth, deleteDocument);

router.put('/:id/permissions', auth, updatePermissions);
router.post('/:id/share', auth, shareDocumentViaEmail);

module.exports = router;
