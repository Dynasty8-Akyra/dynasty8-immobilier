require("dotenv").config();

const express = require("express");

const { createBienvenue } = require("./embeds/bienvenue");
const { createReglement } = require("./embeds/reglement");
const { createCentreDyna } = require("./embeds/centre-dyna");
const { handleAnnonceInteraction } = require("./interactions/annonces");
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

  publishBienvenue();
  publishReglement();
  publishCentreDyna();

});

client.on(Events.Error, () => {
  console.error("[DYNA] Erreur de connexion Discord.");
});
// ==========================================
// INTERACTIONS — CENTRE DE COMMUNICATION
// ==========================================

client.on(Events.InteractionCreate, async (interaction) => {

  try {

    await handleAnnonceInteraction(interaction);

  } catch (error) {

    console.error(
      "[DYNA] Erreur interaction :",
      error.code || error.name
    );

  }

});
// ==========================================
// PUBLICATION OFFICIELLE — RÈGLEMENT
// ==========================================

async function publishReglement() {

  const channelId = process.env.RULES_CHANNEL_ID;

  if (!channelId) {
    console.log("[DYNA] Salon règlement non configuré.");
    return;
  }

  try {

    const channel = await client.channels.fetch(channelId);

    if (
      !channel ||
      !channel.isTextBased() ||
      channel.isDMBased() ||
      typeof channel.send !== "function"
    ) {
      console.error("[DYNA] Salon règlement invalide.");
      return;
    }

    let before;

    while (true) {

      const messages = await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

      const existing = messages.find(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
          embed.title === "♛ Règlement officiel de Dynasty 8"
        )
      );

      if (existing) {
        console.log("[DYNA] Règlement déjà publié.");
        return;
      }

      if (messages.size < 100) {
        break;
      }

      before = messages.last().id;

    }

    await channel.send(createReglement());

    console.log("[DYNA] Règlement officiel publié.");

  } catch (error) {

    console.error(
      "[DYNA] Erreur de publication règlement :",
      error.code || error.name
    );

  }

}

// ==========================================
// PUBLICATION OFFICIELLE — BIENVENUE
// ==========================================

async function publishBienvenue() {

  const channelId = process.env.WELCOME_CHANNEL_ID;

  if (!channelId) {
    console.log("[DYNA] Salon de bienvenue non configuré.");
    return;
  }

  try {

    const channel = await client.channels.fetch(channelId);

    if (
      !channel ||
      !channel.isTextBased() ||
      channel.isDMBased() ||
      typeof channel.send !== "function"
    ) {
      console.error("[DYNA] Salon de bienvenue invalide.");
      return;
    }

    let before;

    while (true) {

      const messages = await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

      const existing = messages.find(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
          embed.title === "♛ Bienvenue chez Dynasty 8"
        )
      );

      if (existing) {

        const updated = createBienvenue();

        await existing.edit({
          components: updated.components
        });

        console.log("[DYNA] Message de bienvenue actualisé.");

        return;

      }

      if (messages.size < 100) {
        break;
      }

      before = messages.last().id;

    }

    await channel.send(createBienvenue());

    console.log("[DYNA] Message de bienvenue publié.");

  } catch (error) {

    console.error(
      "[DYNA] Erreur de publication bienvenue :",
      error.code || error.name
    );

  }

}

// ==========================================
// PUBLICATION OFFICIELLE — CENTRE DYNA
// ==========================================

async function publishCentreDyna() {

  const channelId = process.env.CENTER_CHANNEL_ID;

  if (!channelId) {
    console.log("[DYNA] Salon Centre Dyna non configuré.");
    return;
  }

  try {

    const channel = await client.channels.fetch(channelId);

    if (
      !channel ||
      !channel.isTextBased() ||
      channel.isDMBased() ||
      typeof channel.send !== "function" ||
      channel.guildId !== "1567889374836957286"
    ) {
      console.error("[DYNA] Salon Centre Dyna invalide.");
      return;
    }

    // Vérification de la confidentialité du salon

    const everyonePermissions = channel.permissionsFor(
      channel.guild.roles.everyone
    );

    if (
      !everyonePermissions ||
      everyonePermissions.has("ViewChannel")
    ) {
      console.error(
        "[DYNA] Publication refusée : salon Centre Dyna accessible à @everyone."
      );
      return;
    }

    // Recherche du panneau officiel existant

    let before;

    while (true) {

      const messages = await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

      const existing = messages.find(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
          embed.title === "♛ Centre de communication Dyna"
        )
      );

      if (existing) {

        const updated = createCentreDyna();

        await existing.edit({
          components: updated.components
        });

        console.log("[DYNA] Centre de communication actualisé.");

        return;

      }

      if (messages.size < 100) {
        break;
      }

      before = messages.last().id;

    }

    // Publication du panneau permanent

    await channel.send(createCentreDyna());

    console.log("[DYNA] Centre de communication publié.");

  } catch (error) {

    console.error(
      "[DYNA] Erreur de publication Centre Dyna :",
      error.code || error.name
    );

  }

}

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
