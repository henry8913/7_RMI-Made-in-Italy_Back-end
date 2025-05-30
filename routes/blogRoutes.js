const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Rotte pubbliche
router.get('/', blogController.getPosts);
router.get('/featured', blogController.getFeaturedPosts);
router.get('/:id', blogController.getPost);
router.get('/:id/related', blogController.getRelatedPosts);

// Rotte per commenti e mi piace (utenti autenticati)
router.post('/:id/comments', authenticateToken, blogController.addComment);
router.delete('/:postId/comments/:commentId', authenticateToken, blogController.removeComment);
router.post('/:id/like', authenticateToken, blogController.toggleLike);

// Rotte protette (solo admin)
router.post('/', authenticateToken, checkRole('admin'), blogController.createPost);
router.put('/:id', authenticateToken, checkRole('admin'), blogController.updatePost);
router.delete('/:id', authenticateToken, checkRole('admin'), blogController.deletePost);
router.patch('/:id/status', authenticateToken, checkRole('admin'), blogController.updatePostStatus);
router.get('/admin/stats', authenticateToken, checkRole('admin'), blogController.getBlogStats);

module.exports = router;