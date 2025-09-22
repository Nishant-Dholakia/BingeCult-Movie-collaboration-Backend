import express from 'express';
import { getSimilarusers } from '../controllers/userController.js';
const router = express.Router();

router.get('/similar', getSimilarusers);

export default router;