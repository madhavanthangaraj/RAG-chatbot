const db = require('../config/db');
const crypto = require('crypto');

class UserRepository {
  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    return await db.get(sql, [email]);
  }

  async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ?`;
    return await db.get(sql, [id]);
  }

  async createUser({ username, email, passwordHash, role }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO users (id, username, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.run(sql, [id, username, email, passwordHash, role || 'user']);
    return this.findById(id);
  }

  async updateRefreshToken(id, refreshToken) {
    const sql = `UPDATE users SET refresh_token = ? WHERE id = ?`;
    await db.run(sql, [refreshToken, id]);
  }
}

module.exports = new UserRepository();
