const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.post('/iscriviti', newsletterController.iscriviti);
router.get('/disiscrivi/:token', newsletterController.disiscrivi);
router.put('/preferenze/:token', newsletterController.aggiornaPreferenze);

// Rotte protette (solo admin)
router.get('/', authenticateToken, checkRole('admin'), newsletterController.getIscrizioni);
router.get('/statistiche', authenticateToken, checkRole('admin'), newsletterController.getStatistiche);
router.delete('/:id', authenticateToken, checkRole('admin'), newsletterController.deleteIscrizione);

module.exports = router;