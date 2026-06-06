const db = require('../config/db');
const crypto = require('crypto');

class TicketRepository {
  async findById(id) {
    const sql = `
      SELECT t.*, 
             u.username as creator_name, 
             u.email as creator_email,
             a.username as assignee_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
      WHERE t.id = ?
    `;
    return await db.get(sql, [id]);
  }

  async listTickets(filters = {}) {
    let sql = `
      SELECT t.*, 
             u.username as creator_name, 
             a.username as assignee_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users a ON t.assigned_to = a.id
    `;
    const params = [];
    const conditions = [];

    if (filters.status) {
      conditions.push('t.status = ?');
      params.push(filters.status);
    }
    if (filters.priority) {
      conditions.push('t.priority = ?');
      params.push(filters.priority);
    }
    if (filters.assigned_to) {
      conditions.push('t.assigned_to = ?');
      params.push(filters.assigned_to);
    }
    if (filters.user_id) {
      conditions.push('t.user_id = ?');
      params.push(filters.user_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY t.created_at DESC';
    return await db.query(sql, params);
  }

  async createTicket({ userId, subject, description, priority, category, escalated, escalationReason, rootCauseSuggestion }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO tickets (id, user_id, subject, description, priority, category, escalated, escalation_reason, root_cause_suggestion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.run(sql, [
      id, 
      userId || null, 
      subject, 
      description, 
      priority || 'medium', 
      category || 'general', 
      escalated ? 1 : 0, 
      escalationReason || null, 
      rootCauseSuggestion || null
    ]);
    return await this.findById(id);
  }

  async updateTicket(id, updates = {}) {
    const fields = [];
    const params = [];

    const allowedUpdates = {
      status: 'status',
      priority: 'priority',
      assigned_to: 'assigned_to',
      assignedTo: 'assigned_to',
      category: 'category',
      escalated: 'escalated',
      escalation_reason: 'escalation_reason',
      escalationReason: 'escalation_reason',
      root_cause_suggestion: 'root_cause_suggestion',
      rootCauseSuggestion: 'root_cause_suggestion'
    };
    
    for (const [key, dbKey] of Object.entries(allowedUpdates)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbKey} = ?`);
        params.push(updates[key]);
      }
    }

    if (fields.length === 0) return await this.findById(id);

    params.push(id);
    const sql = `
      UPDATE tickets
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await db.run(sql, params);
    return await this.findById(id);
  }

  // Comments
  async createComment({ ticketId, userId, comment }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO ticket_comments (id, ticket_id, user_id, comment)
      VALUES (?, ?, ?, ?)
    `;
    await db.run(sql, [id, ticketId, userId, comment]);
    return id;
  }

  async getComments(ticketId) {
    const sql = `
      SELECT c.*, u.username as commenter_name, u.role as commenter_role
      FROM ticket_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `;
    return await db.query(sql, [ticketId]);
  }

  // History Log
  async logHistory({ ticketId, changedBy, fieldChanged, oldValue, newValue }) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO ticket_history (id, ticket_id, changed_by, field_changed, old_value, new_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.run(sql, [id, ticketId, changedBy, fieldChanged, oldValue || null, newValue || null]);
  }

  async getHistory(ticketId) {
    const sql = `
      SELECT h.*, u.username as changer_name, u.role as changer_role
      FROM ticket_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.ticket_id = ?
      ORDER BY h.created_at DESC
    `;
    return await db.query(sql, [ticketId]);
  }
}

module.exports = new TicketRepository();
