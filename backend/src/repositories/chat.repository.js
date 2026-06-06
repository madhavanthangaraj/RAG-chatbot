const db = require('../config/db');
const crypto = require('crypto');

class ChatRepository {
  async createConversation(userId, origin = 'web') {
    const id = crypto.randomUUID();
    const sql = `INSERT INTO conversations (id, user_id, origin) VALUES (?, ?, ?)`;
    await db.run(sql, [id, userId || null, origin]);
    return { id, user_id: userId, origin };
  }

  async listConversations(userId) {
    const sql = `SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC`;
    return await db.query(sql, [userId]);
  }

  async getConversation(id) {
    const sql = `SELECT * FROM conversations WHERE id = ?`;
    return await db.get(sql, [id]);
  }

  async saveMessage({ conversationId, sender, content, citations, confidenceScore }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO messages (id, conversation_id, sender, content, citations, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.run(sql, [
      id,
      conversationId,
      sender,
      content,
      citations ? JSON.stringify(citations) : null,
      confidenceScore !== undefined ? confidenceScore : null
    ]);
    return id;
  }

  async getMessages(conversationId) {
    const sql = `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`;
    const rows = await db.query(sql, [conversationId]);
    return rows.map(r => ({
      ...r,
      citations: r.citations ? JSON.parse(r.citations) : []
    }));
  }

  async submitFeedback(messageId, rating, comment) {
    const sql = `UPDATE messages SET feedback_rating = ?, feedback_comment = ? WHERE id = ?`;
    await db.run(sql, [rating, comment, messageId]);
  }

  async deleteConversation(id, userId) {
    const sql = `DELETE FROM conversations WHERE id = ? AND user_id = ?`;
    await db.run(sql, [id, userId]);
  }

  async clearAllConversations(userId) {
    const sql = `DELETE FROM conversations WHERE user_id = ?`;
    await db.run(sql, [userId]);
  }
}

module.exports = new ChatRepository();
