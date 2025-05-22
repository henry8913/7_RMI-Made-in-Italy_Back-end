const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Tutte le rotte della wishlist richiedono autenticazione
router.use(authenticateToken);

// Ottieni la wishlist dell'utente corrente
router.get('/me', wishlistController.getWishlist);

// Aggiungi un modello alla wishlist
router.post('/add/:modelId', wishlistController.addToWishlist);

// Rimuovi un modello dalla wishlist
router.delete('/remove/:modelId', wishlistController.removeFromWishlist);

module.exports = router;