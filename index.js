const { default: makeWASocket, useSingleFileAuthState } = require("baileys");
const fs = require("fs");
const pino = require("pino");

// Guardar sesión
const { state, saveState } = useSingleFileAuthState("./session.json");

const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  logger: pino({ level: "silent" }),
});

sock.ev.on("creds.update", saveState);

sock.ev.on("messages.upsert", async ({ messages }) => {
  const m = messages[0];
  if (!m.message || m.key.fromMe) return;

  const numero = m.key.remoteJid;
  const texto = m.message.conversation || m.message.extendedTextMessage?.text || "";

  console.log(`📩 Mensaje de ${numero}: ${texto}`);

  await sock.sendMessage(numero, {
    text: "👋 ¡Hola! Escribí un número de servicio para ver los precios."
  });
});
