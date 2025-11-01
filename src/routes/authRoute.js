import express from 'express';
import { registerUser, loginUser, logoutUser, verifyRequest, googleLogin } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Auth route' });
});
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google/token',googleLogin);
router.post('/logout', logoutUser);
router.get('/me', authMiddleware(),verifyRequest);

export default router;
