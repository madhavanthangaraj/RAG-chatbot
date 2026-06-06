const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/message', chatController.sendMessage);
router.get('/history', chatController.getHistory);
router.get('/conversations', chatController.listConversations);
router.post('/messages/:messageId/feedback', chatController.submitFeedback);
router.delete('/conversations/:id', chatController.deleteConversation);
router.delete('/conversations', chatController.clearConversations);

module.exports = router;
