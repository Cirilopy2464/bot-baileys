const { default: makeWASocket, useSingleFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require("fs");

const { state, saveState } = useSingleFileAuthState("./session.json");

const mensajeBienvenida = `
👋 ¡Bienvenido/a!

*✨ Elige un número* y te asistiremos de inmediato

➯ *1.* Free Fire  
➯ *2.* Netflix Premium  
➯ *3.* Disney+ Premium`;

const respuestas = {
  "1": "*➯ Free Fire:* 10.000 Gs = 110 diamantes",
  "2": "*➯ Netflix:* 30.000 Gs = 30 días",
  "3": "*➯ Disney+:* 30.000 Gs = 30 días"
};

const ultimosSaludos = {};
const MILISEGUNDOS_EN_24H = 24 * 60 * 60 * 1000;

const startSock = () => {
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("✅ Conectado a WhatsApp");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const numero = msg.key.remoteJid;
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!texto) return;

    const ahora = Date.now();

    if (!ultimosSaludos[numero] || ahora - ultimosSaludos[numero] > MILISEGUNDOS_EN_24H) {
      ultimosSaludos[numero] = ahora;
      await sock.sendMessage(numero, { text: mensajeBienvenida });
    }

    if (respuestas[texto.trim()]) {
      await sock.sendMessage(numero, { text: respuestas[texto.trim()] });
    }
  });
};

startSock();
