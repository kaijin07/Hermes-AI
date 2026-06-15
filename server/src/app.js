/**
 * app.js - Express Application Configuration
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import globalErrorHandler from './controllers/errorController.js';

// Import route handlers
import authRoutes from './routes/authRoutes.js'
import chatRoutes from './routes/chatRoutes.js';
import botConfigRoutes from './routes/botConfigRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import embedRoutes from './routes/embedRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_PATH = path.join(__dirname, '..', '..', 'client', 'dist');

const app = express();

// --- PROXY TRUST ---
// Required for Render/Heroku so express-rate-limit sees the real user IP
app.set('trust proxy', 1);

// --- GLOBAL MIDDLEWARE ---

app.use(
  helmet({
    // Allows external sites to load your assets (fixes ORB)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Allows Google OAuth popup to communicate with the main window
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc:      ["'self'"],
        // @react-oauth/google injects accounts.google.com/gsi/client at runtime
        scriptSrc:       ["'self'", 'https://accounts.google.com'],
        // block inline onclick= and similar
        scriptSrcAttr:   ["'none'"],
        // react-hot-toast injects a <style> tag at runtime → needs unsafe-inline
        styleSrc:        ["'self'", "'unsafe-inline'"],
        imgSrc:          ["'self'", 'data:'],
        fontSrc:         ["'self'", 'data:'],
        // covers same-origin API calls + wss:// Socket.IO + Google GSI XHR
        connectSrc:      ["'self'", 'https://accounts.google.com'],
        // Google Sign-In button and One Tap render inside an accounts.google.com iframe
        frameSrc:        ["'self'", 'https://accounts.google.com'],
        objectSrc:       ["'none'"],
        baseUri:         ["'self'"],
        formAction:      ["'self'"],
        // prevent this app from being framed on other sites (clickjacking defence)
        frameAncestors:  ["'none'"],
      },
    },
  })
);

// Robust static serving: Adds correct MIME types and CORP headers to JS files
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Access-Control-Allow-Origin', '*');
    }
  }
}));

app.use(express.static(DIST_PATH));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
});

// Separate, looser limit for the public embed chat endpoint
const embedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many messages, please slow down' },
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- CORS CONFIGURATION ---
// Strict CORS for dashboard endpoints
const strictCors = cors({
  origin: config.env === 'production' && config.clientUrl ? config.clientUrl : [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
});

// Open CORS for public embed widget (no credentials — widget chat is public)
const openCors = cors({ origin: true });

// --- API ROUTES ---
app.use('/api/embed', openCors, embedLimiter, embedRoutes); // Widget is embedded on external domains, needs open CORS

app.use('/api/auth', strictCors, limiter, authRoutes);
app.use('/api/chat', strictCors, limiter, chatRoutes);
app.use('/api/bot-config', strictCors, limiter, botConfigRoutes);
app.use('/api/tickets', strictCors, limiter, ticketRoutes);
app.use('/api/conversations', strictCors, limiter, conversationRoutes);
app.use('/api/messages', strictCors, limiter, messageRoutes);
app.use('/api/contact', strictCors, limiter, contactRoutes);

// --- SPA FALLBACK ---
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.use(globalErrorHandler);

export default app;