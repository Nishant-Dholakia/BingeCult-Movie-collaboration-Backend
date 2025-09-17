import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './src/config/db.js';
import authRoute from './src/routes/authRoute.js';
import profileRoute from './src/routes/profileRoute.js';
import movieRoute from './src/routes/movieRoute.js';
import groupRoute from './src/routes/groupRoute.js';
import cors from 'cors';

const app = express();
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(cookieParser());
app.use(express.json()); // for application/json req res

// Routes
app.use('/api/auth', authRoute);
app.use('/api/profile', profileRoute);
app.use('/api/movie', movieRoute);
app.use('/api/group',groupRoute);

// Connect to DB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
