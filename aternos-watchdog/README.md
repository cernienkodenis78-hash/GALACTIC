# Aternos Watchdog

A small Railway-ready monitor for a Minecraft Bedrock server.

## Environment variables

- `MC_HOST` — server address, without protocol.
- `MC_PORT` — Bedrock UDP port (default: `19132`).
- `PORT` — HTTP port supplied by Railway.
- `CHECK_INTERVAL_MS` — polling interval in milliseconds (default: `60000`).

## Endpoints

- `/` — simple status page.
- `/status` — JSON status.

## Important limitation

This project only checks whether the Minecraft server can be reached. Aternos does not provide a public API for starting servers, so this monitor does not automate Aternos login, button clicks, or private API calls. Start the server through Aternos or the supported Dawn Launcher flow.

## Railway

Set the service's Root Directory to `/aternos-watchdog`, then add the environment variables above and deploy.
