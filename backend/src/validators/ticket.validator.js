const { z } = require('zod');

const createTicketSchema = z.object({
  subject: z.string().min(5).max(100),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  escalated: z.boolean().optional(),
  escalationReason: z.string().optional()
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().nullable().optional(),
  category: z.string().optional(),
  rootCauseSuggestion: z.string().optional()
});

const commentSchema = z.object({
  comment: z.string().min(1).max(1000)
});

module.exports = {
  createTicketSchema,
  updateTicketSchema,
  commentSchema
};
