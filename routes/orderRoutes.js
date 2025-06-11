const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte protette (richiedono autenticazione)
router.post('/', authenticateToken, orderController.createOrder);
router.get('/user', authenticateToken, orderController.getUserOrders);
router.get('/user/:id', authenticateToken, orderController.getOrderById);

// Rotte protette (solo admin)
router.get('/', authenticateToken, checkRole('admin'), orderController.getAllOrders);

module.exports = router;