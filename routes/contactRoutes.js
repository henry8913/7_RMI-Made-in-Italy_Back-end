const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Rotte pubbliche
router.post('/', upload.array('allegati', 5), contactController.inviaMessaggio);

// Rotta per upload generico (può essere usata da varie parti dell'app)
router.post('/upload', authenticateToken, upload.single('file'), contactController.uploadFile);

// Rotte protette (solo admin)
router.get('/', authenticateToken, checkRole('admin'), contactController.getMessaggi);
router.get('/:id', authenticateToken, checkRole('admin'), contactController.getMessaggio);
router.patch('/:id/letto', authenticateToken, checkRole('admin'), contactController.segnaComeLetto);
router.put('/:id', authenticateToken, checkRole('admin'), upload.array('allegati', 5), contactController.aggiornaMessaggioConAllegati);
router.delete('/:id', authenticateToken, checkRole('admin'), contactController.deleteMessaggio);

module.exports = router;