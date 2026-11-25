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
      "Bienvenue dans votre centre de communication professionnel.",
      "",
      "Je suis **Dyna**, votre assistante officielle.",
      "",
      "Depuis cet espace, vous pouvez gérer les communications officielles de Dynasty 8 et transmettre vos informations aux citoyens ainsi qu'à vos agents immobiliers.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "**📢 ANNONCES OFFICIELLES**",
      "Publier une communication publique dans le salon des annonces de l'agence.",
      "",
      "**👥 NOTIFICATIONS GÉNÉRALES**",
      "Transmettre une information à l'ensemble des agents ou à une sélection d'agents.",
      "",
      "**👤 NOTIFICATIONS INDIVIDUELLES**",
      "Adresser une communication personnalisée dans le bureau privé d'un agent.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "🔒 *Cet espace est exclusivement réservé à la Direction Dynasty 8.*"
    ].join("\n"))
    .setImage("attachment://signature.png");

  // BOUTONS DE COMMUNICATION

  const buttons = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("dyna_annonce_create")
        .setLabel("Annonce officielle")
        .setEmoji("📢")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("dyna_notification_generale")
        .setLabel("Notification générale")
        .setEmoji("👥")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("dyna_notification_individuelle")
        .setLabel("Notification individuelle")
        .setEmoji("👤")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)

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
