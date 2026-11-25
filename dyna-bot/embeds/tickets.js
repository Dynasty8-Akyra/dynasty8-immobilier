const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const path = require("node:path");

// ==========================================
// DYNASTY 8 — SERVICE CLIENTÈLE
// NEON MAX — PRESTIGE
// TICKETS IMMOBILIERS
// ==========================================

function createTicketsPanel() {

  // BANNIÈRE OFFICIELLE

  const banner = new AttachmentBuilder(
    path.join(__dirname, "../assets/service-clientele.png"),
    { name: "service-clientele.png" }
  );

  // SIGNATURE DYNA

  const signature = new AttachmentBuilder(
    path.join(__dirname, "../assets/signature.png"),
    { name: "signature.png" }
  );

  // EN-TÊTE

  const header = new EmbedBuilder()
    .setColor("#E11928")
    .setImage("attachment://service-clientele.png");

  // PANNEAU SERVICE CLIENTÈLE

  const panel = new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle("♛ Votre projet immobilier commence ici")
    .setDescription([
      "Cher citoyen,",
      "",
      "Je suis **Dyna**, votre assistante officielle Dynasty 8.",
      "",
      "Vous souhaitez acquérir, louer ou vendre une propriété ? Notre équipe immobilière est à votre disposition pour vous accompagner.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "**NOS SERVICES IMMOBILIERS**",
      "",
      "◆ Achat d'une propriété",
      "◆ Location d'une propriété",
      "◆ Vente d'une propriété",
      "◆ Renseignements immobiliers",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "**COMMENT CONTACTER NOTRE ÉQUIPE ?**",
      "",
      "Cliquez sur le bouton ci-dessous et renseignez votre demande.",
      "",
      "Un espace de discussion confidentiel sera automatiquement créé afin que vous puissiez échanger directement avec nos agents immobiliers.",
      "",
      "Notre équipe travaille en collaboration afin de vous garantir un accompagnement continu.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "🔒 *Votre conversation est réservée à vous-même et aux personnes autorisées. Les échanges seront conservés dans votre dossier client.*"
    ].join("\n"))
    .setImage("attachment://signature.png");

  // BOUTONS

  const buttons = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("dyna_ticket_create")
        .setLabel("Ouvrir un ticket immobilier")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true),

      new ButtonBuilder()
        .setLabel("Site immobilier")
        .setEmoji("🏡")
        .setStyle(ButtonStyle.Link)
        .setURL("https://dynasty8-immobilier.pages.dev/")

    );

  return {
    embeds: [
      header,
      panel
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
  createTicketsPanel
};
