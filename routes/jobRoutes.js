const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const jobController = require('../controllers/jobController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Configurazione Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurazione dello storage per Multer con Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rmi-job-applications',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  }
});

// Inizializzazione di Multer con lo storage configurato
const upload = multer({ storage: storage });

// Rotte pubbliche
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJob);

// Rotte pubbliche per candidature
router.post('/:id/apply', upload.single('cv'), jobController.inviaCandiatura);
router.get('/user/candidature', jobController.getUserCandidature);

// Rotte protette (solo admin)
router.post('/', authenticateToken, checkRole('admin'), jobController.createJob);
router.put('/:id', authenticateToken, checkRole('admin'), jobController.updateJob);
router.delete('/:id', authenticateToken, checkRole('admin'), jobController.deleteJob);
router.get('/:id/candidature', authenticateToken, checkRole('admin'), jobController.getCandidature);
router.patch('/:id/candidature/:candidaturaId', authenticateToken, checkRole('admin'), jobController.aggiornaStatoCandidatura);

module.exports = router;