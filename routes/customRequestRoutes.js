const express = require('express');
const router = express.Router();
const customRequestController = require('../controllers/customRequestController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Tutte le rotte delle richieste personalizzate richiedono autenticazione
router.use(authenticateToken);

// Rotte per utenti normali
router.post('/', customRequestController.inviaRichiesta);
router.get('/me', customRequestController.getUserRichieste);
router.patch('/:id/stato', customRequestController.aggiornaStatoRichiesta);

// Rotte protette (solo admin)
router.get('/', checkRole('admin'), customRequestController.getAllRichieste);
router.get('/:id', customRequestController.getRichiesta); // Accessibile sia all'admin che all'utente proprietario
router.post('/:id/risposta', checkRole('admin'), customRequestController.rispondiRichiesta);
router.delete('/:id', checkRole('admin'), customRequestController.deleteRichiesta);

module.exports = router;