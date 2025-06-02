const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.post('/send', contactController.sendMessage);

// Rotte admin
router.get('/', authenticateToken, checkRole('admin'), contactController.getMessages);
router.get('/:id', authenticateToken, checkRole('admin'), contactController.getMessage);
router.delete('/:id', authenticateToken, checkRole('admin'), contactController.deleteMessage);

module.exports = router;