const {
  EmbedBuilder,
  AttachmentBuilder
} = require("discord.js");

const path = require("node:path");

// ==========================================
// DYNASTY 8 — NEON MAX PRESTIGE
// MESSAGE OFFICIEL DE BIENVENUE
// ==========================================

function createBienvenue() {

  const banner = new AttachmentBuilder(
    path.join(__dirname, "../assets/bienvenue.png"),
    { name: "bienvenue.png" }
  );

  const signature = new AttachmentBuilder(
    path.join(__dirname, "../assets/signature.png"),
    { name: "signature.png" }
  );

  // BANNIÈRE SUPÉRIEURE

  const header = new EmbedBuilder()
    .setColor("#E11928")
    .setImage("attachment://bienvenue.png");

  // MESSAGE PRINCIPAL

  const welcome = new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle("♛ Bienvenue chez Dynasty 8")
    .setDescription([
      "*Bien plus qu'une adresse, un art de vivre.*",
      "",
      "Cher citoyen,",
      "",
      "Dynasty 8 vous souhaite la bienvenue au sein de son agence immobilière.",
      "",
      "Je suis **Dyna**, votre assistante officielle.",
      "",
      "Notre équipe vous accompagne dans chaque étape de votre projet immobilier, de la recherche de votre futur bien jusqu'à la concrétisation de vos ambitions.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "**♛ NOS SERVICES IMMOBILIERS**",
      "",
      "◆ Achat et vente de propriétés",
      "◆ Location immobilière",
      "◆ Accompagnement personnalisé",
      "◆ Mise en relation avec nos agents",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "*Votre avenir commence à la bonne adresse.*"
    ].join("\n"))
    .setImage("attachment://signature.png");

  return {
    embeds: [header, welcome],
    files: [banner, signature],
    allowedMentions: { parse: [] }
  };

}

module.exports = { createBienvenue };
