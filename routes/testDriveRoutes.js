const express = require('express');
const router = express.Router();
const testDriveController = require('../controllers/testDriveController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Tutte le rotte dei test drive richiedono autenticazione
router.use(authenticateToken);

// Rotte per utenti normali
router.post('/', testDriveController.prenotaTestDrive);
router.get('/me', testDriveController.getUserTestDrive);

// Rotte protette (solo admin)
router.get('/', checkRole('admin'), testDriveController.getAllTestDrive);
router.get('/:id', testDriveController.getTestDrive); // Accessibile sia all'admin che all'utente proprietario
router.patch('/:id/status', checkRole('admin'), testDriveController.updateTestDriveStatus);
router.delete('/:id', checkRole('admin'), testDriveController.deleteTestDrive);

module.exports = router;