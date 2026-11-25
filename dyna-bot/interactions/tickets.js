const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require("discord.js");

const { randomUUID } = require("node:crypto");

const {
  getQuartiers,
  getTypesInterieurs
} = require("../services/quartiers");

// ==========================================
// DYNASTY 8 — TICKETS IMMOBILIERS
// NEON MAX — PRESTIGE
// ==========================================

const GUILD_ID = "1567889374836957286";

const SESSION_DURATION = 15 * 60 * 1000;

const PAGE_SIZE = 24;

const sessions = new Map();

const MOTIFS = [
  {
    label: "Achat d'une propriété",
    value: "achat",
    emoji: "🏡"
  },
  {
    label: "Location d'une propriété",
    value: "location",
    emoji: "🔑"
  },
  {
    label: "Vente d'une propriété",
    value: "vente",
    emoji: "💰"
  },
  {
    label: "Renseignements immobiliers",
    value: "renseignements",
    emoji: "📋"
  }
];

// ==========================================
// GESTION DES SESSIONS
// ==========================================

function createSession(interaction) {

  // Une seule session de formulaire par client

  for (const [id, session] of sessions) {
    if (session.userId === interaction.user.id) {
      sessions.delete(id);
    }
  }

  const session = {
    id: randomUUID(),
    userId: interaction.user.id,
    guildId: interaction.guildId,
    motif: null,
    quartierId: null,
    quartierNom: "Aucune préférence",
    interieur: "Aucune préférence",
    quartiers: [],
    types: [],
    page: 0,
    step: "motif",
    expiresAt: Date.now() + SESSION_DURATION
  };

  sessions.set(session.id, session);

  return session;

}

function getSession(interaction, id) {

  const session = sessions.get(id);

  if (
    !session ||
    session.userId !== interaction.user.id ||
    session.guildId !== interaction.guildId ||
    session.expiresAt <= Date.now()
  ) {
    return null;
  }

  return session;

}

function refreshSession(session) {
  session.expiresAt = Date.now() + SESSION_DURATION;
}

setInterval(() => {

  for (const [id, session] of sessions) {
    if (session.expiresAt <= Date.now()) {
      sessions.delete(id);
    }
  }

}, 60000).unref();

// ==========================================
// EMBEDS DU FORMULAIRE
// ==========================================

function createEmbed(title, description, step) {

  return new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle(`♛ ${title}`)
    .setDescription(description)
    .setFooter({
      text: `DYNASTY 8 • SERVICE CLIENTÈLE • ${step}/4`
    });

}

function cancelRow(session) {

  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`dyna_ticket_cancel:${session.id}`)
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Secondary)
    );

}

// ==========================================
// ÉTAPE 1 — NATURE DE LA DEMANDE
// ==========================================

function motifView(session) {

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`dyna_ticket_motif:${session.id}`)
    .setPlaceholder("Sélectionnez votre demande")
    .addOptions(MOTIFS);

  return {
    embeds: [
      createEmbed(
        "Votre projet immobilier",
        "Afin de vous accompagner au mieux, veuillez sélectionner la nature de votre demande.",
        1
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(menu),
      cancelRow(session)
    ],
    allowedMentions: { parse: [] }
  };

}

// ==========================================
// PAGINATION DES MENUS
// ==========================================

function navigationRow(session, total) {

  const pages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId(`dyna_ticket_prev:${session.id}`)
        .setLabel("Précédent")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(session.page === 0),

      new ButtonBuilder()
        .setCustomId(`dyna_ticket_next:${session.id}`)
        .setLabel("Suivant")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(session.page >= pages - 1),

      new ButtonBuilder()
        .setCustomId(`dyna_ticket_cancel:${session.id}`)
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Danger)

    );

}

// ==========================================
// ÉTAPE 2 — LOCALISATION
// ==========================================

function quartierView(session) {

  const start = session.page * PAGE_SIZE;

  const options = [
    {
      label: "Aucune préférence",
      value: "none"
    },
    ...session.quartiers
      .slice(start, start + PAGE_SIZE)
      .map((quartier, index) => ({
        label: quartier.nom.slice(0, 100),
        value: String(start + index)
      }))
  ];

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`dyna_ticket_quartier:${session.id}`)
    .setPlaceholder("Sélectionnez votre localisation")
    .addOptions(options);

  return {
    embeds: [
      createEmbed(
        "Localisation souhaitée",
        "Dans quel quartier souhaitez-vous réaliser votre projet immobilier ?",
        2
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(menu),
      navigationRow(session, session.quartiers.length)
    ],
    allowedMentions: { parse: [] }
  };

}

// ==========================================
// ÉTAPE 3 — TYPE D'INTÉRIEUR
// ==========================================

function interieurView(session) {

  const start = session.page * PAGE_SIZE;

  const options = [
    {
      label: "Aucune préférence",
      value: "none"
    },
    ...session.types
      .slice(start, start + PAGE_SIZE)
      .map((type, index) => ({
        label: type.slice(0, 100),
        value: String(start + index)
      }))
  ];

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`dyna_ticket_interieur:${session.id}`)
    .setPlaceholder("Sélectionnez votre type d'intérieur")
    .addOptions(options);

  return {
    embeds: [
      createEmbed(
        "Type d'intérieur",
        `**Localisation :** ${session.quartierNom}\n\nSélectionnez le type d'intérieur souhaité.`,
        3
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(menu),
      navigationRow(session, session.types.length)
    ],
    allowedMentions: { parse: [] }
  };

}

// ==========================================
// ÉTAPE 4 — IDENTITÉ RP
// ==========================================

function identityView(session) {

  const motif = MOTIFS.find(
    item => item.value === session.motif
  );

  return {
    embeds: [
      createEmbed(
        "Votre identité",
        [
          "**RÉCAPITULATIF DE VOTRE DEMANDE**",
          "",
          `◆ Nature : ${motif.label}`,
          `◆ Localisation : ${session.quartierNom}`,
          `◆ Intérieur : ${session.interieur}`,
          "",
          "Veuillez renseigner votre identité RP."
        ].join("\n"),
        4
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId(`dyna_ticket_identity:${session.id}`)
          .setLabel("Renseigner mon identité")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`dyna_ticket_cancel:${session.id}`)
          .setLabel("Annuler")
          .setStyle(ButtonStyle.Secondary)

      )
    ],
    allowedMentions: { parse: [] }
  };

}

function identityModal(session) {

  const nom = new TextInputBuilder()
    .setCustomId("nom_rp")
    .setLabel("Nom et prénom RP")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Ex : Emma Wilson")
    .setMinLength(3)
    .setMaxLength(80)
    .setRequired(true);

  const telephone = new TextInputBuilder()
    .setCustomId("telephone_rp")
    .setLabel("Téléphone RP")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Votre numéro RP")
    .setMinLength(3)
    .setMaxLength(30)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`dyna_ticket_modal:${session.id}`)
    .setTitle("Dynasty 8 — Votre identité")
    .addComponents(
      new ActionRowBuilder().addComponents(nom),
      new ActionRowBuilder().addComponents(telephone)
    );

}

// ==========================================
// RÉPONSE CONFIDENTIELLE
// ==========================================

async function privateReply(interaction, content) {

  const payload = {
    content,
    allowedMentions: { parse: [] }
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
// GESTION DES INTERACTIONS
// ==========================================

async function handleTicketInteraction(interaction) {

  if (
    !interaction.customId ||
    !interaction.customId.startsWith("dyna_ticket_")
  ) {
    return false;
  }

  try {

    // Vérification du serveur et du salon

    if (
      interaction.guildId !== GUILD_ID ||
      interaction.channelId !== process.env.TICKETS_CHANNEL_ID
    ) {
      await privateReply(
        interaction,
        "Cette interaction n'est pas autorisée ici."
      );
      return true;
    }

    // Ouverture du formulaire

    if (
      interaction.isButton() &&
      interaction.customId === "dyna_ticket_create"
    ) {

      const session = createSession(interaction);

      await interaction.reply({
        ...motifView(session),
        flags: MessageFlags.Ephemeral
      });

      return true;

    }

    const [action, id] = interaction.customId.split(":");

    const session = getSession(interaction, id);

    if (!session) {

      await privateReply(
        interaction,
        "Votre formulaire a expiré. Veuillez recommencer."
      );

      return true;

    }

    // Annulation

    if (
      interaction.isButton() &&
      action === "dyna_ticket_cancel"
    ) {

      sessions.delete(session.id);

      await interaction.update({
        content: "✖️ Votre demande a été annulée.",
        embeds: [],
        components: []
      });

      return true;

    }

    // Sélection du motif

    if (
      interaction.isStringSelectMenu() &&
      action === "dyna_ticket_motif" &&
      session.step === "motif"
    ) {

      const motif = interaction.values[0];

      if (!MOTIFS.some(item => item.value === motif)) {
        throw new Error("Motif invalide.");
      }

      session.step = "loading";

      await interaction.deferUpdate();

      session.quartiers = await getQuartiers();

      if (session.quartiers.length === 0) {
        throw new Error("Aucun quartier disponible.");
      }

      if (getSession(interaction, id) !== session) {
        return true;
      }

      session.motif = motif;
      session.step = "quartier";
      session.page = 0;

      refreshSession(session);

      await interaction.editReply(quartierView(session));

      return true;

    }

    // Sélection du quartier

    if (
      interaction.isStringSelectMenu() &&
      action === "dyna_ticket_quartier" &&
      session.step === "quartier"
    ) {

      const value = interaction.values[0];

      if (value === "none") {

        session.quartierId = null;
        session.quartierNom = "Aucune préférence";

      } else {

        const index = Number(value);

        if (
          !/^\d+$/.test(value) ||
          index < session.page * PAGE_SIZE ||
          index >= (session.page + 1) * PAGE_SIZE
        ) {
          throw new Error("Sélection invalide.");
        }

        const quartier = session.quartiers[index];

        if (!quartier) {
          throw new Error("Quartier invalide.");
        }

        session.quartierId = quartier.id;
        session.quartierNom = quartier.nom;

      }

      session.types = getTypesInterieurs(
        session.quartiers,
        session.quartierId
      );

      session.step = "interieur";
      session.page = 0;

      refreshSession(session);

      await interaction.update(interieurView(session));

      return true;

    }

    // Sélection du type d'intérieur

    if (
      interaction.isStringSelectMenu() &&
      action === "dyna_ticket_interieur" &&
      session.step === "interieur"
    ) {

      const value = interaction.values[0];

      if (value === "none") {

        session.interieur = "Aucune préférence";

      } else {

        const index = Number(value);

        if (
          !/^\d+$/.test(value) ||
          index < session.page * PAGE_SIZE ||
          index >= (session.page + 1) * PAGE_SIZE ||
          !session.types[index]
        ) {
          throw new Error("Type d'intérieur invalide.");
        }

        session.interieur = session.types[index];

      }

      session.step = "identity";

      refreshSession(session);

      await interaction.update(identityView(session));

      return true;

    }

    // Navigation entre les pages

    if (
      interaction.isButton() &&
      (
        action === "dyna_ticket_prev" ||
        action === "dyna_ticket_next"
      ) &&
      (
        session.step === "quartier" ||
        session.step === "interieur"
      )
    ) {

      const total = session.step === "quartier"
        ? session.quartiers.length
        : session.types.length;

      const maxPage = Math.max(
        0,
        Math.ceil(total / PAGE_SIZE) - 1
      );

      const direction =
        action === "dyna_ticket_next" ? 1 : -1;

      session.page = Math.max(
        0,
        Math.min(maxPage, session.page + direction)
      );

      refreshSession(session);

      await interaction.update(
        session.step === "quartier"
          ? quartierView(session)
          : interieurView(session)
      );

      return true;

    }

    // Ouverture du formulaire RP

    if (
      interaction.isButton() &&
      action === "dyna_ticket_identity" &&
      session.step === "identity"
    ) {

      refreshSession(session);

      await interaction.showModal(identityModal(session));

      return true;

    }

    // Validation de l'identité RP
    // MODE PRÉPARATION — AUCUN TICKET CRÉÉ

    if (
      interaction.isModalSubmit() &&
      action === "dyna_ticket_modal" &&
      session.step === "identity"
    ) {

      const nom = interaction.fields
        .getTextInputValue("nom_rp")
        .trim();

      const telephone = interaction.fields
        .getTextInputValue("telephone_rp")
        .trim();

      if (nom.length < 3 || telephone.length < 3) {

        await privateReply(
          interaction,
          "Veuillez renseigner une identité RP et un téléphone RP valides."
        );

        return true;

      }

      session.step = "completed";

      sessions.delete(session.id);

      await interaction.reply({
        content:
          "Formulaire validé en mode préparation. Aucun ticket n'a été créé et aucune donnée RP n'a été enregistrée.",
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: [] }
      });

      return true;

    }

    await privateReply(
      interaction,
      "Cette étape n'est plus disponible."
    );

    return true;

  } catch (error) {

    console.error(
      "[DYNA] Erreur formulaire immobilier :",
      error.code || error.name
    );

    const id = interaction.customId.split(":")[1];

    if (id && getSession(interaction, id)) {
      sessions.delete(id);
    }

    await privateReply(
      interaction,
      "Le formulaire est temporairement indisponible. Veuillez recommencer dans quelques instants."
    ).catch(() => {});

    return true;

  }

}

// ==========================================
// EXPORTATION
// ==========================================

module.exports = {
  handleTicketInteraction
};
