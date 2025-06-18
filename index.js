const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const otpRoutes = require('./routes/otpRoutes');
const userRoutes = require('./routes/userRoutes');
const resultsRoutes = require('./routes/resultsRoutes');

// Load environment variables
dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// Authentication middleware (basic implementation)
// const protect = require('./middleware/authMiddleware');

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount quiz routes (each route handles its own protection middleware)
app.use('/api/quizzes', quizRoutes);

// Mount OTP routes
app.use('/api/otp', otpRoutes);

// Mount user routes (teacher/student utility endpoints)
app.use('/api/users', userRoutes);
app.use('/api/results', resultsRoutes);

// Error handling middleware (optional, but recommended)
// app.use(errorHandler); // You would define an error handling middleware

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));