const kbService = require('./kb.service');
const chatRepository = require('../repositories/chat.repository');
const ticketService = require('./ticket.service');
const analyticsService = require('./analytics.service');
const mcpService = require('./mcp.service');
const logger = require('../utils/logger');

class ChatService {
  async processMessage(userId, message, conversationId = null) {
    let convId = conversationId;
    if (!convId) {
      const newConv = await chatRepository.createConversation(userId, 'web');
      convId = newConv.id;
    }

    await chatRepository.saveMessage({
      conversationId: convId,
      sender: 'user',
      content: message
    });

    let reply = "";
    let confidenceScore = 0.0;
    let citations = [];
    let suggestedFollowups = [];
    let escalated = false;
    let ticketId = null;

    try {
      // Forward the user query to the AI Service ReAct Agent loop / RAG pipeline
      const aiResponse = await mcpService.agentQuery(userId, message);
      
      reply = aiResponse.reply;
      confidenceScore = aiResponse.confidenceScore;
      citations = aiResponse.citations;
      suggestedFollowups = aiResponse.suggestedFollowups;
      escalated = aiResponse.escalated || false;
      ticketId = aiResponse.ticketId || null;

      // Log successful analytics event
      if (escalated) {
        await analyticsService.logEvent({
          eventType: 'ticket_escalation',
          query: message,
          userId
        });
      } else {
        const primaryArticleId = (citations && citations.length > 0) ? citations[0].article_id : null;
        await analyticsService.logEvent({
          eventType: 'search_success',
          query: message,
          resolvedArticleId: primaryArticleId,
          userId
        });
      }

    } catch (err) {
      // AI Service offline or failed: Log details and fall back to local keyword matching RAG
      logger.warn(`AI Service connection failed: ${err.message}. Falling back to local RAG search.`);
      const articles = await kbService.search(message);

      let topArticle = null;
      let localConfidence = 0.0;

      if (articles.length > 0) {
        topArticle = articles[0];
        const cleanQuery = message.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cleanTitleStr = topArticle.title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        
        if (cleanQuery === cleanTitleStr && cleanQuery !== '') {
          localConfidence = 1.0;
        } else {
          const queryWords = message.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase().split(/\s+/).filter(w => w);
          const titleWords = topArticle.title.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase().split(/\s+/).filter(w => w);
          
          let matchedCount = 0;
          for (const qw of queryWords) {
            if (titleWords.includes(qw)) {
              matchedCount++;
            }
          }
          localConfidence = queryWords.length > 0 ? (matchedCount / queryWords.length) : 0.0;
          localConfidence = Math.min(Math.round(localConfidence * 100) / 100, 1.0);
        }
      }

      if (topArticle && localConfidence > 0.30) {
        reply = `According to our guide "${topArticle.title}":\n\n${topArticle.content}\n\nHope this helps! Let me know if you need anything else.`;
        confidenceScore = localConfidence; 
        citations = [
          {
            article_id: topArticle.id,
            title: topArticle.title,
            snippet: topArticle.content.substring(0, 150) + '...'
          }
        ];
        suggestedFollowups = [
          `Where can I find more details on ${topArticle.title}?`,
          "What are the prerequisites for this?"
        ];

        await analyticsService.logEvent({
          eventType: 'search_success',
          query: message,
          resolvedArticleId: topArticle.id,
          userId
        });
      } else {
        reply = "No relevant Knowledge Base article was found for your request.";
        confidenceScore = 0.0; 
        citations = [];
        suggestedFollowups = [
          "Track my escalated ticket status",
          "How long does manual ticket resolution take?"
        ];

        await analyticsService.logEvent({
          eventType: 'search_fail',
          query: message,
          userId
        });

        const ticket = await ticketService.createTicket({
          userId,
          subject: `Auto-escalated query: ${message.substring(0, 40)}...`,
          description: `Customer asked: "${message}". AI could not locate matching knowledge base guides.`,
          escalated: true,
          escalationReason: 'Low confidence AI search results fallback'
        });

        escalated = true;
        ticketId = ticket.id;
        reply = "No relevant Knowledge Base article was found for your request.\n\n" +
                "📝 A support ticket has been automatically created and assigned to the appropriate support team for further investigation. Our team will review your request and respond as soon as possible.\n\n" +
                "Thank you for your patience.";

        await analyticsService.logEvent({
          eventType: 'ticket_escalation',
          query: message,
          userId
        });
      }
    }


    const aiMessageId = await chatRepository.saveMessage({
      conversationId: convId,
      sender: 'ai',
      content: reply,
      citations,
      confidenceScore
    });

    return {
      aiMessageId,
      conversationId: convId,
      reply,
      confidenceScore,
      citations,
      suggestedFollowups,
      escalated,
      ticketId
    };
  }

  async getConversationHistory(conversationId) {
    return await chatRepository.getMessages(conversationId);
  }

  async listUserConversations(userId) {
    return await chatRepository.listConversations(userId);
  }

  async submitMessageFeedback(messageId, rating, comment) {
    await chatRepository.submitFeedback(messageId, rating, comment);
  }

  async deleteUserConversation(id, userId) {
    await chatRepository.deleteConversation(id, userId);
  }

  async clearUserHistory(userId) {
    await chatRepository.clearAllConversations(userId);
  }
}

module.exports = new ChatService();
