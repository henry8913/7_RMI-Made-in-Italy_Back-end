const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.get('/', packageController.getPackages);
router.get('/:id', packageController.getPackage);

// Webhook Stripe (deve essere accessibile pubblicamente)
router.post('/webhook', express.raw({type: 'application/json'}), packageController.handleStripeWebhook);

// Rotte che richiedono autenticazione
router.post('/:packageId/checkout', authenticateToken, packageController.createCheckoutSession);
router.get('/user/orders', authenticateToken, packageController.getUserOrders);

// Rotte protette (solo admin)
router.post('/', authenticateToken, checkRole('admin'), packageController.createPackage);
router.put('/:id', authenticateToken, checkRole('admin'), packageController.updatePackage);
router.delete('/:id', authenticateToken, checkRole('admin'), packageController.deletePackage);
router.get('/admin/orders', authenticateToken, checkRole('admin'), packageController.getAllOrders);

module.exports = router;