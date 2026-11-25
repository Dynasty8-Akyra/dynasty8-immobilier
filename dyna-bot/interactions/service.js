const {
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");

const {
  updateServiceCounter
} = require("../services/presence");

// CONFIGURATION DYNASTY 8

const GUILD_ID = "1567889374836957286";

const DIRECTION_ROLE_ID = "1567889789569728583";

const CONFIRMED_ROLE_ID = "1567889964639723631";

const TRAINING_ROLE_ID =
  process.env.DISCORD_TRAINING_ROLE_ID;

const SERVICE_CHANNEL_ID =
  process.env.SERVICE_CHANNEL_ID;

const SERVICE_ROLE_ID =
  process.env.SERVICE_ROLE_ID;

// PROTECTION CONTRE LES DOUBLES CLICS

const processing = new Set();

// VÉRIFICATION DES RÔLES PROFESSIONNELS

function isAuthorized(member) {

  return [

    DIRECTION_ROLE_ID,
    CONFIRMED_ROLE_ID,
    TRAINING_ROLE_ID

  ].filter(Boolean).some(roleId =>
    member.roles.cache.has(roleId)
  );

}

// GESTION DES INTERACTIONS

async function handleServiceInteraction(interaction) {

  if (!interaction.isButton()) {
    return false;
  }

  const action = interaction.customId;

  if (
    action !== "dyna_service_start" &&
    action !== "dyna_service_end"
  ) {
    return false;
  }

  // VÉRIFICATION DU SERVEUR ET DU SALON

  if (
    !interaction.inGuild() ||
    interaction.guildId !== GUILD_ID ||
    interaction.channelId !== SERVICE_CHANNEL_ID
  ) {

    await interaction.reply({
      content: "Cette action est indisponible dans ce salon.",
      flags: MessageFlags.Ephemeral
    });

    return true;

  }

  const userId = interaction.user.id;

  // PROTECTION CONTRE LES ACTIONS SIMULTANÉES

  if (processing.has(userId)) {

    await interaction.reply({
      content: "Une action est déjà en cours. Veuillez patienter.",
      flags: MessageFlags.Ephemeral
    });

    return true;

  }

  processing.add(userId);

  let roleChanged = false;

  try {

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    if (!SERVICE_ROLE_ID || !TRAINING_ROLE_ID) {
      throw new Error(
        "Configuration des rôles incomplète."
      );
    }

    const guild = interaction.guild;

    // RÉCUPÉRATION DU MEMBRE

    const member = await guild.members.fetch({
      user: userId,
      force: true
    });

    // VÉRIFICATION DES AUTORISATIONS

    if (
      member.user.bot ||
      !isAuthorized(member)
    ) {

      await interaction.editReply({
        content: "⛔ Cette fonctionnalité est réservée aux agents autorisés de Dynasty 8."
      });

      return true;

    }

    // RÉCUPÉRATION DU RÔLE VERT

    const serviceRole = await guild.roles.fetch(
      SERVICE_ROLE_ID
    );

    const botMember = await guild.members.fetchMe();

    if (
      !serviceRole ||
      serviceRole.managed ||
      !serviceRole.editable ||
      !botMember.permissions.has(
        PermissionFlagsBits.ManageRoles
      )
    ) {

      throw new Error(
        "Dyna ne peut pas gérer le rôle de service."
      );

    }

    const inService = member.roles.cache.has(
      SERVICE_ROLE_ID
    );

    // PRISE DE SERVICE

    if (action === "dyna_service_start") {

      if (inService) {

        await interaction.editReply({
          content: "🟢 Vous êtes déjà en service."
        });

        return true;

      }

      await member.roles.add(
        serviceRole,
        "Prise de service Dynasty 8"
      );

      roleChanged = true;

      await interaction.editReply({

        content: [
          "🟢 **Prise de service confirmée.**",
          "",
          "Vous êtes désormais disponible auprès de notre clientèle.",
          "",
          "*Bon service au sein de Dynasty 8.*"
        ].join("\n")

      });

    }

    // FIN DE SERVICE

    if (action === "dyna_service_end") {

      if (!inService) {

        await interaction.editReply({
          content: "🔴 Vous êtes déjà hors service."
        });

        return true;

      }

      await member.roles.remove(
        serviceRole,
        "Fin de service Dynasty 8"
      );

      roleChanged = true;

      await interaction.editReply({

        content: [
          "🔴 **Fin de service confirmée.**",
          "",
          "Vous êtes désormais hors service.",
          "",
          "*Merci pour votre investissement au sein de Dynasty 8.*"
        ].join("\n")

      });

    }

  } catch (error) {

    console.error(
      "[DYNA] Erreur de prise de service :",
      error.code || error.name
    );

    const content = roleChanged
      ? "Votre statut a été modifié, mais la confirmation a rencontré une erreur."
      : "⚠️ Impossible de confirmer votre changement de statut. Veuillez réessayer.";

    if (interaction.deferred || interaction.replied) {

      await interaction.editReply({
        content
      }).catch(() => {});

    } else {

      await interaction.reply({
        content,
        flags: MessageFlags.Ephemeral
      }).catch(() => {});

    }

  } finally {

    processing.delete(userId);

    // ACTUALISATION DU COMPTEUR PUBLIC

    if (roleChanged) {

      updateServiceCounter(
        interaction.client
      ).catch(() => {});

    }

  }

  return true;

}

// EXPORTATION

module.exports = {
  handleServiceInteraction
};
