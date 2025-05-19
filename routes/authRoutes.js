const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotte protette
router.get('/profile', authenticateToken, authController.getProfile);

// Rotta di esempio protetta solo per admin
router.get('/admin', authenticateToken, checkRole('admin'), (req, res) => {
  res.status(200).json({ message: 'Accesso admin consentito', user: req.user });
});

module.exports = router;