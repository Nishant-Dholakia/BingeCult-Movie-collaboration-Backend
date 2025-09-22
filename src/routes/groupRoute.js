import express from 'express';
import { addGroup, getAllGroups, getGroupById,getAdminGroups,addMember } from '../controllers/groupController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';


const router = express.Router();


router.post('/add',authMiddleware(['password']),addGroup);
router.get('/all',authMiddleware(['password']),getAllGroups);
router.get('/group',authMiddleware(['password']),getGroupById);
router.get('/admin',authMiddleware(['password']),getAdminGroups);
router.post('/addMember',authMiddleware(['password']),addMember);
export default router;