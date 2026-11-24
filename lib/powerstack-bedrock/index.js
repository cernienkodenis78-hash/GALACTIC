'use strict';

/**
 * PowerStack-Bedrock
 * PowerUpStack-focused adapter around bedrock-protocol.
 * It centralizes configuration; packet transport remains upstream.
 */
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
  const username = options.username || process.env.BOT_USERNAME || 'PowerStackBot';
  const version = options.version || process.env.MC_VERSION || DEFAULTS.version;

  if (!host) throw new Error('PowerStack-Bedrock: host is required (MC_HOST).');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PowerStack-Bedrock: invalid port "${port}".`);
  }

  const client = bedrock.createClient({
    host, port, username, version,
    offline: options.offline ?? (process.env.BEDROCK_OFFLINE_MODE === 'true'),
    followPort: options.followPort ?? DEFAULTS.followPort,
    connectTimeout: options.connectTimeout ?? DEFAULTS.connectTimeout,
    pingTimeout: options.pingTimeout ?? DEFAULTS.pingTimeout,
  });

  client.powerStack = Object.freeze({ host, port, username, version });
  return client;
}

module.exports = { createPowerStackClient, DEFAULTS };
