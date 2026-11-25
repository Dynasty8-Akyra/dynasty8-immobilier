const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const path = require("node:path");

function createServicePanel() {

  // BANDEAU OFFICIEL DYNASTY 8

  const banner = new AttachmentBuilder(
    path.join(__dirname, "../assets/prise-de-service.png"),
    {
      name: "prise-de-service.png"
    }
  );

  // SIGNATURE OFFICIELLE

  const signature = new AttachmentBuilder(
    path.join(__dirname, "../assets/signature.png"),
    {
      name: "signature.png"
    }
  );

  // EMBED DU BANDEAU

  const header = new EmbedBuilder()
    .setColor("#E11928")
    .setImage("attachment://prise-de-service.png");

  // EMBED PRINCIPAL

  const panel = new EmbedBuilder()
    .setColor("#A5092C")
    .setTitle("♛ Gestion des prises de service")
    .setDescription(
      [
        "Chers agents,",
        "",
        "Bienvenue dans votre espace professionnel Dynasty 8.",
        "",
        "Veuillez signaler votre disponibilité à l'aide des boutons ci-dessous.",
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "**🟢 PRISE DE SERVICE**",
        "",
        "Indiquez votre disponibilité auprès de notre clientèle.",
        "",
        "**🔴 FIN DE SERVICE**",
        "",
        "Signalez votre indisponibilité lorsque vous quittez votre service.",
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "Le compteur public sera automatiquement actualisé.",
        "",
        "*L'excellence immobilière, à votre service.*"
      ].join("\n")
    )
    .setImage("attachment://signature.png")
    .setFooter({
      text: "DYNASTY 8 • ESPACE PROFESSIONNEL"
    });

  // BOUTONS DE SERVICE

  const buttons = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("dyna_service_start")
        .setLabel("Prise de service")
        .setEmoji("🟢")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId("dyna_service_end")
        .setLabel("Fin de service")
        .setEmoji("🔴")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)

    );

  // PANNEAU COMPLET

  return {
    embeds: [
      header,
      panel
    ],

    files: [
      banner,
      signature
    ],

    components: [
      buttons
    ],

    allowedMentions: {
      parse: []
    }
  };

}

module.exports = {
  createServicePanel
};
