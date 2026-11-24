# PowerStack-Bedrock

A focused connection adapter for the PowerUpStack Bedrock bot.

## Scope

This is an adapter, not a new RakNet/Bedrock protocol implementation. It uses
the pinned `bedrock-protocol` dependency for packet encoding and transport.
It validates and centralizes PowerUpStack settings but cannot independently
fix an upstream protocol decoder incompatibility.

The server reports Bedrock 1.26.45.1; the bot selects protocol family 1.26.45.
A disconnect mentioning `serverbound/minecraft:hello` should be investigated
as a protocol/server compatibility issue, not hidden by automatic retries.
