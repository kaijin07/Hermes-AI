(function() {
  const scriptTag = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  
  const businessId = scriptTag.getAttribute('data-business-id');
  const botName = scriptTag.getAttribute('data-bot-name') || 'Chat Support';
  const apiUrl = scriptTag.src.replace('/widget.js', '');

  if (!businessId) {
    console.error('Hermes Bot: data-business-id is missing');
    return;
  }

  // Create Styles
  const style = document.createElement('style');
  style.innerHTML = `
    #hermes-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: 'Inter', sans-serif;
    }
    #hermes-chat-bubble {
      width: 60px;
      height: 60px;
      background: #6366F1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #hermes-chat-bubble:hover {
      transform: scale(1.1);
    }
    #hermes-chat-bubble svg {
      color: white;
      width: 30px;
      height: 30px;
    }
    #hermes-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    #hermes-chat-window.open {
      display: flex;
    }
    #hermes-chat-header {
      background: #6366F1;
      color: white;
      padding: 15px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #hermes-chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background: #f9fafb;
    }
    .hermes-msg {
      margin-bottom: 10px;
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    .hermes-msg.user {
      align-self: flex-end;
      background: #6366F1;
      color: white;
      margin-left: auto;
      width: fit-content;

    }
    .hermes-msg.bot {
      align-self: flex-start;
      background: #e5e7eb;
      color: #1f2937;
    }
    #hermes-chat-input-container {
      padding: 15px;
      border-top: 1px solid #e5e7eb;
      display: flex;
    }
    #hermes-chat-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px 12px;
      outline: none;
    }
    #hermes-chat-send {
      margin-left: 10px;
      background: #6366F1;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Create Widget Elements
  const container = document.createElement('div');
  container.id = 'hermes-chat-widget';
  
  const bubble = document.createElement('div');
  bubble.id = 'hermes-chat-bubble';
  bubble.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>';
  
  const chatWindow = document.createElement('div');
  chatWindow.id = 'hermes-chat-window';
  chatWindow.innerHTML = `
    <div id="hermes-chat-header">
      <span id="hermes-bot-name"></span>
      <span id="hermes-chat-close" style="cursor:pointer">&times;</span>
    </div>
    <div id="hermes-chat-messages"></div>
    <div id="hermes-chat-input-container">
      <input type="text" id="hermes-chat-input" placeholder="Type a message...">
      <button id="hermes-chat-send">Send</button>
    </div>
  `;
  chatWindow.querySelector('#hermes-bot-name').textContent = botName;

  container.appendChild(chatWindow);
  container.appendChild(bubble);
  document.body.appendChild(container);

  // Visitor ID Logic
  let visitorId = localStorage.getItem('hermes_visitor_id');
  if (!visitorId) {
    // crypto.randomUUID() is only available in secure contexts (HTTPS).
    // Fall back to a time+random ID for HTTP pages (e.g. local dev).
    visitorId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : 'v-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    localStorage.setItem('hermes_visitor_id', visitorId);
  }

  // Toggle Logic
  bubble.onclick = () => chatWindow.classList.toggle('open');
  document.getElementById('hermes-chat-close').onclick = () => chatWindow.classList.remove('open');

  // Chat Logic
  const messagesDiv = document.getElementById('hermes-chat-messages');
  const input = document.getElementById('hermes-chat-input');
  const sendBtn = document.getElementById('hermes-chat-send');

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'hermes-msg ' + sender;
    msg.innerText = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Welcome Message
  setTimeout(() => {
    addMessage(`Hi there! I'm ${botName}, your virtual assistant. How can I help you today?`, 'bot');
  }, 500);

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    try {
      const response = await fetch(apiUrl + '/api/embed/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, businessId, visitorId })
      });
      const result = await response.json();
      if (result.success && result.data?.text) {
        addMessage(result.data.text, 'bot');
      }
    } catch (err) {
      console.error('Hermes Error:', err);
    }
  }

  sendBtn.onclick = sendMessage;
  input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

  // Real-time updates via Socket.io
  const socketScript = document.createElement('script');
  socketScript.src = "https://cdn.socket.io/4.7.2/socket.io.min.js";
  document.head.appendChild(socketScript);

  socketScript.onload = () => {
    if (typeof io !== 'undefined') {
      const socketBaseUrl = apiUrl.split('/api')[0].replace(/\/$/, '');
      const socket = io(socketBaseUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true
      });

      socket.on('connect', () => {
        socket.emit('joinConversation', visitorId);
      });

      socket.on('newMessage', (msg) => {
        if (msg.sender === 'agent') {
          addMessage(msg.text, 'bot');
        }
      });
    }
  };
})();
