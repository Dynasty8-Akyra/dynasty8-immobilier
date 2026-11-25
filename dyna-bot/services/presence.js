const {
  ChannelType,
  PermissionFlagsBits
} = require("discord.js");

// CONFIGURATION DYNASTY 8

const GUILD_ID = "1567889374836957286";

const SERVICE_ROLE_ID =
  process.env.SERVICE_ROLE_ID;

const SERVICE_COUNTER_CHANNEL_ID =
  process.env.SERVICE_COUNTER_CHANNEL_ID;

// PROTECTION CONTRE LES ACTUALISATIONS SIMULTANÉES

let updateQueue = Promise.resolve();

// ACTUALISATION DU COMPTEUR PUBLIC

async function refreshServiceCounter(client) {

  if (!SERVICE_ROLE_ID || !SERVICE_COUNTER_CHANNEL_ID) {
    throw new Error(
      "Configuration du compteur de service manquante."
    );
  }

  const guild = await client.guilds.fetch(GUILD_ID);

  // RÉCUPÉRATION DU RÔLE DE SERVICE

  const role = await guild.roles.fetch(
    SERVICE_ROLE_ID
  );

  if (!role) {
    throw new Error(
      "Rôle de service introuvable."
    );
  }

  // RÉCUPÉRATION DES MEMBRES DU SERVEUR

  const members = await guild.members.fetch();

  // COMPTAGE DES AGENTS EN SERVICE

  const count = members.filter(member =>
    !member.user.bot &&
    member.roles.cache.has(SERVICE_ROLE_ID)
  ).size;

  // RÉCUPÉRATION DU SALON VOCAL

  const channel = await guild.channels.fetch(
    SERVICE_COUNTER_CHANNEL_ID,
    { force: true }
  );

  if (
    !channel ||
    channel.type !== ChannelType.GuildVoice ||
    channel.guild.id !== GUILD_ID
  ) {
    throw new Error(
      "Salon compteur invalide ou introuvable."
    );
  }

  // VÉRIFICATION DES PERMISSIONS DE DYNA

  const botMember = await guild.members.fetchMe();

  const permissions = channel.permissionsFor(
    botMember
  );

  if (
    !permissions ||
    !permissions.has(
      PermissionFlagsBits.ManageChannels
    )
  ) {
    throw new Error(
      "Dyna ne peut pas modifier le salon compteur."
    );
  }

  // FORMAT OFFICIEL DU COMPTEUR

  const newName = count > 0
    ? `🟢 : ${count}`
    : "🔴 : 0";

  // MODIFICATION UNIQUEMENT SI NÉCESSAIRE

  if (channel.name !== newName) {

    await channel.setName(
      newName,
      "Actualisation des agents en service"
    );

    console.log(
      `[DYNA] Compteur actualisé : ${newName}`
    );

  }

  return count;

}

// MISE EN FILE DES ACTUALISATIONS

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

// EXPORTATION

module.exports = {
  updateServiceCounter
};
