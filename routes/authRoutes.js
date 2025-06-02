const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

require('../config/passport');

// Rotte pubbliche
router.post('/register', authController.register);
router.post('/login', authController.login);

// Autenticazione Google
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/google/callback',
passport.authenticate('google', { failureRedirect: '/login' }),
authController.googleAuthCallback
);

router.post('/google/login', authController.googleLogin);

// Rotte protette
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/admin', authenticateToken, checkRole('admin'), (req, res) => {
  res.status(200).json({ message: 'Accesso admin consentito', user: req.user });
});

// Rotte admin per la gestione degli utenti
router.get('/users', authenticateToken, checkRole('admin'), authController.getUsers);
router.put('/users/:id', authenticateToken, checkRole('admin'), authController.updateUser);
router.delete('/users/:id', authenticateToken, checkRole('admin'), authController.deleteUser);

module.exports = router;