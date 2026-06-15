import Chat from '../models/Chat.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params; // userId corresponds to visitorId
  const businessId = req.user.id;

  const chat = await Chat.findOne({ businessId, visitorId: userId });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  res.status(200).json({ success: true, data: chat });
});

export const sendMessageAgent = asyncHandler(async (req, res) => {
  const { userId, message } = req.body;
  const businessId = req.user.id;

  if (!userId || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'userId and message are required' });
  }

  const chat = await Chat.findOne({ businessId, visitorId: userId });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  const newMessage = { sender: 'agent', text: message.trim() };
  chat.messages.push(newMessage);
  await chat.save();

  const io = req.app.get('io');
  if (io) {
    io.to(userId).emit('newMessage', newMessage);
  }

  res.status(200).json({ success: true, data: newMessage });
});

export const toggleHumanTakeover = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { takeover } = req.body;
  const businessId = req.user.id;

  const chat = await Chat.findOne({ businessId, visitorId: userId });
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  chat.humanTakeover = takeover;
  await chat.save();
  
  res.status(200).json({ success: true, data: chat });
});
