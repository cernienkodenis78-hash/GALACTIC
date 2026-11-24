# GalacticGuard

A small Minecraft Bedrock connection bot for the GALACTIC VIBES server.

## Railway setup

1. Create a Railway project and deploy this GitHub repository from the `main` branch.
2. In the service's **Variables** tab, add:
   - `MC_HOST` — your server hostname
   - `MC_PORT` — your server's Bedrock UDP port
   - `BOT_USERNAME` — `GalacticGuard`
   - `BEDROCK_OFFLINE_MODE` — `false` by default; set to `true` only if your server explicitly supports offline authentication
3. Deploy. Check **Deployments → Logs** for connection status.

The start command is `npm start`; Railway can detect it from `package.json`.

## Important

- Minecraft Bedrock uses RakNet over UDP. Railway's public TCP proxy is not an inbound UDP proxy, but this bot makes an outbound connection to your server. Outbound UDP availability and the server's network rules still need to be verified.
- The bot does not bypass server authentication, CAPTCHA, allowlists, or server rules.
- Never commit passwords, Microsoft account details, access tokens, or other secrets to GitHub. Use Railway Variables for private settings.
- A successful deployment does not guarantee the server will accept the bot account.
