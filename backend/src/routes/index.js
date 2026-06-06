const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const chatRoutes = require('./chat.routes');
const ticketRoutes = require('./ticket.routes');
const kbRoutes = require('./kb.routes');
const analyticsRoutes = require('./analytics.routes');

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/tickets', ticketRoutes);
router.use('/kb', kbRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
