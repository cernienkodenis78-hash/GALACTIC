'use strict';

const path = require('node:path');
const fs = require('node:fs');
const bedrock = require('bedrock-protocol');

const DEFAULTS = Object.freeze({
  version: '1.26.45',
  connectTimeout: 30000,
  pingTimeout: 15000,
  followPort: false,
});

function createPowerStackClient(options = {}) {
  const host = options.host || process.env.MC_HOST;
  const port = Number(options.port || process.env.MC_PORT || 19132);
  const username = options.username || process.env.BOT_USERNAME || 'PowerUpStackGuard';
  const version = options.version || process.env.MC_VERSION || DEFAULTS.version;
  const profilesFolder = path.resolve(
    process.env.MSA_PROFILES_FOLDER || path.join(process.cwd(), '.auth')
  );

  if (!host) throw new Error('PowerStack-Bedrock: host is required (MC_HOST).');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PowerStack-Bedrock: invalid port "${port}".`);
  }

  fs.mkdirSync(profilesFolder, { recursive: true });

  const client = bedrock.createClient({
    host,
    port,
    username,
    version,
    // This server uses Microsoft/Xbox-authenticated Bedrock accounts.
    // Do not inherit BEDROCK_OFFLINE_MODE=true from older Railway settings.
    offline: false,
    profilesFolder,
    onMsaCode(data) {
      const verificationUri = data.verification_uri || data.verificationUri || 'https://microsoft.com/link';
      const userCode = data.user_code || data.userCode;
      console.log('Microsoft/Xbox sign-in is required for PowerUpStackGuard.');
      console.log(`Open this page: ${verificationUri}`);
      if (userCode) console.log(`One-time sign-in code: ${userCode}`);
      console.log('Enter the code on the Microsoft page. Never share your password or one-time code with anyone.');
    },
    followPort: options.followPort ?? DEFAULTS.followPort,
    connectTimeout: options.connectTimeout ?? DEFAULTS.connectTimeout,
    pingTimeout: options.pingTimeout ?? DEFAULTS.pingTimeout,
  });

  client.powerStack = Object.freeze({ host, port, username, version, profilesFolder });
  return client;
}

module.exports = { createPowerStackClient, DEFAULTS };
