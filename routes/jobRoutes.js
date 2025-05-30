const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJob);

// Rotte che richiedono autenticazione
router.post('/:id/candidatura', authenticateToken, jobController.inviaCandiatura);
router.get('/user/candidature', authenticateToken, jobController.getUserCandidature);

// Rotte protette (solo admin)
router.post('/', authenticateToken, checkRole('admin'), jobController.createJob);
router.put('/:id', authenticateToken, checkRole('admin'), jobController.updateJob);
router.delete('/:id', authenticateToken, checkRole('admin'), jobController.deleteJob);
router.get('/:id/candidature', authenticateToken, checkRole('admin'), jobController.getCandidature);
router.patch('/:id/candidature/:candidaturaId', authenticateToken, checkRole('admin'), jobController.aggiornaStatoCandidatura);

module.exports = router;