const ticketRepository = require('../repositories/ticket.repository');
const { NotFoundError } = require('../utils/errors');

class TicketService {
  async getTicketDetails(id) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new NotFoundError('Ticket not found');

    const comments = await ticketRepository.getComments(id);
    const history = await ticketRepository.getHistory(id);

    return {
      ...ticket,
      comments,
      history
    };
  }

  async listTickets(filters = {}) {
    return await ticketRepository.listTickets(filters);
  }

  async createTicket({ userId, subject, description, priority, category, escalated, escalationReason, rootCauseSuggestion }) {
    // Basic auto-escalation heuristics to predict category & priority if not provided
    let predictedPriority = priority || 'medium';
    let predictedCategory = category || 'general';

    if (escalated) {
      const descLower = description.toLowerCase();
      const subLower = subject.toLowerCase();
      if (descLower.includes('crash') || descLower.includes('broken') || descLower.includes('outage') || subLower.includes('urgent')) {
        predictedPriority = 'urgent';
      } else if (descLower.includes('error') || descLower.includes('fail') || descLower.includes('bug')) {
        predictedPriority = 'high';
      }

      if (descLower.includes('login') || descLower.includes('password') || descLower.includes('auth')) {
        predictedCategory = 'Authentication';
      } else if (descLower.includes('billing') || descLower.includes('payment') || descLower.includes('card')) {
        predictedCategory = 'Billing';
      } else if (descLower.includes('api') || descLower.includes('token') || descLower.includes('integration')) {
        predictedCategory = 'Integrations';
      } else {
        predictedCategory = 'General Support';
      }
    }

    const ticket = await ticketRepository.createTicket({
      userId,
      subject,
      description,
      priority: predictedPriority,
      category: predictedCategory,
      escalated,
      escalationReason,
      rootCauseSuggestion: rootCauseSuggestion || 'Analyzing system logs. Verifying service status.'
    });

    // Log ticket creation event in history
    await ticketRepository.logHistory({
      ticketId: ticket.id,
      changedBy: userId,
      fieldChanged: 'ticket_created',
      oldValue: null,
      newValue: `Ticket created with status: ${ticket.status}, priority: ${ticket.priority}`
    });

    return ticket;
  }

  async updateTicket(id, updates, changedByUserId) {
    const original = await ticketRepository.findById(id);
    if (!original) throw new NotFoundError('Ticket not found');

    const updated = await ticketRepository.updateTicket(id, updates);

    // Compare original and updated fields to write change logs to history
    const fieldsToTrack = {
      status: 'Status',
      priority: 'Priority',
      assigned_to: 'Assignee',
      category: 'Category'
    };

    for (const [field, label] of Object.entries(fieldsToTrack)) {
      const originalValue = original[field];
      const updatedValue = updated[field];

      if (originalValue !== updatedValue) {
        await ticketRepository.logHistory({
          ticketId: id,
          changedBy: changedByUserId,
          fieldChanged: field,
          oldValue: String(originalValue || 'None'),
          newValue: String(updatedValue || 'None')
        });
      }
    }

    return updated;
  }

  async addComment({ ticketId, userId, comment }) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket not found');

    const commentId = await ticketRepository.createComment({ ticketId, userId, comment });
    
    // Log comment event in history
    await ticketRepository.logHistory({
      ticketId,
      changedBy: userId,
      fieldChanged: 'comment_added',
      oldValue: null,
      newValue: `Comment added by user`
    });

    return commentId;
  }

  async deleteTicket(id) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new NotFoundError('Ticket not found');
    await ticketRepository.deleteTicket(id);
  }
}

module.exports = new TicketService();

