const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db'); // your MongoDB connection
const authRoute = require('./src/routes/authRoute'); 
const profileRoute = require('./src/routes/profileRoute'); 

require('dotenv').config();

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());// for application/json req res

// Routes
app.use('/api/auth', authRoute);
app.use('/api/profile', profileRoute);


// Connect to DB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
