const express = require('express');
const router = express.Router();
const restomodController = require('../controllers/restomodController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.get('/', restomodController.getModelli);
router.get('/:id', restomodController.getModello);

// Rotte protette (solo admin)
router.post('/', authenticateToken, checkRole('admin'), restomodController.createModello);
router.put('/:id', authenticateToken, checkRole('admin'), restomodController.updateModello);
router.delete('/:id', authenticateToken, checkRole('admin'), restomodController.deleteModello);
router.patch('/:id/stato', authenticateToken, checkRole('admin'), restomodController.updateStato);

module.exports = router;