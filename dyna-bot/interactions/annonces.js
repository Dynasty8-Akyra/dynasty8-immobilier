const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} = require("discord.js");

const { randomUUID } = require("node:crypto");

const {
  createAnnonce,
  CATEGORIES
} = require("../embeds/annonces");

// ==========================================
// DYNASTY 8 — CENTRE DE COMMUNICATION
// INTERACTIONS DES ANNONCES OFFICIELLES
// ==========================================

const GUILD_ID = "1567889374836957286";
const DIRECTION_ROLE_ID = "1567889789569728583";

const DRAFT_DURATION = 15 * 60 * 1000;

const drafts = new Map();

// ==========================================
// SÉCURITÉ — ACCÈS DIRECTION
// ==========================================

async function isAuthorized(interaction) {

  if (
    !interaction.inGuild() ||
    interaction.guildId !== GUILD_ID ||
    interaction.channelId !== process.env.CENTER_CHANNEL_ID
  ) {
    return false;
  }

  const member = await interaction.guild.members.fetch({
    user: interaction.user.id,
    force: true
  });

  return member.roles.cache.has(DIRECTION_ROLE_ID);

}

// ==========================================
// GESTION DES BROUILLONS
// ==========================================

function createDraft(userId, categorie) {

  const id = randomUUID();

  const draft = {
    id,
    userId,
    categorie,
    titre: "",
    sousTitre: "",
    contenu: "",
    image: "",
    state: "editing",
    expiresAt: Date.now() + DRAFT_DURATION
  };

  drafts.set(id, draft);

  return draft;

}

function getDraft(id, userId) {

  const draft = drafts.get(id);

  if (!draft || draft.userId !== userId) {
    return null;
  }

  if (draft.expiresAt < Date.now()) {
    drafts.delete(id);
    return null;
  }

  return draft;

}

const cleanup = setInterval(() => {

  for (const [id, draft] of drafts) {

    if (
      draft.expiresAt < Date.now() &&
      draft.state !== "publishing"
    ) {
      drafts.delete(id);
    }

  }

}, 60000);

cleanup.unref();

// ==========================================
// SÉLECTION DE LA CATÉGORIE
// ==========================================

function createCategoryMenu() {

  const menu = new StringSelectMenuBuilder()
    .setCustomId("dyna_annonce_category")
    .setPlaceholder("Sélectionner une catégorie")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(

      Object.entries(CATEGORIES).map(
        ([value, category]) => ({
          label: category.label,
          value
        })
      )

    );

  return new ActionRowBuilder()
    .addComponents(menu);

}

// ==========================================
// CRÉATION DU FORMULAIRE DISCORD
// ==========================================

function createModal(draft) {

  const modal = new ModalBuilder()
    .setCustomId(`dyna_annonce_modal:${draft.id}`)
    .setTitle("Créer une annonce officielle");

  const titre = new TextInputBuilder()
    .setCustomId("titre")
    .setLabel("Titre de l'annonce")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Titre de votre communication")
    .setMaxLength(200)
    .setRequired(true);

  const sousTitre = new TextInputBuilder()
    .setCustomId("sousTitre")
    .setLabel("Sous-titre facultatif")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(200)
    .setRequired(false);

  const contenu = new TextInputBuilder()
    .setCustomId("contenu")
    .setLabel("Contenu de l'annonce")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Chers citoyens...")
    .setMaxLength(3000)
    .setRequired(true);

  const image = new TextInputBuilder()
    .setCustomId("image")
    .setLabel("URL de l'image facultative")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("https://...")
    .setMaxLength(1000)
    .setRequired(false);

  // Préremplissage en cas de modification

  if (draft.titre) titre.setValue(draft.titre);

  if (draft.sousTitre) {
    sousTitre.setValue(draft.sousTitre);
  }

  if (draft.contenu) {
    contenu.setValue(draft.contenu);
  }

  if (draft.image) image.setValue(draft.image);

  modal.addComponents(

    new ActionRowBuilder().addComponents(titre),
    new ActionRowBuilder().addComponents(sousTitre),
    new ActionRowBuilder().addComponents(contenu),
    new ActionRowBuilder().addComponents(image)

  );

  return modal;

}

// ==========================================
// BOUTONS DE CONFIRMATION
// ==========================================

function createConfirmationButtons(draft) {

  return new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId(
          `dyna_annonce_publish:${draft.id}`
        )
        .setLabel("Publier")
        .setEmoji("📢")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(
          `dyna_annonce_edit:${draft.id}`
        )
        .setLabel("Modifier")
        .setEmoji("✏️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(
          `dyna_annonce_cancel:${draft.id}`
        )
        .setLabel("Annuler")
        .setEmoji("✖️")
        .setStyle(ButtonStyle.Danger)

    );

}

// ==========================================
// APERÇU CONFIDENTIEL
// ==========================================

function createPreview(draft) {

  const announcement = createAnnonce(draft);

  return {

    content: [
      "🔒 **APERÇU CONFIDENTIEL — DIRECTION**",
      "",
      "Vérifiez votre communication avant publication.",
      "Destination : <#" +
        process.env.ANNOUNCEMENTS_CHANNEL_ID + ">",
      "",
      "Cet aperçu expire après 15 minutes."
    ].join("\n"),

    embeds: announcement.embeds,
    files: announcement.files,
    components: [
      createConfirmationButtons(draft)
    ],
    allowedMentions: {
      parse: []
    }

  };

}

// ==========================================
// RÉPONSE PRIVÉE
// ==========================================

async function privateReply(interaction, content) {

  if (interaction.deferred) {

    return interaction.editReply({
      content,
      embeds: [],
      components: [],
      attachments: []
    });

  }

  if (interaction.replied) {

    return interaction.followUp({
      content,
      flags: MessageFlags.Ephemeral
    });

  }

  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral
  });

}

// ==========================================
// GESTION DES INTERACTIONS
// ==========================================

async function handleAnnonceInteraction(interaction) {

  const customId = interaction.customId || "";

  if (!customId.startsWith("dyna_annonce_")) {
    return false;
  }

  try {

    // Vérification du rôle à chaque action

    if (!(await isAuthorized(interaction))) {

      await privateReply(
        interaction,
        "🔒 Accès refusé. Cet espace est réservé à la Direction Dynasty 8."
      );

      return true;

    }

    // ======================================
    // OUVERTURE DU MENU
    // ======================================

    if (
      interaction.isButton() &&
      customId === "dyna_annonce_create"
    ) {

      await interaction.reply({

        content: [
          "♛ **Nouvelle communication officielle**",
          "",
          "Veuillez sélectionner la catégorie de votre annonce."
        ].join("\n"),

        components: [createCategoryMenu()],
        flags: MessageFlags.Ephemeral

      });

      return true;

    }

    // ======================================
    // CHOIX DE LA CATÉGORIE
    // ======================================

    if (
      interaction.isStringSelectMenu() &&
      customId === "dyna_annonce_category"
    ) {

      const categorie = interaction.values[0];

      if (!Object.hasOwn(CATEGORIES, categorie)) {

        await privateReply(
          interaction,
          "Catégorie invalide."
        );

        return true;

      }

      const draft = createDraft(
        interaction.user.id,
        categorie
      );

      await interaction.showModal(
        createModal(draft)
      );

      return true;

    }

    // ======================================
    // RÉCUPÉRATION DU BROUILLON
    // ======================================

    const [action, id] = customId.split(":");

    const draft = getDraft(
      id,
      interaction.user.id
    );

    if (!draft) {

      await privateReply(
        interaction,
        "⌛ Cette annonce a expiré. Veuillez créer une nouvelle communication."
      );

      return true;

    }

    // ======================================
    // VALIDATION DU FORMULAIRE
    // ======================================

    if (
      interaction.isModalSubmit() &&
      action === "dyna_annonce_modal"
    ) {

      if (draft.state !== "editing") {

        await privateReply(
          interaction,
          "Ce formulaire n'est plus actif."
        );

        return true;

      }

      draft.titre = interaction.fields
        .getTextInputValue("titre").trim();

      draft.sousTitre = interaction.fields
        .getTextInputValue("sousTitre").trim();

      draft.contenu = interaction.fields
        .getTextInputValue("contenu").trim();

      draft.image = interaction.fields
        .getTextInputValue("image").trim();

      if (!draft.titre || !draft.contenu) {

        await privateReply(
          interaction,
          "Le titre et le contenu sont obligatoires."
        );

        return true;

      }

      if (draft.image) {

        let validImage = false;

        try {

          const url = new URL(draft.image);

          validImage = url.protocol === "https:";

        } catch {}

        if (!validImage) {

          await privateReply(
            interaction,
            "L'image doit posséder une URL HTTPS valide."
          );

          return true;

        }

      }

      const preview = createPreview(draft);

      draft.state = "preview";
      draft.expiresAt = Date.now() + DRAFT_DURATION;

      await interaction.deferReply({
        flags: MessageFlags.Ephemeral
      });

      await interaction.editReply(preview);

      return true;

    }

    // ======================================
    // MODIFICATION
    // ======================================

    if (
      interaction.isButton() &&
      action === "dyna_annonce_edit"
    ) {

      if (draft.state !== "preview") {

        await privateReply(
          interaction,
          "Cet aperçu n'est plus actif."
        );

        return true;

      }

      // Nouveau brouillon pour invalider
      // les anciens boutons de confirmation.

      const updated = createDraft(
        draft.userId,
        draft.categorie
      );

      updated.titre = draft.titre;
      updated.sousTitre = draft.sousTitre;
      updated.contenu = draft.contenu;
      updated.image = draft.image;

      draft.state = "replaced";

      try {

        await interaction.showModal(
          createModal(updated)
        );

        drafts.delete(draft.id);

      } catch (error) {

        draft.state = "preview";
        drafts.delete(updated.id);

        throw error;

      }

      return true;

    }

    // ======================================
    // ANNULATION
    // ======================================

    if (
      interaction.isButton() &&
      action === "dyna_annonce_cancel"
    ) {

      if (draft.state !== "preview") {

        await privateReply(
          interaction,
          "Cette annonce n'est plus modifiable."
        );

        return true;

      }

      drafts.delete(id);

      await interaction.update({

        content: "✖️ **Communication annulée.**\nAucune annonce n'a été publiée.",

        embeds: [],
        components: [],
        attachments: []

      });

      return true;

    }

    // ======================================
    // PUBLICATION OFFICIELLE
    // ======================================

    if (
      interaction.isButton() &&
      action === "dyna_annonce_publish"
    ) {

      if (draft.state !== "preview") {

        await privateReply(
          interaction,
          "Cette annonce est déjà traitée ou en cours de publication."
        );

        return true;

      }

      // Verrouillage contre les doubles clics

      draft.state = "publishing";

      let sent;

      try {

        await interaction.deferUpdate();

        const channelId =
          process.env.ANNOUNCEMENTS_CHANNEL_ID;

        if (!channelId) {
          throw new Error("Salon non configuré.");
        }

        const channel =
          await interaction.client.channels.fetch(
            channelId
          );

        if (
          !channel ||
          !channel.isTextBased() ||
          channel.isDMBased() ||
          channel.guildId !== GUILD_ID ||
          typeof channel.send !== "function"
        ) {
          throw new Error("Salon de publication invalide.");
        }

        sent = await channel.send(
          createAnnonce(draft)
        );

      } catch (error) {

        // Ne pas relancer automatiquement :
        // Discord pourrait avoir reçu le message
        // malgré une erreur réseau.

        draft.state = "uncertain";

        console.error(
          "[DYNA] Publication non confirmée :",
          error.code || error.name
        );

        await privateReply(
          interaction,
          "⚠️ Publication non confirmée. Vérifiez le salon annonces-agence avant de recommencer."
        );

        return true;

      }

      drafts.delete(id);

      console.log(
        `[DYNA] Annonce publiée par ${interaction.user.id} — Message ${sent.id}`
      );

      await interaction.editReply({

        content: [
          "✅ **Communication officielle publiée !**",
          "",
          "Votre annonce est désormais disponible.",
          "",
          `[Voir l'annonce sur Discord](${sent.url})`
        ].join("\n"),

        embeds: [],
        components: [],
        attachments: []

      });

      return true;

    }

    await privateReply(
      interaction,
      "Action non reconnue."
    );

    return true;

  } catch (error) {

    console.error(
      "[DYNA] Erreur interaction annonce :",
      error.code || error.name
    );

    try {

      await privateReply(
        interaction,
        "⚠️ Une erreur est survenue. Veuillez vérifier l'état de votre annonce."
      );

    } catch {

      console.error(
        "[DYNA] Impossible de répondre à l'interaction."
      );

    }

    return true;

  }

}

module.exports = {
  handleAnnonceInteraction
};
