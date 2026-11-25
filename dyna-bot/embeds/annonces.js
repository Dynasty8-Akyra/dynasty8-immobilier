const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const path = require("node:path");

// ==========================================
// DYNASTY 8 — NEON MAX PRESTIGE
// COMMUNICATIONS OFFICIELLES
// ==========================================

const CATEGORIES = {

  information: {
    label: "📢 INFORMATION GÉNÉRALE",
    color: "#E11928"
  },

  horaires: {
    label: "🕐 HORAIRES ET FERMETURES",
    color: "#A5092C"
  },

  recrutement: {
    label: "👥 RECRUTEMENT",
    color: "#E11928"
  },

  promotion: {
    label: "🏷️ OFFRE PROMOTIONNELLE",
    color: "#A5092C"
  },

  evenement: {
    label: "🥂 ÉVÉNEMENT IMMOBILIER",
    color: "#510B1A"
  },

  important: {
    label: "⚠️ INFORMATION IMPORTANTE",
    color: "#FF0000"
  }

};

// ==========================================
// CRÉATION D'UNE ANNONCE DYNAMIQUE
// ==========================================

function createAnnonce(data) {

  if (!data || typeof data !== "object") {
    throw new Error("Annonce invalide.");
  }

  const {
    titre,
    contenu,
    categorie = "information",
    sousTitre = "",
    image = ""
  } = data;

  if (
    typeof titre !== "string" ||
    !titre.trim() ||
    titre.length > 200
  ) {
    throw new Error("Titre invalide : 200 caractères maximum.");
  }

  if (
    typeof contenu !== "string" ||
    !contenu.trim() ||
    contenu.length > 3000
  ) {
    throw new Error("Contenu invalide : 3000 caractères maximum.");
  }

  if (
    typeof sousTitre !== "string" ||
    sousTitre.length > 200
  ) {
    throw new Error("Sous-titre invalide.");
  }

  if (
    typeof categorie !== "string" ||
    !Object.hasOwn(CATEGORIES, categorie)
  ) {
    throw new Error("Catégorie invalide.");
  }

  const category = CATEGORIES[categorie];

  // BANNIÈRES OFFICIELLES

  const banner = new AttachmentBuilder(
    path.join(__dirname, "../assets/annonces.png"),
    { name: "annonces.png" }
  );

  const signature = new AttachmentBuilder(
    path.join(__dirname, "../assets/signature.png"),
    { name: "signature.png" }
  );

  // EN-TÊTE

  const header = new EmbedBuilder()
    .setColor("#E11928")
    .setImage("attachment://annonces.png");

  // CONTENU DE L'ANNONCE

  const announcement = new EmbedBuilder()
    .setColor(category.color)
    .setAuthor({
      name: category.label
    })
    .setTitle(`♛ ${titre.trim()}`)
    .setDescription([
      sousTitre.trim() ? `*${sousTitre.trim()}*` : "",
      "",
      contenu.trim(),
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "**La Direction Dynasty 8**"
    ].join("\n"))
    .setTimestamp();

  // IMAGE FACULTATIVE

  if (image) {

    if (typeof image !== "string") {
      throw new Error("Image invalide.");
    }

    const imageURL = new URL(image);

    if (imageURL.protocol !== "https:") {
      throw new Error("L'image doit utiliser HTTPS.");
    }

    announcement.setImage(imageURL.href);

  }

  // SIGNATURE OFFICIELLE DYNA

  const footer = new EmbedBuilder()
    .setColor(category.color)
    .setImage("attachment://signature.png");

  // BOUTONS DE NAVIGATION

  const buttons = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setLabel("Site immobilier")
        .setEmoji("🏠")
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://dynasty8-immobilier.pages.dev/"
        ),

      new ButtonBuilder()
        .setLabel("Contacter Dyna")
        .setEmoji("💬")
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://discord.com/channels/1567889374836957286/1575184319104942090"
        )

    );

  return {
    embeds: [
      header,
      announcement,
      footer
    ],
    files: [
      banner,
      signature
    ],
    components: [buttons],
    allowedMentions: {
      parse: []
    }
  };

}

module.exports = {
  createAnnonce,
  CATEGORIES
};
