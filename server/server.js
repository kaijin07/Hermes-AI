/**
 * server.js - Entry point for the backend application
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './src/config/db.js';
import app from './src/app.js';
import config from './src/config/index.js';

// Establish connection to MongoDB
connectDB();

const PORT = config.port;

const server = createServer(app);

// Allow any origin for Socket.IO since the widget connects from external client domains.
// Security is enforced per-event: visitor rooms are open (UUIDs), business rooms require JWT.
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  // Public: widget visitors and agents viewing a conversation join by visitorId.
  // visitorIds are now UUIDs so guessing one is infeasible.
  socket.on('joinConversation', (roomId) => {
    if (typeof roomId === 'string' && roomId.length <= 128) {
      socket.join(roomId);
    }
  });

  // Private: dashboard joins its business room to receive newTicket events.
  // Requires a valid JWT stored in the HttpOnly cookie sent with the handshake.
  socket.on('joinBusinessRoom', (userId) => {
    if (typeof userId !== 'string') return;

    const cookieHeader = socket.handshake.headers.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (!match) return;

    try {
      const decoded = jwt.verify(match[1], config.jwtSecret);
      if (decoded.id === userId) {
        socket.join(`business:${userId}`);
      }
    } catch {
      // invalid or expired token — silently ignore
    }
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});
