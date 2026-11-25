require("dotenv").config();

const express = require("express");

const {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType
} = require("discord.js");

// ==========================================
// DYNA — DYNASTY 8 IMMOBILIER
// NEON MAX — PRESTIGE
// ==========================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error("[DYNA] Token Discord manquant.");
  process.exit(1);
}

// ==========================================
// CLIENT DISCORD
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// ==========================================
// SERVEUR WEB — RENDER
// ==========================================

const app = express();

app.disable("x-powered-by");

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Dyna",
    status: client.isReady()
      ? "online"
      : "connecting"
  });
});

app.get("/health", (req, res) => {
  const ready = client.isReady();

  res.status(ready ? 200 : 503).json({
    status: ready ? "healthy" : "unavailable"
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[RENDER] Serveur actif sur le port ${PORT}`);
});

// ==========================================
// CONNEXION DE DYNA
// ==========================================

client.once(Events.ClientReady, (readyClient) => {

  console.log("====================================");
  console.log("DYNASTY 8 — NEON MAX PRESTIGE");
  console.log(`[DYNA] Connectée : ${readyClient.user.tag}`);
  console.log("====================================");

  readyClient.user.setPresence({
    activities: [
      {
        name: "Dynasty 8 Immobilier",
        type: ActivityType.Watching
      }
    ],
    status: "online"
  });

});

client.on(Events.Error, () => {
  console.error("[DYNA] Erreur de connexion Discord.");
});

// ==========================================
// ARRÊT PROPRE DU SERVICE
// ==========================================

function shutdown() {
  console.log("[DYNA] Arrêt du service.");

  client.destroy();

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 5000).unref();
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);

// ==========================================
// DÉMARRAGE
// ==========================================

client.login(TOKEN).catch(() => {
  console.error("[DYNA] Échec de connexion Discord.");
  process.exit(1);
});
