# Hermes AI — System Design

> **How to read this doc:** Start with the Architecture Overview to understand the big picture, then read each section in order. Notes marked `📝` are explanations written for you specifically — they explain *why* something is designed the way it is, not just *what* it is.

---

## 1. Architecture Overview

```
                        INTERNET
                           │
                    ┌──────▼──────┐
                    │   Browser   │
                    │  (Customer) │
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────▼──────────────────────┐
                    │        Render / AWS EC2      │
                    │                              │
                    │   ┌─────────────────────┐    │
                    │   │     nginx (proxy)    │    │
                    │   └──────────┬──────────┘    │
                    │              │                │
                    │   ┌──────────▼──────────┐    │
                    │   │   Node.js / Express  │    │
                    │   │                      │    │
                    │   │  ┌────────────────┐  │    │
                    │   │  │  REST API      │  │    │
                    │   │  │  /api/*        │  │    │
                    │   │  └────────────────┘  │    │
                    │   │  ┌────────────────┐  │    │
                    │   │  │  Socket.IO     │  │    │
                    │   │  │  (WebSockets)  │  │    │
                    │   │  └────────────────┘  │    │
                    │   │  ┌────────────────┐  │    │
                    │   │  │  Static Files  │  │    │
                    │   │  │  React Build   │  │    │
                    │   │  └────────────────┘  │    │
                    │   └──────────────────────┘    │
                    └──────────────┬────────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │                   │                   │
        ┌──────▼──────┐   ┌────────▼───────┐  ┌───────▼──────┐
        │   MongoDB   │   │   Groq API     │  │  Gmail SMTP  │
        │   Atlas     │   │ (Llama 3.1 AI) │  │  (Nodemailer)│
        └─────────────┘   └────────────────┘  └──────────────┘
```

📝 **What this means:** Right now everything runs in one process on one server. The React frontend is compiled into static files and served directly by Express — there's no separate frontend server. This is called a **monolith**. It's simple, cheap, and perfectly fine for where you are now.

---

## 2. How a Widget Chat Message Flows

This is the most complex flow in the system. A visitor on a third-party website types a message — here's exactly what happens:

```
Third-party Website (e.g. client's e-commerce site)
       │
       │  1. Page loads, script tag fires:
       │     <script src="https://yourapp.com/api/embed/script?businessId=xxx">
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  GET /api/embed/script?businessId=xxx               │
│                                                     │
│  Server responds with a small JavaScript snippet    │
│  that injects widget.js into the page               │
└───────────────────────┬─────────────────────────────┘
                        │
                        │  2. widget.js loads, creates the chat UI
                        │     Generates a visitorId (UUID)
                        │     Connects to Socket.IO for real-time updates
                        ▼
┌─────────────────────────────────────────────────────┐
│  Visitor types a message and hits Send              │
│                                                     │
│  POST /api/embed/chat/send                          │
│  Body: { businessId, visitorId, text, userName }    │
└───────────────────────┬─────────────────────────────┘
                        │
                        │  3. chatController.sendMessage runs:
                        ▼
              ┌─────────────────────┐
              │ Does business exist?│
              │ User.findById()     │──── No ──▶ 404 response
              └──────────┬──────────┘
                         │ Yes
                         ▼
              ┌─────────────────────┐
              │ Is humanTakeover    │
              │ active on this chat?│──── Yes ──▶ Return empty, agent handles it
              └──────────┬──────────┘
                         │ No
                         ▼
              ┌─────────────────────┐
              │ Does message match  │
              │ a FAQ exactly?      │──── Yes ──▶ Return FAQ answer (no AI call)
              └──────────┬──────────┘
                         │ No
                         ▼
              ┌─────────────────────┐
              │ RAG lookup:         │
              │ find similar past   │
              │ ticket resolutions  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Call Groq AI        │
              │ (Llama 3.1)         │
              │                     │
              │ System prompt has:  │
              │ - FAQs              │
              │ - Instructions      │
              │ - PDF knowledge     │
              │ - RAG context       │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Did AI reply        │
              │ include             │
              │ ESCALATE_TICKET?    │──── Yes ──▶ Create Ticket in DB
              └──────────┬──────────┘             Emit 'newTicket' via Socket.IO
                         │                        to business dashboard
                         │ No
                         ▼
              ┌─────────────────────┐
              │ Save message to DB  │
              │ Return bot response │
              │ via HTTP            │
              └─────────────────────┘
                         │
                         ▼
              Widget displays response
```

📝 **Key insight:** The bot response goes back via HTTP (the regular request/response). Socket.IO is only used for two things: (1) notifying the business dashboard when a new ticket arrives, and (2) delivering agent messages to the visitor in real time when a human has taken over. This is more reliable than socket-only delivery.

---

## 3. Authentication Flow

```
  Login Page
      │
      │  POST /api/auth/login
      │  { email, password }
      ▼
┌─────────────────────────────┐
│  Validate with Zod          │
│  Check email exists in DB   │
│  bcrypt.compare(password)   │
└──────────────┬──────────────┘
               │ Valid
               ▼
┌─────────────────────────────┐
│  Sign JWT                   │
│  Set as HttpOnly Cookie     │
│  (Name: "token")            │
│  secure: true (HTTPS only)  │
│  sameSite: none             │
└──────────────┬──────────────┘
               │
               ▼
         Browser stores
         cookie automatically.
         Never accessible via JS
         (XSS protection)
               │
               │  Every subsequent API request
               │  automatically sends the cookie
               ▼
┌─────────────────────────────┐
│  protect middleware         │
│  Reads cookie               │
│  jwt.verify()               │
│  Attaches user to req.user  │
└─────────────────────────────┘
```

📝 **Why HttpOnly cookies instead of localStorage?** JavaScript cannot read HttpOnly cookies. This means even if an XSS attack injects malicious script into your page, it cannot steal the auth token. `localStorage` tokens are vulnerable to XSS. This is the correct, secure approach.

📝 **Why `sameSite: none`?** The widget on third-party sites needs to send chat requests to your server. `sameSite: strict` or `lax` would block these cross-origin requests from including cookies. `none` allows it, but `secure: true` is required alongside it (HTTPS only).

---

## 4. Socket.IO Room Architecture

```
Socket.IO Server
      │
      ├── Room: "visitor-uuid-here"          (PUBLIC)
      │         │
      │         │  joinConversation event
      │         │  Anyone who knows the UUID can join
      │         │  Used by: widget visitor, ConversationView (agent)
      │         │
      │         └── Events: newMessage (bot/agent messages to visitor)
      │
      └── Room: "business:userId"            (PRIVATE)
                │
                │  joinBusinessRoom event
                │  Requires JWT cookie verification
                │  Server checks: decoded.id === userId
                │
                └── Events: newTicket (new escalation alerts)
```

📝 **Why two different security models?** Visitor rooms are public because the widget visitor is anonymous — they have no account, no JWT. The UUID acts like a session token (128-bit, impossible to guess). Business rooms are private because ticket notifications belong only to that business owner.

---

## 5. RAG (Retrieval-Augmented Generation)

📝 **What is RAG?** Instead of giving the AI your entire history of support tickets (too large, too expensive), RAG finds only the *relevant* past resolutions and includes only those in the prompt. It's like giving the AI a pre-filtered set of notes instead of a full encyclopedia.

```
Visitor message: "my order hasn't arrived"
        │
        ▼
┌─────────────────────────┐
│  ragService              │
│  Find ticket summaries  │
│  semantically similar   │
│  to this message        │
└────────────┬────────────┘
             │
             │  Returns top N relevant summaries
             ▼
┌─────────────────────────┐
│  AI System Prompt       │
│                         │
│  + Instructions         │
│  + FAQs                 │
│  + PDF knowledge        │
│  + RAG context ◄──────  │  Only the relevant bits
│                         │
└─────────────────────────┘
```

---

## 6. Data Models (Simplified)

```
User
├── _id (ObjectId)
├── businessName
├── email
├── password (bcrypt hash)
└── googleId (optional)

BotConfig
├── _id
├── businessId → User._id
├── botName
├── instructions (max 5000 chars)
├── faqs [ { question, answer } ] (max 20)
└── knowledgeSources
    └── pdfContent (extracted text)

Chat
├── _id
├── businessId → User._id
├── visitorId (UUID string)
├── humanTakeover (boolean)
└── messages [ { sender, text, timestamp } ] (capped at 50)

Ticket
├── _id
├── businessId → User._id
├── visitorId
├── userName
├── userMessage
└── status (open | in_progress | closed)
```

📝 **Why is chat history capped at 50 messages?** The entire conversation history gets sent to the AI on every message (as context). More messages = more tokens = slower and more expensive. 50 messages covers a full support conversation without runaway costs.

---

## 7. CORS Strategy

```
Request Origin          Route                   CORS Policy
─────────────────────────────────────────────────────────────
Same origin (dashboard) /api/auth/*             Strict: credentials allowed,
                        /api/bot-config/*       origin must match CLIENT_URL
                        /api/tickets/*
                        /api/conversations/*

Any origin (widget)     /api/embed/*            Open: no credentials,
                        /widget.js              Access-Control-Allow-Origin: *
```

📝 **Why two different CORS policies?** Dashboard routes handle sensitive operations (auth, config, tickets) so they only accept requests from your own frontend. Embed routes must accept requests from any website that has embedded the widget — you can't predict those origins in advance. The trade-off is safe because embed routes don't use cookies or authenticated operations.

---

## 8. Current Infrastructure (Render Monolith)

```
GitHub
  │
  │  git push main
  ▼
Render
  │
  ├── Builds: npm run build (root)
  │           └── builds React → client/dist/
  │
  ├── Starts: npm start
  │           └── node server/server.js
  │
  └── Serves:
      ├── /api/*        → Express routes
      ├── /widget.js    → server/public/widget.js
      └── /*            → client/dist/index.html (SPA fallback)

External Services:
  ├── MongoDB Atlas (database)
  ├── Groq API (AI)
  └── Gmail SMTP (contact form emails)
```

---

## 9. Future AWS Architecture (Target State)

```
                        Route 53 (DNS)
                             │
                             ▼
                    CloudFront (CDN)
                    ├── /api/* → ALB → EC2/ECS
                    └── /*    → S3 (static React build)
                             │
                    ┌────────▼────────┐
                    │  ALB            │
                    │  (Load Balancer)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  ECS Fargate    │
                    │  (Docker)       │
                    │  Node.js API    │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
   ┌──────▼──────┐  ┌────────▼───────┐  ┌──────▼──────┐
   │  MongoDB    │  │   S3 Bucket    │  │  CloudWatch │
   │  Atlas      │  │  (PDF uploads) │  │  (Logs &    │
   └─────────────┘  └────────────────┘  │   Metrics)  │
                                        └─────────────┘

CI/CD Pipeline:
GitHub → GitHub Actions → ECR (Docker image) → ECS deploy
```

📝 **What changes between now and then?**
- Frontend moves from being served by Express → served from S3 via CloudFront (faster, cheaper at scale, independent scaling)
- PDF uploads move from MongoDB → S3 (MongoDB isn't designed for file storage)
- The Node process moves from a raw server → a Docker container on ECS (reproducible, scalable)
- nginx goes away → ALB handles HTTPS termination and routing

📝 **What stays the same?** MongoDB Atlas (no reason to migrate), Groq API, the actual application code. AWS is a hosting change, not an application rewrite.
