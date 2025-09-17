import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getProfile, updateProfile } from '../controllers/profileController.js';

const router = express.Router();

router.get('/', authMiddleware(['password']), getProfile);
router.put('/', authMiddleware(['password']), updateProfile);

export default router;