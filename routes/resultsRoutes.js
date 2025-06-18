const express = require('express');
const { getMyResults } = require('../controllers/resultsController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/my', protect, getMyResults);

module.exports = router; 