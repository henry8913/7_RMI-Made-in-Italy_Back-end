const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const customRequestController = require('../controllers/customRequestController');
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
    folder: 'rmi-custom-requests',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  }
});

// Inizializzazione di Multer con lo storage configurato
const upload = multer({ storage: storage });

// Tutte le rotte delle richieste personalizzate richiedono autenticazione
router.use(authenticateToken);

// Rotte per utenti normali
router.post('/', upload.array('allegati'), customRequestController.inviaRichiesta);
router.get('/me', customRequestController.getUserRichieste);
router.patch('/:id/stato', customRequestController.aggiornaStatoRichiesta);

// Rotte protette (solo admin)
router.get('/', checkRole('admin'), customRequestController.getAllRichieste);
router.get('/:id', customRequestController.getRichiesta); // Accessibile sia all'admin che all'utente proprietario
router.post('/:id/risposta', checkRole('admin'), customRequestController.rispondiRichiesta);
router.delete('/:id', checkRole('admin'), customRequestController.deleteRichiesta);

module.exports = router;