const express = require("express");
const dgram = require("node:dgram");
const crypto = require("node:crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MC_HOST = process.env.MC_HOST;
const MC_PORT = Number(process.env.MC_PORT || 19132);
const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL_MS || 60_000);
const PING_TIMEOUT = Number(process.env.PING_TIMEOUT_MS || 7000);

let status = {
  online: false,
  checkedAt: null,
  message: "Очікуємо першої перевірки",
  server: null
};

let checking = false;

// RakNet unconnected ping: checks status without logging into or joining the world.
function pingBedrock(host, port) {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    const magic = Buffer.from("00ffff00fefefefefdfdfdfd12345678", "hex");
    const packet = Buffer.alloc(33);

    packet.writeUInt8(0x01, 0);
    packet.writeBigUInt64BE(BigInt(Date.now()), 1);
    magic.copy(packet, 9);
    packet.writeBigUInt64BE(crypto.randomBytes(8).readBigUInt64BE(), 25);

    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.close(); } catch {}
      if (error) reject(error);
      else resolve(result);
    };

    const timer = setTimeout(
      () => finish(new Error("RakNet ping timed out")),
      PING_TIMEOUT
    );

    socket.on("error", error => finish(error));
    socket.on("message", message => {
      try {
        if (message.length < 35 || message.readUInt8(0) !== 0x1c) {
          return;
        }

        const responseMagic = message.subarray(17, 33);
        if (!responseMagic.equals(magic)) return;

        const textLength = message.readUInt16BE(33);
        if (message.length < 35 + textLength) return;

        const fields = message.subarray(35, 35 + textLength).toString("utf8").split(";");
        if (fields[0] !== "MCPE" && fields[0] !== "MCEE") return;

        finish(null, {
          edition: fields[0],
          motd: fields[1] || null,
          protocol: fields[2] || null,
          version: fields[3] || null,
          playersOnline: Number.isFinite(Number(fields[4])) ? Number(fields[4]) : null,
          playersMax: Number.isFinite(Number(fields[5])) ? Number(fields[5]) : null,
          gameMode: fields[8] || null
        });
      } catch (error) {
        finish(error);
      }
    });

    socket.send(packet, port, host, error => {
      if (error) finish(error);
    });
  });
}

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
    const result = await pingBedrock(MC_HOST, MC_PORT);
    status = {
      online: true,
      checkedAt: new Date().toISOString(),
      message: "Сервер відповідає на RakNet ping",
      server: result
    };
    console.log("Сервер онлайн: RakNet ping успішний");
  } catch (error) {
    status = {
      online: false,
      checkedAt: new Date().toISOString(),
      message: "Немає коректної відповіді на RakNet ping",
      server: null
    };
    console.log("RakNet ping не вдався:", error?.message || "невідома помилка");
  } finally {
    checking = false;
  }
}

app.get("/", (_req, res) => {
  const color = status.online ? "#16803c" : "#b42318";
  const serverInfo = status.server
    ? `<p>Версія: <code>${status.server.version ?? "невідомо"}</code></p>
       <p>Гравці: <code>${status.server.playersOnline ?? "?"}/${status.server.playersMax ?? "?"}</code></p>
       <p>Режим: <code>${status.server.gameMode ?? "невідомо"}</code></p>`
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
