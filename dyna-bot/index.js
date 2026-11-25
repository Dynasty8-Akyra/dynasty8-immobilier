require("dotenv").config();

const express = require("express");

const { createBienvenue } = require("./embeds/bienvenue");
const { createReglement } = require("./embeds/reglement");
const { createCentreDyna } = require("./embeds/centre-dyna");
const { createTicketsPanel } = require("./embeds/tickets");

const { handleAnnonceInteraction } = require("./interactions/annonces");
const { handleTicketInteraction } = require("./interactions/tickets");
const { createServicePanel } = require("./embeds/service");

const { handleServiceInteraction } = require("./interactions/service");

const { updateServiceCounter } = require("./services/presence");
const {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  ChannelType,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require("discord.js");

// ==========================================
// DYNA — DYNASTY 8 IMMOBILIER
// NEON MAX — PRESTIGE
// ==========================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const PORT = process.env.PORT || 3000;

const GUILD_ID = "1567889374836957286";
const DIRECTION_ROLE_ID = "1567889789569728583";
const TICKETS_CHANNEL_ID = "1575184319104942090";

// MODE TEST — DIRECTION UNIQUEMENT

const TICKETS_TEST_MODE = true;
// ==========================================
// CONFIGURATION — PRISE DE SERVICE
// ==========================================

const SERVICE_CHANNEL_ID =
  process.env.SERVICE_CHANNEL_ID;

const SERVICE_ROLE_ID =
  process.env.SERVICE_ROLE_ID;

const CONFIRMED_ROLE_ID =
  "1567889964639723631";

const TRAINING_ROLE_ID =
  process.env.DISCORD_TRAINING_ROLE_ID;

const SERVICE_ENABLED = true;

let serviceRefreshTimer = null;
let serviceRefreshInterval = null;

function isProfessional(member) {

  return !member.user.bot && [

    DIRECTION_ROLE_ID,
    CONFIRMED_ROLE_ID,
    TRAINING_ROLE_ID

  ].filter(Boolean).some(roleId =>
    member.roles.cache.has(roleId)
  );

}
if (!TOKEN) {
  console.error("[DYNA] Token Discord manquant.");
  process.exit(1);
}

// ==========================================
// CLIENT DISCORD
// ==========================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
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
  publishTicketsPanel();

  registerTestCommand();

  publishServicePanel();

  if (SERVICE_ENABLED) {

    synchronizeServicePresence();

    serviceRefreshInterval = setInterval(
      synchronizeServicePresence,
      120000
    );

    serviceRefreshInterval.unref();

  }

});

client.on(Events.Error, () => {
  console.error("[DYNA] Erreur de connexion Discord.");
});

// ==========================================
// COMMANDE TEMPORAIRE — TEST TICKET
// ==========================================

async function registerTestCommand() {

  try {

    const guild = await client.guilds.fetch(GUILD_ID);

    const commands = await guild.commands.fetch();

    const existing = commands.find(command =>
      command.name === "test-ticket"
    );

    if (!TICKETS_TEST_MODE) {

      if (existing) {
        await guild.commands.delete(existing.id);
      }

      return;

    }

    const command = new SlashCommandBuilder()
      .setName("test-ticket")
      .setDescription(
        "Tester le formulaire immobilier — Direction uniquement"
      );

    if (existing) {

      await guild.commands.edit(
        existing.id,
        command.toJSON()
      );

    } else {

      await guild.commands.create(command.toJSON());

    }

    console.log(
      "[DYNA] Commande /test-ticket enregistrée."
    );

  } catch (error) {

    console.error(
      "[DYNA] Erreur commande test-ticket :",
      error.code || error.name
    );

  }

}

// ==========================================
// VÉRIFICATION DU RÔLE DIRECTION
// ==========================================

function isDirection(interaction) {

  if (
    !interaction.inGuild() ||
    interaction.guildId !== GUILD_ID
  ) {
    return false;
  }

  const roles = interaction.member?.roles;

  if (Array.isArray(roles)) {
    return roles.includes(DIRECTION_ROLE_ID);
  }

  return roles?.cache?.has(DIRECTION_ROLE_ID) === true;

}

// ==========================================
// VÉRIFICATION DU SALON DE TEST
// ==========================================

function isTicketTestChannel(interaction) {

  return (
    interaction.guildId === GUILD_ID &&
    interaction.channelId === TICKETS_CHANNEL_ID &&
    process.env.TICKETS_CHANNEL_ID === TICKETS_CHANNEL_ID
  );

}

// ==========================================
// RÉPONSE PRIVÉE
// ==========================================

async function replyPrivate(interaction, content) {

  const payload = {
    content,
    allowedMentions: {
      parse: []
    }
  };

  if (interaction.deferred) {

    await interaction.editReply({
      ...payload,
      embeds: [],
      components: []
    });

  } else if (interaction.replied) {

    await interaction.followUp({
      ...payload,
      flags: MessageFlags.Ephemeral
    });

  } else {

    await interaction.reply({
      ...payload,
      flags: MessageFlags.Ephemeral
    });

  }

}

// ==========================================
// LANCEMENT DU TEST PRIVÉ
// ==========================================

async function handleTestCommand(interaction) {

  if (!TICKETS_TEST_MODE) {

    await replyPrivate(
      interaction,
      "Le mode test est désactivé."
    );

    return;

  }

  if (!isDirection(interaction)) {

    await replyPrivate(
      interaction,
      "Cette commande est réservée à la Direction Dynasty 8."
    );

    return;

  }

  if (!isTicketTestChannel(interaction)) {

    await replyPrivate(
      interaction,
      `Veuillez utiliser cette commande dans <#${TICKETS_CHANNEL_ID}>.`
    );

    return;

  }

  const row = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("dyna_ticket_create")
        .setLabel("Tester le formulaire immobilier")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Danger)

    );

  await interaction.reply({

    content: [
      "**♛ DYNASTY 8 — MODE TEST**",
      "",
      "Bienvenue dans le mode de préparation du service immobilier.",
      "",
      "Vous pouvez tester les différentes étapes du formulaire.",
      "",
      "Utilisez uniquement des données RP fictives.",
      "",
      "Aucun ticket ne sera créé et aucune donnée RP ne sera enregistrée."
    ].join("\n"),

    components: [row],

    flags: MessageFlags.Ephemeral,

    allowedMentions: {
      parse: []
    }

  });

}

// ==========================================
// INTERACTIONS — DYNA
// ==========================================

client.on(Events.InteractionCreate, async (interaction) => {

  try {

    // Commande de test immobilier

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "test-ticket"
    ) {

      await handleTestCommand(interaction);

      return;

    }

    // Interactions immobilières
    // Réservées à la Direction pendant les tests

    if (
      interaction.customId &&
      interaction.customId.startsWith("dyna_ticket_")
    ) {

      if (
        !TICKETS_TEST_MODE ||
        !isDirection(interaction) ||
        !isTicketTestChannel(interaction)
      ) {

        await replyPrivate(
          interaction,
          "Le service immobilier est actuellement en préparation."
        );

        return;

      }

      await handleTicketInteraction(interaction);

      return;

    }

       // ======================================
    // INTERACTIONS — PRISE DE SERVICE
    // ======================================

    if (
      interaction.customId &&
      interaction.customId.startsWith("dyna_service_")
    ) {

      if (!SERVICE_ENABLED) {

        await replyPrivate(
          interaction,
          "Le système de prise de service est actuellement en préparation."
        );

        return;

      }

      await handleServiceInteraction(interaction);

      return;

    }

    // Centre de communication et annonces

    await handleAnnonceInteraction(interaction);

  } catch (error) {

    console.error(
      "[DYNA] Erreur interaction :",
      error.code || error.name
    );

    if (interaction.isRepliable()) {

      await replyPrivate(
        interaction,
        "Une erreur est survenue. Veuillez réessayer."
      ).catch(() => {});

    }

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
      channel.guildId !== GUILD_ID
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
          embeds: updated.embeds,
          components: updated.components,
          attachments: [],
          files: updated.files,
          allowedMentions: {
            parse: []
          }
        });

        console.log(
          "[DYNA] Centre de communication actualisé intégralement."
        );

        return;

      }

      if (messages.size < 100) {
        break;
      }

      before = messages.last().id;

    }

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
// PUBLICATION OFFICIELLE — SERVICE CLIENTÈLE
// TICKETS IMMOBILIERS
// ==========================================

async function publishTicketsPanel() {

  const channelId = process.env.TICKETS_CHANNEL_ID;

  if (!channelId) {

    console.log(
      "[DYNA] Salon Service clientèle non configuré."
    );

    return;

  }

  try {

    const channel = await client.channels.fetch(channelId);

    // Vérification du salon officiel

    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      channel.guildId !== GUILD_ID ||
      channel.id !== TICKETS_CHANNEL_ID
    ) {

      console.error(
        "[DYNA] Salon Service clientèle invalide."
      );

      return;

    }

    // Recherche du panneau existant

    let before;

    while (true) {

      const messages = await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

      const existing = messages.find(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
          embed.title === "♛ Votre projet immobilier commence ici"
        )
      );

      if (existing) {

        const updated = createTicketsPanel();

        // Actualisation du panneau existant

        await existing.edit({
          embeds: updated.embeds,
          components: updated.components,
          attachments: [],
          files: updated.files,
          allowedMentions: {
            parse: []
          }
        });

        console.log(
          "[DYNA] Panneau Service clientèle actualisé."
        );

        return;

      }

      if (messages.size < 100) {
        break;
      }

      before = messages.last().id;

    }

    // Première publication du panneau

    await channel.send(createTicketsPanel());

    console.log(
      "[DYNA] Panneau Service clientèle publié."
    );

  } catch (error) {

    console.error(
      "[DYNA] Erreur de publication Service clientèle :",
      error.code || error.name
    );

  }

}
// ==========================================
// PUBLICATION OFFICIELLE — PRISE DE SERVICE
// ==========================================

async function publishServicePanel() {

  if (
    SERVICE_CHANNEL_ID !== "1575184647845842944"
  ) {

    console.error(
      "[DYNA] Salon prise de service non configuré ou invalide."
    );

    return;

  }

  try {

    const channel = await client.channels.fetch(
      SERVICE_CHANNEL_ID
    );

    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      channel.guildId !== GUILD_ID
    ) {

      throw new Error(
        "Salon prise de service invalide."
      );

    }

    const everyonePermissions =
      channel.permissionsFor(
        channel.guild.roles.everyone
      );

    if (
      !everyonePermissions ||
      everyonePermissions.has("ViewChannel")
    ) {

      throw new Error(
        "Le salon prise de service doit rester privé."
      );

    }

    const panel = createServicePanel();

    // ACTIVATION SELON LE MODE CONFIGURÉ

    for (const row of panel.components) {

      for (const button of row.components) {

        button.setDisabled(!SERVICE_ENABLED);

      }

    }

    // RECHERCHE DU PANNEAU EXISTANT

    let before;

    while (true) {

      const messages = await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

      const existing = messages.find(message =>

        message.author.id === client.user.id &&

        message.embeds.some(embed =>
          embed.title ===
          "♛ Gestion des prises de service"
        )

      );

      if (existing) {

        await existing.edit({
          embeds: panel.embeds,
          components: panel.components,
          attachments: [],
          files: panel.files,
          allowedMentions: {
            parse: []
          }
        });

        console.log(
          "[DYNA] Panneau prise de service actualisé."
        );

        return;

      }

      if (messages.size < 100) {
        break;
      }

      before = messages.last().id;

    }

    await channel.send(panel);

    console.log(
      "[DYNA] Panneau prise de service publié."
    );

  } catch (error) {

    console.error(
      "[DYNA] Erreur panneau prise de service :",
      error.code || error.message
    );

  }

}

// ==========================================
// SYNCHRONISATION DES AGENTS EN SERVICE
// ==========================================

let serviceSyncRunning = false;
let serviceMembersInitialized = false;
let serviceMembersRetryAt = 0;
async function synchronizeServicePresence() {

  if (
    !SERVICE_ENABLED ||
    !client.isReady() ||
    serviceSyncRunning
  ) {
    return;
  }

  serviceSyncRunning = true;

  try {

    if (
      SERVICE_ROLE_ID !== "1575252825473032303" ||
      TRAINING_ROLE_ID !== "1567890089172926597"
    ) {

      throw new Error(
        "Configuration des rôles de service invalide."
      );

    }

    const guild = client.guilds.cache.get(
      GUILD_ID
    );

    if (!guild || !guild.available) {

      throw new Error(
        "Serveur Dynasty 8 indisponible."
      );

    }

    // ======================================
    // INITIALISATION DU CACHE DES MEMBRES
    // ======================================

    if (
      !serviceMembersInitialized ||
      guild.members.cache.size < guild.memberCount
    ) {

      if (Date.now() < serviceMembersRetryAt) {
        return;
      }

      serviceMembersRetryAt = Date.now() + 120000;

      console.log(
        "[DYNA] Synchronisation initiale des membres..."
      );

      await guild.members.fetch();

      if (
        guild.members.cache.size < guild.memberCount
      ) {

        throw new Error(
          "Synchronisation des membres incomplète."
        );

      }

      serviceMembersInitialized = true;

      console.log(
        `[DYNA] Cache initialisé : ${guild.members.cache.size} membres.`
      );

    }

    // ======================================
    // CONTRÔLE DES RÔLES PROFESSIONNELS
    // ======================================

    for (const member of guild.members.cache.values()) {

      if (
        member.roles.cache.has(SERVICE_ROLE_ID) &&
        !isProfessional(member)
      ) {

        try {

          await member.roles.remove(
            SERVICE_ROLE_ID,
            "Fin de service : membre non autorisé"
          );

        } catch (error) {

          console.error(
            "[DYNA] Impossible de retirer un rôle de service.",
            error.code || error.name
          );

        }

      }

    }

    // ======================================
    // ACTUALISATION DU COMPTEUR
    // ======================================

    await updateServiceCounter(client);

  } catch (error) {

    console.error(
      "[DYNA] Erreur synchronisation service :",
      error.code || error.message
    );

  } finally {

    serviceSyncRunning = false;

  }

}

// ==========================================
// PLANIFICATION DES ACTUALISATIONS
// ==========================================

function scheduleServiceRefresh() {

  if (!SERVICE_ENABLED) {
    return;
  }

  if (serviceRefreshTimer) {
    return;
  }

  serviceRefreshTimer = setTimeout(() => {

    serviceRefreshTimer = null;

    synchronizeServicePresence();

  }, 5000);

  serviceRefreshTimer.unref();

}

// ==========================================
// DÉPART D'UN MEMBRE DU SERVEUR
// ==========================================

client.on(
  Events.GuildMemberRemove,
  member => {

    if (member.guild.id !== GUILD_ID) {
      return;
    }

    scheduleServiceRefresh();

  }
);

// ==========================================
// MODIFICATION DES RÔLES D'UN MEMBRE
// ==========================================

client.on(
  Events.GuildMemberUpdate,
  (oldMember, newMember) => {

    if (newMember.guild.id !== GUILD_ID) {
      return;
    }

    const relevantRoles = [

      SERVICE_ROLE_ID,
      DIRECTION_ROLE_ID,
      CONFIRMED_ROLE_ID,
      TRAINING_ROLE_ID

    ].filter(Boolean);

    const changed = relevantRoles.some(roleId =>

      oldMember.roles.cache.has(roleId) !==
      newMember.roles.cache.has(roleId)

    );

    if (changed) {

      scheduleServiceRefresh();

    }

  }
);
// ==========================================
// ARRÊT PROPRE DU SERVICE
// ==========================================

function shutdown() {

  console.log("[DYNA] Arrêt du service.");

  if (serviceRefreshTimer) {

    clearTimeout(serviceRefreshTimer);

  }

  if (serviceRefreshInterval) {

    clearInterval(serviceRefreshInterval);

  }

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
