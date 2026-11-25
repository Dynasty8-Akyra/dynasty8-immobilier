const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const path = require("node:path");

// ==========================================
// DYNASTY 8 — CENTRE DE COMMUNICATION
// NEON MAX — PRESTIGE
// ACCÈS RÉSERVÉ À LA DIRECTION
// ==========================================

function createCentreDyna() {

  // BANNIÈRE OFFICIELLE

  const banner = new AttachmentBuilder(
    path.join(__dirname, "../assets/centre-dyna.png"),
    { name: "centre-dyna.png" }
  );

  // SIGNATURE DYNA

  const signature = new AttachmentBuilder(
    path.join(__dirname, "../assets/signature.png"),
    { name: "signature.png" }
  );

  // EN-TÊTE

  const header = new EmbedBuilder()
    .setColor("#E11928")
    .setImage("attachment://centre-dyna.png");

  // PANNEAU DE COMMUNICATION

  const centre = new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle("♛ Centre de communication Dyna")
    .setDescription([
      "**ESPACE PRIVÉ — DIRECTION**",
      "",
      "Bienvenue dans votre centre de communication officiel.",
      "",
      "Je suis **Dyna**, votre assistante officielle.",
      "",
      "Depuis cet espace, vous pouvez rédiger, prévisualiser et publier les communications officielles de Dynasty 8 à destination des citoyens.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "**📢 ANNONCES OFFICIELLES**",
      "",
      "• Informations générales",
      "• Horaires et fermetures",
      "• Recrutement",
      "• Offres promotionnelles",
      "• Événements immobiliers",
      "• Informations importantes",
      "",
      "Les annonces sont publiées dans le salon officiel de l'agence après validation de la Direction.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "🔒 *Cet espace est exclusivement réservé à la Direction Dynasty 8.*"
    ].join("\n"))
    .setImage("attachment://signature.png");

  // BOUTON DE COMMUNICATION

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("dyna_annonce_create")
        .setLabel("Annonce officielle")
        .setEmoji("📢")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(false)
    );

  return {
    embeds: [
      header,
      centre
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
  createCentreDyna
};
