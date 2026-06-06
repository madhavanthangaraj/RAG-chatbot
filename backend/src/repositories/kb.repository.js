const db = require('../config/db');
const crypto = require('crypto');

class KbRepository {
  async findById(id) {
    const sql = `SELECT * FROM kb_articles WHERE id = ?`;
    return await db.get(sql, [id]);
  }

  async listArticles() {
    const sql = `SELECT * FROM kb_articles ORDER BY updated_at DESC`;
    return await db.query(sql);
  }

  async createArticle({ title, content, sourceType, sourcePath, checksum }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO kb_articles (id, title, content, source_type, source_path, checksum, version)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    await db.run(sql, [id, title, content, sourceType || 'manual', sourcePath || null, checksum || null]);
    return await this.findById(id);
  }

  async updateArticle(id, { title, content, version, checksum }) {
    const sql = `
      UPDATE kb_articles
      SET title = ?, content = ?, version = ?, checksum = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, [title, content, version, checksum, id]);
    return await this.findById(id);
  }

  async deleteArticle(id) {
    const sql = `DELETE FROM kb_articles WHERE id = ?`;
    await db.run(sql, [id]);
  }

  // Versioning
  async createVersion({ articleId, version, title, content, checksum, createdBy }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO kb_article_versions (id, article_id, version, title, content, checksum, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.run(sql, [id, articleId, version, title, content, checksum || null, createdBy || null]);
  }

  async getVersionHistory(articleId) {
    const sql = `
      SELECT v.*, u.username as creator_name 
      FROM kb_article_versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.article_id = ?
      ORDER BY v.version DESC
    `;
    return await db.query(sql, [articleId]);
  }

  async findVersion(articleId, versionNumber) {
    const sql = `
      SELECT * FROM kb_article_versions 
      WHERE article_id = ? AND version = ?
    `;
    return await db.get(sql, [articleId, versionNumber]);
  }

  // Fallback search
  async searchArticles(term) {
    if (!term || term.trim() === '') {
      return [];
    }

    // Get all articles
    const articles = await this.listArticles();
    
    // Normalize and tokenize term
    const stopwords = new Set(["how", "to", "the", "a", "an", "is", "of", "for", "in", "on", "at", "with", "by", "and", "or", "about", "your", "my", "me", "please", "can", "you", "give", "i", "need", "do"]);
    const cleanTerm = term.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
    const queryWords = cleanTerm.split(/\s+/).filter(w => w && !stopwords.has(w));
    
    if (queryWords.length === 0) {
      // If only stopwords were provided, use the original words
      queryWords.push(...cleanTerm.split(/\s+/).filter(w => w));
    }
    
    const matches = [];
    for (const art of articles) {
      const cleanTitle = art.title.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
      const titleWords = new Set(cleanTitle.split(/\s+/).filter(w => w));
      
      const cleanContent = art.content.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
      
      let score = 0;
      let titleMatches = 0;
      for (const qw of queryWords) {
        // Exact match or substring match in title words
        if (titleWords.has(qw)) {
          score += 10;
          titleMatches++;
        } else {
          // Check if it's a substring of the title
          if (cleanTitle.includes(qw)) {
            score += 5;
            titleMatches++;
          }
        }
        
        // Match in content
        if (cleanContent.includes(qw)) {
          score += 1;
        }
      }
      
      if (score > 0) {
        // Boost if all query words matched the title
        if (titleMatches === queryWords.length) {
          score += 20;
        }
        matches.push({ article: art, score });
      }
    }
    
    // Sort descending by score, and then by effectiveness_score
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (b.article.effectiveness_score || 0) - (a.article.effectiveness_score || 0);
    });
    
    return matches.map(m => m.article);
  }
}

module.exports = new KbRepository();
