const express = require("express");
const { ping } = require("bedrock-protocol");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MC_HOST = process.env.MC_HOST;
const MC_PORT = Number(process.env.MC_PORT || 19132);
const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL_MS || 60_000);

let status = {
  online: false,
  checkedAt: null,
  message: "Очікуємо першої перевірки",
  server: null
};

let checking = false;

async function checkServer() {
  if (checking) return;
  if (!MC_HOST) {
    status = {
      online: false,
      checkedAt: new Date().toISOString(),
      message: "Не задано змінну MC_HOST",
      server: null
    };
    return;
  }

  checking = true;
  try {
    // A status ping checks the Bedrock server list response without joining the world.
    const result = await ping({
      host: MC_HOST,
      port: MC_PORT,
      transport: "raknet",
      timeout: 7000
    });

    status = {
      online: true,
      checkedAt: new Date().toISOString(),
      message: "Сервер відповідає на Bedrock ping",
      server: {
        version: result.version ?? null,
        playersOnline: result.playersOnline ?? result.players?.online ?? null,
        playersMax: result.playersMax ?? result.players?.max ?? null,
        motd: result.motd ?? null
      }
    };
    console.log("Сервер онлайн: Bedrock ping успішний");
  } catch (error) {
    status = {
      online: false,
      checkedAt: new Date().toISOString(),
      message: "Немає відповіді на Bedrock ping",
      server: null
    };
    console.log("Bedrock ping не вдався:", error?.message || "невідома помилка");
  } finally {
    checking = false;
  }
}

app.get("/", (_req, res) => {
  const color = status.online ? "#16803c" : "#b42318";
  const serverInfo = status.server
    ? `<p>Версія: <code>${status.server.version ?? "невідомо"}</code></p>
       <p>Гравці: <code>${status.server.playersOnline ?? "?"}/${status.server.playersMax ?? "?"}</code></p>`
    : "";

  res.type("html").send(`<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Aternos Watchdog</title>
  <style>
    body{font:16px system-ui;max-width:680px;margin:48px auto;padding:0 18px;background:#101827;color:#f4f6fb}
    main{background:#1b2638;border-radius:16px;padding:24px}
    .status{font-size:26px;font-weight:700;color:${color}}
    a{color:#8ab4ff}
    code{overflow-wrap:anywhere}
  </style>
</head>
<body>
  <main>
    <h1>Aternos Watchdog</h1>
    <p class="status">${status.online ? "ONLINE" : "OFFLINE"}</p>
    <p>${status.message}</p>
    ${serverInfo}
    <p>Остання перевірка: <code>${status.checkedAt || "ще не було"}</code></p>
    <p><a href="/status">Відкрити статус у JSON</a></p>
    <p>Якщо сервер вимкнений, запусти його офіційним способом через панель Aternos.</p>
  </main>
</body>
</html>`);
});

app.get("/status", (_req, res) => res.json(status));

app.listen(PORT, () => {
  console.log(`Aternos Watchdog запущено на порту ${PORT}`);
  checkServer();
  setInterval(checkServer, CHECK_INTERVAL);
});
