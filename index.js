const { createPowerStackClient } = require('./lib/powerstack-bedrock');

const host = process.env.MC_HOST;
const port = Number(process.env.MC_PORT || 19132);
const username = process.env.BOT_USERNAME || 'PowerUpStackGuard';
const version = process.env.MC_VERSION || '1.26.45';

if (!host) {
  console.error('Missing MC_HOST environment variable.');
  process.exit(1);
}

console.log(`Starting GalacticGuard for ${host}:${port} as ${username}`);
console.log(`PowerStack-Bedrock adapter; protocol version: ${version}`);

let client;
try {
  client = createPowerStackClient({ host, port, username, version });
} catch (error) {
  console.error('Could not create Bedrock client:', error);
  process.exit(1);
}

client.on('join', () => console.log('Connected to the Bedrock server.'));
client.on('spawn', () => console.log('Bot spawned in the world.'));
client.on('disconnect', (packet) => console.log('Disconnected:', packet));
client.on('close', () => console.log('Connection closed.'));
client.on('error', (error) => console.error('Bot error:', error));

process.on('SIGTERM', () => {
  console.log('Stopping GalacticGuard...');
  try { client.close(); } catch {}
  process.exit(0);
});
