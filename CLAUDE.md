# CLAUDE.md

This file gives Claude Code project-specific context for working in the Hermes AI Customer Support repository.

## Project Overview

Hermes AI is a full-stack AI customer support platform. It lets businesses configure a support bot with FAQs, custom instructions, PDFs, and historical ticket context, then embed the bot on external websites with a script tag.

The application is split into:

- `client/`: React 19 + Vite frontend for the landing pages, auth, dashboard, bot configuration, tickets, and chat UI.
- `server/`: Express 5 backend with MongoDB/Mongoose, Socket.IO, auth, bot configuration, ticketing, AI responses, RAG, and the embeddable widget API.

## Important Commands

From the repository root:

```bash
npm run build
npm start
npm run dev:client
npm run dev:server
```

Client commands:

```bash
cd client
npm run dev
npm run build
npm run lint
npm run preview
```

Server commands:

```bash
cd server
npm run dev
npm start
```

There is no meaningful automated test suite currently. The server `npm test` script is a placeholder that exits with an error.

## Runtime Requirements

Root `package.json` declares Node `22.x` for deployment. The server package allows Node `>=18.0.0`.

Required server environment variables:

- `MONGO_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`

Production also requires:

- `JWT_COOKIE_EXPIRE`
- `JWT_EXPIRE`

Common optional/runtime variables:

- `PORT`, default `5000`
- `NODE_ENV`, default `development`
- `CLIENT_URL`, default `http://localhost:5173` in development
- `API_URL`, default `http://localhost:5000`
- `GOOGLE_CLIENT_ID`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

Client environment variables:

- `VITE_API_URL`, default `http://localhost:5000/api`
- `VITE_GOOGLE_CLIENT_ID`

## Backend Architecture

Main backend entry points:

- `server/server.js`: connects MongoDB, creates the HTTP server, attaches Socket.IO, starts listening.
- `server/src/app.js`: configures Express middleware, static serving, CORS, API routes, rate limiting, and SPA fallback.
- `server/src/config/index.js`: loads and validates environment config.
- `server/src/config/db.js`: MongoDB connection.

Backend structure:

- `server/src/routes/`: Express routers.
- `server/src/controllers/`: route handlers.
- `server/src/models/`: Mongoose schemas.
- `server/src/services/`: AI, RAG, and summarization logic.
- `server/src/middleware/`: auth and request validation middleware.
- `server/src/validators/`: Zod validators.
- `server/src/utils/`: shared utility helpers.

Important route groups:

- `/api/auth`: signup, login, Google auth, logout, current user.
- `/api/bot-config`: bot setup, FAQs, instructions, PDF knowledge base.
- `/api/chat`: authenticated dashboard chat.
- `/api/embed`: public widget script and public widget chat.
- `/api/tickets`: escalation ticket workflows.
- `/api/conversations`: widget conversations.
- `/api/messages`: message-related routes.
- `/api/contact`: contact form email.

## Embed Widget Notes

The embed flow is intentionally public and cross-origin:

- `GET /api/embed/script?businessId=...` returns JavaScript.
- The returned script loads `/widget.js` from the configured `API_URL`.
- `POST /api/embed/chat/send` handles public widget messages.
- `server/src/app.js` uses open CORS only for `/api/embed`.
- Static JavaScript files set `Content-Type: application/javascript`, `Cross-Origin-Resource-Policy: cross-origin`, and `Access-Control-Allow-Origin: *` to avoid browser blocking issues.

Be careful when changing `server/src/routes/embedRoutes.js`, `server/src/app.js`, or `server/public/widget.js`; these files affect third-party embed behavior.

## Frontend Architecture

Main frontend entry points:

- `client/src/main.jsx`: React app bootstrap.
- `client/src/App.jsx`: route-level application composition.
- `client/src/api/axiosInstance.js`: shared Axios instance with credentials enabled.

Frontend structure:

- `client/src/pages/`: route pages such as Home, Login, Signup, Dashboard, Chat, Contact, About.
- `client/src/components/`: reusable UI components.
- `client/src/components/dashboard/`: dashboard-specific components.
- `client/src/hooks/`: auth, chat, bot config, tickets, and animation hooks.
- `client/src/services/`: API wrapper functions.
- `client/src/store/`: Redux store and slices.
- `client/src/data/`: static data.

Styling uses Tailwind CSS v4 through the Vite plugin. Animations use GSAP. Icons come from `lucide-react`.

## Development Guidelines

- Preserve the existing full-stack split: client concerns stay in `client/`, server concerns stay in `server/`.
- Use existing service/controller/route/model patterns before adding new abstractions.
- Keep public embed routes compatible with external origins.
- Keep authenticated dashboard API routes on strict CORS with cookies enabled.
- Do not commit `.env`, `client/dist/`, `node_modules/`, or secrets.
- If changing auth, remember the app uses JWTs with HttpOnly cookies.
- If changing API calls from the client, use `client/src/api/axiosInstance.js` or existing service wrappers.
- If changing server validation, prefer the existing Zod validator pattern.
- If changing realtime behavior, check both `server/server.js` Socket.IO events and client Socket.IO usage.

## Manual Verification Checklist

For backend changes:

- Start the server with `npm run dev` inside `server/`.
- Confirm required environment variables are present.
- Exercise the affected API route with the client or an HTTP client.
- For embed changes, test through an HTTP-served page, not a `file://` HTML file.

For frontend changes:

- Start the client with `npm run dev` inside `client/`.
- Run `npm run lint` inside `client/` when practical.
- Check desktop and mobile layouts for changed screens.

For deployment-related changes:

- Run the root `npm run build`.
- Confirm the server can serve `client/dist` through the SPA fallback.
- Confirm `API_URL` and `CLIENT_URL` are correct for production.
