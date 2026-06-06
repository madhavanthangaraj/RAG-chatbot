const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

router.get('/dashboard', protect, restrictTo('admin', 'support_agent'), analyticsController.getDashboardMetrics);

module.exports = router;
