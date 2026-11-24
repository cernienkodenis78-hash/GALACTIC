# PowerStack-Bedrock

A focused connection adapter for the PowerUpStack Bedrock bot.

## Authentication

This bot is configured for a Microsoft/Xbox-authenticated Bedrock server:
- Microsoft/Xbox authentication is enabled (`offline: false`).
- On first start, the process prints a Microsoft device sign-in URL and one-time code.
- Complete sign-in yourself on Microsoft's official page. Never send your password or one-time code to anyone.
- Cached authentication tokens are stored in `.auth` by default. Set `MSA_PROFILES_FOLDER` to a mounted persistent-volume path (for example `/data/.auth`) if the host provides persistent storage.

The old `BEDROCK_OFFLINE_MODE` Railway variable is intentionally ignored by this adapter so an old `true` value cannot silently disable Xbox authentication.

## Protocol and connection

This is an adapter around the pinned `bedrock-protocol` dependency, not a replacement RakNet implementation. It keeps RakNet as the default transport, uses the configured Bedrock host and port, and selects protocol family `1.26.45` unless `MC_VERSION` is set.

A successful transport handshake is not the same as joining the world: look for `Connected to the Bedrock server.` and then `Bot spawned in the world.` in the runtime logs. A timeout still points to server availability, UDP reachability, or the configured address/port and is not fixed by changing account authentication.
