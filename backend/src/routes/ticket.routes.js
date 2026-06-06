const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const validate = require('../middlewares/validate.middleware');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { createTicketSchema, updateTicketSchema, commentSchema } = require('../validators/ticket.validator');

router.use(protect);

router.post('/', validate(createTicketSchema), ticketController.createTicket);
router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);

router.put('/:id', restrictTo('admin', 'support_agent'), validate(updateTicketSchema), ticketController.updateTicket);
router.post('/:id/comments', validate(commentSchema), ticketController.createComment);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;

