const ticketService = require('../services/ticket.service');
const { ForbiddenError } = require('../utils/errors');

class TicketController {
  async createTicket(req, res, next) {
    try {
      const { subject, description, priority, category, escalated, escalationReason } = req.body;
      const ticket = await ticketService.createTicket({
        userId: req.user ? req.user.id : null,
        subject,
        description,
        priority,
        category,
        escalated,
        escalationReason
      });
      res.status(201).json({
        status: 'success',
        data: ticket
      });
    } catch (err) {
      next(err);
    }
  }

  async listTickets(req, res, next) {
    try {
      const filters = {};
      
      // Access Scoping: Customer role only sees their own
      if (req.user.role === 'user') {
        filters.user_id = req.user.id;
      } else {
        if (req.query.userId) filters.user_id = req.query.userId;
        if (req.query.assignedTo) filters.assigned_to = req.query.assignedTo;
      }

      if (req.query.status) filters.status = req.query.status;
      if (req.query.priority) filters.priority = req.query.priority;

      const tickets = await ticketService.listTickets(filters);
      res.status(200).json({
        status: 'success',
        results: tickets.length,
        data: tickets
      });
    } catch (err) {
      next(err);
    }
  }

  async getTicketById(req, res, next) {
    try {
      const details = await ticketService.getTicketDetails(req.params.id);
      
      // Scoping verify
      if (req.user.role === 'user' && details.user_id !== req.user.id) {
        throw new ForbiddenError('You do not have access to view this ticket');
      }

      res.status(200).json({
        status: 'success',
        data: details
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTicket(req, res, next) {
    try {
      const { status, priority, assignedTo, category, rootCauseSuggestion } = req.body;
      const updates = {
        status,
        priority,
        assigned_to: assignedTo,
        category,
        root_cause_suggestion: rootCauseSuggestion
      };

      const ticket = await ticketService.updateTicket(req.params.id, updates, req.user.id);
      res.status(200).json({
        status: 'success',
        data: ticket
      });
    } catch (err) {
      next(err);
    }
  }

  async createComment(req, res, next) {
    try {
      const { comment } = req.body;
      const details = await ticketService.getTicketDetails(req.params.id);

      // Scoping verify
      if (req.user.role === 'user' && details.user_id !== req.user.id) {
        throw new ForbiddenError('You do not have access to comment on this ticket');
      }

      const commentId = await ticketService.addComment({
        ticketId: req.params.id,
        userId: req.user.id,
        comment
      });

      res.status(201).json({
        status: 'success',
        commentId,
        message: 'Comment posted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteTicket(req, res, next) {
    try {
      const details = await ticketService.getTicketDetails(req.params.id);
      
      // Access verify: User can delete their own ticket, support/admin can delete any
      if (req.user.role === 'user' && details.user_id !== req.user.id) {
        throw new ForbiddenError('You do not have access to delete this ticket');
      }

      await ticketService.deleteTicket(req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Ticket deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TicketController();

