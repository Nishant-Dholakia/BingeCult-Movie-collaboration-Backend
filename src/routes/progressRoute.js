import express from 'express';
const router = express.Router();
import { updateProgress, toggleEpisodeCompletion } from '../controllers/progressController.js';
// Movie/Series progress update
router.post('/update', updateProgress);

// Episode-specific progress toggle
router.post('/episode-toggle', toggleEpisodeCompletion);

export default router;