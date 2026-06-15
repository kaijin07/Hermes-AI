import Ticket from '../models/Ticket.js';
import Chat from '../models/Chat.js';
import TicketSummary from '../models/TicketSummary.js';
import { shouldSummarize, summarizeConversation } from '../services/summarizationService.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Shared helper: summarizes a conversation (if long enough) into
 * the TicketSummary knowledge base, then deletes the raw chat document.
 * This is called on both CLOSE and DELETE so no path leaves orphan data.
 *
 * @param {import('../models/Ticket.js').default} ticket
 */
const summarizeAndClean = async (ticket) => {
  const chat = await Chat.findOne({
    businessId: ticket.businessId,
    visitorId: ticket.visitorId,
  });

  if (!chat) return;

  const messages = chat.messages || [];

  if (shouldSummarize(messages)) {
    // Only summarize if we haven't already stored one for this ticket
    const alreadySummarized = await TicketSummary.exists({ ticketId: ticket._id });

    if (!alreadySummarized) {
      const { problem, resolution, keywords } = await summarizeConversation(messages);

      await TicketSummary.create({
        businessId: ticket.businessId,
        ticketId: ticket._id,
        visitorId: ticket.visitorId,
        problem,
        resolution,
        keywords,
      });
    }
  }

  // Always delete the raw chat to prevent orphaned data
  await Chat.deleteOne({ _id: chat._id });
};

/**
 * @desc    Get all tickets for a business
 * @route   GET /api/tickets
 * @access  Private
 */
export const getTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ businessId: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: tickets });
});

const VALID_STATUSES = ['open', 'in_progress', 'closed'];

/**
 * @desc    Update ticket status
 * @route   PUT /api/tickets/:id
 * @access  Private
 */
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  const ticket = await Ticket.findOne({ _id: id, businessId: req.user.id });

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  ticket.status = status;
  await ticket.save();

  // On close: summarize conversation + clean up raw messages
  if (status === 'closed') {
    summarizeAndClean(ticket).catch(() => {});
    await Chat.findOneAndUpdate(
      { businessId: ticket.businessId, visitorId: ticket.visitorId },
      { $set: { humanTakeover: false } }
    );
  }

  res.status(200).json({ success: true, data: ticket });
});

/**
 * @desc    Delete a ticket
 * @route   DELETE /api/tickets/:id
 * @access  Private
 */
export const deleteTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ticket = await Ticket.findOne({ _id: id, businessId: req.user.id });

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Summarize + clean chat before removing ticket
  await summarizeAndClean(ticket);

  await ticket.deleteOne();

  res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
});