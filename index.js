const bedrock = require('bedrock-protocol');

const host = process.env.MC_HOST;
const port = Number(process.env.MC_PORT || 19132);
const username = process.env.BOT_USERNAME || 'GalacticGuard';

if (!host) {
  console.error('Missing MC_HOST environment variable.');
  process.exit(1);
}

let client = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let connecting = false;
let stopping = false;

const BASE_RECONNECT_DELAY = 5000;
const MAX_RECONNECT_DELAY = 60000;

function scheduleReconnect(reason) {
  if (stopping || reconnectTimer) return;

  if (reason) {
    console.warn('[GalacticGuard] Connection lost:', reason);
  }

  const delay = Math.min(
    MAX_RECONNECT_DELAY,
    BASE_RECONNECT_DELAY * (2 ** Math.min(reconnectAttempt, 4))
  );
  reconnectAttempt += 1;
  connecting = false;

  // Set the timer BEFORE closing the old client. close() can emit another
  // event synchronously, and that event must not schedule a second retry.
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);

  const oldClient = client;
  client = null;
  if (oldClient) {
    try {
      oldClient.close();
    } catch {
      // The connection may already be closed.
    }
  }

  console.warn(
    `[GalacticGuard] Retrying in ${Math.round(delay / 1000)} seconds (attempt ${reconnectAttempt}).`
  );
}

function connect() {
  if (stopping || connecting || client) return;

  connecting = true;
  console.log(`Starting GalacticGuard for ${host}:${port} as ${username}`);

  let bot;
  try {
    bot = bedrock.createClient({
      host,
      port,
      username,
      // Aternos server is Bedrock 1.26.45.1 (protocol 2169).
      version: '1.26.45',
      offline: process.env.BEDROCK_OFFLINE_MODE === 'true',
      // Keep the configured external Bedrock port.
      followPort: false,
      pingTimeout: 20000,
      connectTimeout: 30000,
    });
  } catch (error) {
    console.error('[GalacticGuard] Could not create Bedrock client:', error);
    scheduleReconnect(error.message);
    return;
  }

  client = bot;

  bot.on('join', () => {
    console.log('[GalacticGuard] Connected to the Bedrock server.');
  });

  bot.on('spawn', () => {
    console.log('[GalacticGuard] Bot spawned in the world.');
    connecting = false;
    reconnectAttempt = 0;
  });

  // Event-driven social activity: greet players and answer when addressed.
  // This does not send periodic fake movement or keep the server awake.
  let lastReplyAt = 0;

  function sendChat(message) {
    if (!client || client !== bot) return;
    try {
      bot.queue('text', {
        needs_translation: false,
        category: 'authored',
        chat: 'chat',
        whisper: 'whisper',
        announcement: 'announcement',
        type: 'chat',
        source_name: username,
        message,
        xuid: '0',
        platform_chat_id: '',
        has_filtered_message: false,
        filtered_message: ''
      });
      console.log('[GalacticGuard] Chat:', message);
    } catch (error) {
      console.warn('[GalacticGuard] Could not send chat message:', error.message);
    }
  }

  bot.on('add_player', (packet) => {
    const playerName = packet.username;
    if (!playerName || playerName === username) return;
    sendChat(`Привіт, ${playerName}! Я GalacticGuard 🌌`);
  });

  bot.on('text', (packet) => {
    if (!packet || !packet.source_name || packet.source_name === username) return;
    const message = String(packet.message || '');
    if (!/galacticguard|галактик/i.test(message)) return;

    const now = Date.now();
    if (now - lastReplyAt < 20000) return;
    lastReplyAt = now;

    const replies = [
      `Я тут, ${packet.source_name}! 🌌`,
      'GalacticGuard на зв’язку!',
      'Охороняю спавн і стежу за порядком 🙂'
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    sendChat(reply);
  });

  bot.on('disconnect', (packet) => {
    console.warn('[GalacticGuard] Server disconnected the bot:', packet);
    scheduleReconnect('server disconnected the bot');
  });

  bot.on('close', () => {
    console.warn('[GalacticGuard] Connection closed.');
    scheduleReconnect('connection closed');
  });

  bot.on('error', (error) => {
    console.error('[GalacticGuard] Bedrock connection error:', error);
    scheduleReconnect(error.message || 'Bedrock connection error');
  });
}

process.on('SIGTERM', () => {
  console.log('[GalacticGuard] Stopping...');
  stopping = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;

  const oldClient = client;
  client = null;
  if (oldClient) {
    try {
      oldClient.close();
    } catch {
      // Ignore errors during shutdown.
    }
  }
});

process.on('SIGINT', () => {
  stopping = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (client) {
    try {
      client.close();
    } catch {
      // Ignore errors during shutdown.
    }
  }
  process.exit(0);
});

connect();
