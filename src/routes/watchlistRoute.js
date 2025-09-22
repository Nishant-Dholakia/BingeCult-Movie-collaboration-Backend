import express from 'express';
import { addSeries, addMovie, getWatchlistById,addToWatchlists } from '../controllers/watchListController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { get } from 'mongoose';

const router = express.Router();

// router.use(authMiddleware);

// router.get('/',getWholeWatchlist);
router.post('/series',authMiddleware(['password']), addSeries);
router.post('/movie',authMiddleware(['password']), addMovie);
router.get('/list',authMiddleware(['password']),getWatchlistById);
router.post('/add',authMiddleware(['password']), addToWatchlists);
export default router;
