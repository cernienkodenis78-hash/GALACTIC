const bedrock = require('bedrock-protocol');

const host = process.env.MC_HOST;
const port = Number(process.env.MC_PORT || 19132);
const username = process.env.BOT_USERNAME || 'GalacticGuard';

if (!host) {
  console.error('Missing MC_HOST environment variable.');
  process.exit(1);
}

console.log(`Starting GalacticGuard for ${host}:${port} as ${username}`);

const client = bedrock.createClient({
  host,
  port,
  username,
  offline: process.env.BEDROCK_OFFLINE_MODE === 'true',
});

client.on('join', () => console.log('Connected to the Bedrock server.'));
client.on('spawn', () => console.log('Bot spawned in the world.'));
client.on('disconnect', (packet) => {
  console.log('Disconnected:', packet);
});
client.on('close', () => console.log('Connection closed.'));
client.on('error', (error) => console.error('Bot error:', error));

// Keep this process alive; Railway restarts it if it exits unexpectedly.
process.on('SIGTERM', () => {
  console.log('Stopping GalacticGuard...');
  try { client.close(); } catch {}
  process.exit(0);
});
