const express = require("express");
const bedrock = require("bedrock-protocol");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MC_HOST = process.env.MC_HOST;
const MC_PORT = Number(process.env.MC_PORT || 19132);
const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL_MS || 60_000);

let status = {
  online: false,
  checkedAt: null,
  message: "Очікуємо першої перевірки"
};

let checking = false;

function checkServer() {
  if (checking) return;
  if (!MC_HOST) {
    status = {
      online: false,
      checkedAt: new Date().toISOString(),
      message: "Не задано змінну MC_HOST"
    };
    return;
  }

  checking = true;
  let finished = false;
  let timeout;

  let client;
  try {
    client = bedrock.createClient({
      host: MC_HOST,
      port: MC_PORT,
      username: "AternosWatchdog",
      offline: true,
      connectTimeout: 8000
    });
  } catch (error) {
    checking = false;
    status = {
      online: false,
      checkedAt: new Date().toISOString(),
      message: "Не вдалося створити з'єднання"
    };
    console.error(error);
    return;
  }

  function finish(online, message) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    status = {
      online,
      checkedAt: new Date().toISOString(),
      message
    };
    checking = false;

    try {
      client.close();
    } catch {
      // The connection may already be closed.
    }
    console.log(message);
  }

  client.once("join", () => finish(true, "Сервер доступний"));
  client.once("spawn", () => finish(true, "Сервер онлайн"));
  client.once("error", () => finish(false, "Сервер недоступний"));
  client.once("disconnect", () => finish(false, "Сервер розірвав з'єднання"));
  client.once("close", () => {
    if (!finished) finish(false, "З'єднання закрито до входу");
  });

  timeout = setTimeout(
    () => finish(false, "Сервер не відповів за відведений час"),
    10_000
  );
}

app.get("/", (_req, res) => {
  const color = status.online ? "#16803c" : "#b42318";
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
    <p>Остання перевірка: <code>${status.checkedAt || "ще не було"}</code></p>
    <p><a href="/status">Відкрити статус у JSON</a></p>
    <p>Якщо сервер вимкнений, запусти його офіційним способом через Dawn Launcher або панель Aternos.</p>
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
