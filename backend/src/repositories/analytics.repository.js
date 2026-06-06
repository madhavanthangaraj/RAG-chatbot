const db = require('../config/db');
const crypto = require('crypto');

class AnalyticsRepository {
  async logEvent({ eventType, query, resolvedArticleId, userId }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO analytics_events (id, event_type, query, resolved_article_id, user_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.run(sql, [id, eventType, query || null, resolvedArticleId || null, userId || null]);
    return id;
  }

  async getDashboardSummary() {
    const totalQuestionsSql = `SELECT COUNT(*) as count FROM messages WHERE sender = 'user'`;
    const totalResolvedSql = `SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'search_success'`;
    const totalEscalatedSql = `SELECT COUNT(*) as count FROM tickets WHERE escalated = 1`;
    
    const questions = await db.get(totalQuestionsSql);
    const resolved = await db.get(totalResolvedSql);
    const escalated = await db.get(totalEscalatedSql);

    return {
      totalQuestions: questions ? questions.count : 0,
      resolvedQuestions: resolved ? resolved.count : 0,
      escalatedQuestions: escalated ? escalated.count : 0
    };
  }

  async getFailedSearches(limit = 10) {
    const sql = `
      SELECT query, COUNT(*) as count, MAX(created_at) as last_occurred
      FROM analytics_events
      WHERE event_type = 'search_fail'
      GROUP BY query
      ORDER BY count DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  async getTopArticles(limit = 10) {
    const sql = `
      SELECT a.id, a.title, a.source_type, COUNT(e.id) as views, a.effectiveness_score
      FROM kb_articles a
      LEFT JOIN analytics_events e ON a.id = e.resolved_article_id AND e.event_type = 'search_success'
      GROUP BY a.id
      ORDER BY views DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  async getTrendingIssues(limit = 5) {
    const sql = `
      SELECT category, COUNT(*) as count, 
             SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
             SUM(CASE WHEN priority = 'urgent' OR priority = 'high' THEN 1 ELSE 0 END) as critical_count
      FROM tickets
      GROUP BY category
      ORDER BY count DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  async getUserMetrics() {
    const activeUsersSql = `SELECT COUNT(DISTINCT user_id) as active_users FROM conversations WHERE user_id IS NOT NULL`;
    const ratingsSql = `
      SELECT AVG(feedback_rating) as avg_rating,
             COUNT(feedback_rating) as total_ratings,
             COUNT(CASE WHEN feedback_rating >= 4 THEN 1 END) as positive_ratings
      FROM messages
      WHERE feedback_rating IS NOT NULL
    `;
    
    const activeUsersRow = await db.get(activeUsersSql);
    const ratingsRow = await db.get(ratingsSql);

    const activeUsers = activeUsersRow ? activeUsersRow.active_users : 0;
    const avgRating = ratingsRow && ratingsRow.avg_rating ? parseFloat(ratingsRow.avg_rating.toFixed(2)) : 0;
    const totalRatings = ratingsRow ? ratingsRow.total_ratings : 0;
    const positiveRatings = ratingsRow ? ratingsRow.positive_ratings : 0;
    
    const satisfactionRate = totalRatings > 0 
      ? parseFloat(((positiveRatings / totalRatings) * 100).toFixed(2)) 
      : 100.0;

    return {
      activeUsers,
      averageSatisfaction: avgRating,
      satisfactionRatePct: satisfactionRate,
      totalFeedbackCount: totalRatings
    };
  }

  async updateArticleEffectiveness(articleId) {
    const matchesSql = `
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE resolved_article_id = ? AND event_type = 'search_success'
    `;
    
    const escalationsSql = `
      SELECT COUNT(DISTINCT t.id) as count
      FROM tickets t
      JOIN conversations c ON t.user_id = c.user_id
      JOIN messages m ON c.id = m.conversation_id
      WHERE m.citations LIKE ? AND t.escalated = 1
    `;

    const matches = await db.get(matchesSql, [articleId]);
    const escalations = await db.get(escalationsSql, [`%${articleId}%`]);

    const matchCount = matches ? matches.count : 0;
    const escalationCount = escalations ? escalations.count : 0;
    
    const total = matchCount + escalationCount;
    const effectivenessScore = total > 0 ? parseFloat((matchCount / total).toFixed(2)) : 0.0;

    const updateSql = `UPDATE kb_articles SET effectiveness_score = ? WHERE id = ?`;
    await db.run(updateSql, [effectivenessScore, articleId]);
  }
}

module.exports = new AnalyticsRepository();
