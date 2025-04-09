// index.js
const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const Pino = require("pino");
const fs = require("fs");

// Ruta para guardar la sesión
const { state, saveState } = useSingleFileAuthState("./session.json");

// Crear el bot
const startBot = async () => {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: Pino({ level: "silent" })
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot conectado correctamente");
    }
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const numero = msg.key.remoteJid;
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const mensaje = texto.toLowerCase().trim();

    // Bienvenida simple de prueba (puedes personalizar)
    const bienvenida = "Hola ✨ escribí el *número del servicio* para ver los precios.";

    await sock.sendMessage(numero, { text: bienvenida });
  });
};

startBot();
