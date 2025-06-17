const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const otpRoutes = require('./routes/otpRoutes');

// Load environment variables
dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// Authentication middleware (basic implementation)
const protect = require('./middleware/authMiddleware');

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount quiz routes (protected)
app.use('/api/quizzes', protect, quizRoutes);

// Mount OTP routes
app.use('/api/otp', otpRoutes);

// Error handling middleware (optional, but recommended)
// app.use(errorHandler); // You would define an error handling middleware

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));