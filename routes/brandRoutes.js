const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.get('/', brandController.getCostruttori);
router.get('/:id', brandController.getCostruttore);

// Rotte protette (solo admin)
router.post('/', authenticateToken, checkRole('admin'), brandController.createCostruttore);
router.put('/:id', authenticateToken, checkRole('admin'), brandController.updateCostruttore);
router.delete('/:id', authenticateToken, checkRole('admin'), brandController.deleteCostruttore);

module.exports = router;