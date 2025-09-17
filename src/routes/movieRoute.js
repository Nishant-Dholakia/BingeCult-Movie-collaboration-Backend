import express from 'express';
import { getTrendingMovies, getMovieDetailsByID, searchMovies } from '../controllers/movieController.js';

const router = express.Router();

router.get('/trending', getTrendingMovies);
router.get('/details/:id', getMovieDetailsByID);
router.get('/search',searchMovies);

export default router;