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
// RÈGLEMENT OFFICIEL
// ==========================================

function createReglement() {

  const banner = new AttachmentBuilder(
    path.join(__dirname, "../assets/reglement.png"),
    { name: "reglement.png" }
  );

  const signature = new AttachmentBuilder(
    path.join(__dirname, "../assets/signature.png"),
    { name: "signature.png" }
  );

  // BANNIÈRE SUPÉRIEURE

  const header = new EmbedBuilder()
    .setColor("#E11928")
    .setImage("attachment://reglement.png");

  // PARTIE I — DISCORD

  const discordRules = new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle("♛ Règlement officiel de Dynasty 8")
    .setDescription([
      "*L'excellence commence par le respect.*",
      "",
      "Cher citoyen,",
      "",
      "Afin de garantir une expérience immobilière agréable, professionnelle et équitable, Dynasty 8 invite l'ensemble de ses membres à respecter les dispositions suivantes.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "**Ⅰ — RÈGLEMENT DU DISCORD**",
      "",
      "**Article 01 — Respect et comportement**",
      "Chaque membre se doit d'adopter un comportement respectueux et courtois. Les insultes, provocations, discriminations, menaces et comportements abusifs sont interdits.",
      "",
      "**Article 02 — Utilisation des salons**",
      "Chaque salon possède une fonction précise. Le spam, les mentions abusives et les publicités non autorisées sont interdits.",
      "",
      "**Article 03 — Identité et confidentialité**",
      "L'usurpation d'identité d'un agent ou d'un membre de la Direction est interdite. Les informations personnelles et les échanges confidentiels ne doivent pas être divulgués sans autorisation.",
      "",
      "**Article 04 — Respect de l'équipe**",
      "Les agents immobiliers et la Direction doivent être traités avec respect. Toute réclamation doit être formulée calmement auprès de la Direction."
    ].join("\n"));

  // PARTIE II — IMMOBILIER ET RP

  const immobilierRules = new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle("Ⅱ — RÈGLEMENT IMMOBILIER & RP")
    .setDescription([
      "**Article 05 — Cohérence Roleplay**",
      "Toute démarche immobilière doit respecter le règlement général d'Akyra RP. Le métagaming, les informations HRP utilisées en RP et les comportements contraires aux règles du serveur sont interdits.",
      "",
      "**Article 06 — Transactions immobilières**",
      "Toute vente, acquisition ou location effectuée auprès de Dynasty 8 doit être encadrée par un agent autorisé. Les tentatives de fraude, d'escroquerie ou de falsification de documents sont interdites dans le cadre des services de l'agence.",
      "",
      "**Article 07 — Visites immobilières**",
      "Les citoyens sont invités à respecter les rendez-vous convenus avec les agents et à prévenir en cas d'annulation ou d'indisponibilité.",
      "",
      "**Article 08 — Tarifs et négociations**",
      "Les tarifs et frais d'agence applicables sont communiqués par Dynasty 8. Toute négociation reste soumise aux conditions de l'agence et aux règles économiques du serveur.",
      "",
      "**Article 09 — Communication avec l'agence**",
      "Les demandes immobilières doivent être effectuées par les canaux officiels. Les échanges professionnels peuvent être conservés dans les Archives Clients afin d'assurer le suivi des dossiers.",
      "",
      "**Article 10 — Confidentialité immobilière**",
      "Les dossiers clients, informations contractuelles et données immobilières confidentielles ne doivent pas être communiqués à des personnes non autorisées."
    ].join("\n"));

  // PARTIE III — MODÉRATION ET SANCTIONS

  const moderationRules = new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle("Ⅲ — MODÉRATION & SANCTIONS")
    .setDescription([
      "**Article 11 — Non-respect du règlement**",
      "",
      "Selon la nature et la gravité des faits, la Direction se réserve la possibilité d'appliquer :",
      "",
      "◆ Un rappel au règlement",
      "◆ Un avertissement",
      "◆ Une restriction temporaire d'accès",
      "◆ Une exclusion du Discord de l'agence",
      "◆ Un signalement au staff d'Akyra RP",
      "",
      "**Article 12 — Application du règlement**",
      "L'utilisation des services de Dynasty 8 implique le respect du présent règlement. Celui-ci pourra évoluer en fonction des besoins de l'agence et des règles d'Akyra RP.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "*Merci de contribuer à l'excellence et au prestige de notre agence.*",
      "",
      "**La Direction Dynasty 8**"
    ].join("\n"))
    .setImage("attachment://signature.png");

  // BOUTONS DE NAVIGATION

  const buttons = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setLabel("Bienvenue")
        .setEmoji("👑")
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://discord.com/channels/1567889374836957286/1575184106436829385"
        ),

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
      discordRules,
      immobilierRules,
      moderationRules
    ],
    files: [banner, signature],
    components: [buttons],
    allowedMentions: { parse: [] }
  };

}

module.exports = { createReglement };
