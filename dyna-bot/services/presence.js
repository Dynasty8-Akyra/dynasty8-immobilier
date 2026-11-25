const {
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

// ==========================================
// DYNASTY 8 — COMPTEUR DE PRÉSENCE
// ==========================================

const GUILD_ID = "1567889374836957286";

const SERVICE_ROLE_ID =
  process.env.SERVICE_ROLE_ID;

const SERVICE_COUNTER_CHANNEL_ID =
  process.env.SERVICE_COUNTER_CHANNEL_ID;

const PROFESSIONAL_ROLES = [
  "1567889789569728583",
  "1567889964639723631",
  process.env.DISCORD_TRAINING_ROLE_ID
].filter(Boolean);

let updateQueue = Promise.resolve();

// ==========================================
// CALCUL DES AGENTS EN SERVICE
// ==========================================

async function refreshServiceCounter(client) {

  if (
    !SERVICE_ROLE_ID ||
    !SERVICE_COUNTER_CHANNEL_ID
  ) {

    throw new Error(
      "Configuration du compteur manquante."
    );

  }

  const guild = client.guilds.cache.get(GUILD_ID);

  if (!guild || !guild.available) {

    throw new Error(
      "Serveur Dynasty 8 indisponible."
    );

  }

  // Vérification de la liste des membres

  if (guild.members.cache.size < guild.memberCount) {

    throw new Error(
      "Liste des membres non synchronisée."
    );

  }

  // Vérification du rôle de service

  const role = guild.roles.cache.get(
    SERVICE_ROLE_ID
  );

  if (!role) {

    throw new Error(
      "Rôle de service introuvable."
    );

  }

  // Comptage depuis le cache Discord

  const count = guild.members.cache.filter(member =>

    !member.user.bot &&

    member.roles.cache.has(SERVICE_ROLE_ID) &&

    PROFESSIONAL_ROLES.some(roleId =>
      member.roles.cache.has(roleId)
    )

  ).size;

  // ========================================
  // VÉRIFICATION DU SALON VOCAL
  // ========================================

  let channel;

  try {

    channel = await guild.channels.fetch(
      SERVICE_COUNTER_CHANNEL_ID,
      { force: true }
    );

  } catch (error) {

    throw new Error(
      `Accès au salon compteur impossible : ${error.message}`
    );

  }

  if (
    !channel ||
    channel.type !== ChannelType.GuildVoice ||
    channel.guild.id !== GUILD_ID
  ) {

    throw new Error(
      "Salon vocal compteur invalide."
    );

  }

  const botMember = await guild.members.fetchMe();

  const permissions = channel.permissionsFor(
    botMember
  );

  if (
    !permissions ||
    !permissions.has(PermissionFlagsBits.ViewChannel) ||
    !permissions.has(PermissionFlagsBits.ManageChannels)
  ) {

    throw new Error(
      "Permissions insuffisantes sur le salon compteur."
    );

  }

  // ========================================
  // ACTUALISATION DU COMPTEUR PUBLIC
  // ========================================

  const newName = count > 0
    ? `🟢 : ${count}`
    : "🔴 : 0";

  if (channel.name === newName) {

    return count;

  }

  try {

    await channel.setName(
      newName,
      "Actualisation des agents en service"
    );

    console.log(
      `[DYNA] Compteur actualisé : ${newName}`
    );

  } catch (error) {

    throw new Error(
      `Renommage du compteur impossible : ${error.message}`
    );

  }

  return count;

}

// ==========================================
// FILE D'ATTENTE DES ACTUALISATIONS
// ==========================================

function updateServiceCounter(client) {

  const task = updateQueue.then(() =>
    refreshServiceCounter(client)
  );

  updateQueue = task.catch(error => {

    console.error(
      "[DYNA] Erreur compteur de service :",
      error.message
    );

  });

  return task;

}

module.exports = {
  updateServiceCounter
};
