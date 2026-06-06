const chatService = require('../services/chat.service');
const chatRepository = require('../repositories/chat.repository');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

class ChatController {
  async sendMessage(req, res, next) {
    try {
      const { message, conversationId } = req.body;
      const userId = req.user ? req.user.id : null;

      if (conversationId && req.user.role === 'user') {
        const conv = await chatRepository.getConversation(conversationId);
        if (conv && conv.user_id !== userId) {
          throw new ForbiddenError('You do not have access to this conversation');
        }
      }

      const result = await chatService.processMessage(userId, message, conversationId);
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { conversationId } = req.query;
      const userId = req.user ? req.user.id : null;

      if (!conversationId) {
        return res.status(200).json({ status: 'success', data: [] });
      }

      const conv = await chatRepository.getConversation(conversationId);
      if (!conv) {
        throw new NotFoundError('Conversation not found');
      }

      if (req.user.role === 'user' && conv.user_id !== userId) {
        throw new ForbiddenError('You do not have access to this conversation');
      }

      const history = await chatService.getConversationHistory(conversationId);
      res.status(200).json({
        status: 'success',
        data: history
      });
    } catch (err) {
      next(err);
    }
  }

  async listConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const conversations = await chatService.listUserConversations(userId);
      res.status(200).json({
        status: 'success',
        results: conversations.length,
        data: conversations
      });
    } catch (err) {
      next(err);
    }
  }

  async submitFeedback(req, res, next) {
    try {
      const { rating, comment } = req.body;
      const { messageId } = req.params;

      await chatService.submitMessageFeedback(messageId, rating, comment);
      res.status(200).json({
        status: 'success',
        message: 'Feedback submitted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await chatService.deleteUserConversation(id, userId);
      res.status(200).json({
        status: 'success',
        message: 'Conversation deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async clearConversations(req, res, next) {
    try {
      const userId = req.user.id;
      await chatService.clearUserHistory(userId);
      res.status(200).json({
        status: 'success',
        message: 'All conversations cleared successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChatController();
