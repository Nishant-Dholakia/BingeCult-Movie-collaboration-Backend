import express from 'express';
import { addGroup, getAllGroups } from '../controllers/groupController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';


const router = express.Router();


router.post('/add',authMiddleware(['password']),addGroup);
router.get('/all',authMiddleware(['password']),getAllGroups);

export default router;