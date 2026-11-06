

(async function () {
  const message = document.getElementById("admin-message");
  const actions = document.getElementById("admin-actions");
  const directionMap = document.getElementById("direction-map");
  const accessCheck = document.getElementById("access-check");

  try {
    if (!window.D8Cloud) {
      throw new Error("Connexion Discord indisponible.");
    }

    if (!(await D8Cloud.authenticated())) {
      message.textContent =
        "Connectez-vous avec Discord pour continuer.";

      actions.hidden = false;
      return;
    }

    const status = await D8Cloud.role();

    console.log("DYNASTY 8 - Diagnostic des rôles :", {
      role: status.role,
      canWrite: status.canWrite,
      canViewDashboard: status.canViewDashboard,
      canEditZones: status.canEditZones
    });

    if (status.canEditZones !== true) {
      message.textContent =
        "Accès refusé. Cette page est réservée à la Direction.";
      return;
    }

    message.textContent =
      "Accès Direction confirmé. Chargement de la carte…";

    if (!directionMap) {
      throw new Error("Conteneur de carte introuvable.");
    }

    // Préparer la carte Direction.
    document.body.dataset.mapMode = "admin";

    // Afficher le conteneur avant d'initialiser Leaflet.
    directionMap.hidden = false;

    // Charger la carte existante.
    const script = document.createElement("script");
    script.src = "carte.js";

    

script.onload = async () => {
  accessCheck.hidden = true;

  try {
    // Demander le code de l'éditeur à Cloudflare.
    const editorSource =
      await D8Cloud.zoneEditorSource();

    // Créer un script temporaire à partir du code autorisé.
    const blob = new Blob(
      [editorSource],
      { type: "application/javascript" }
    );

    const editorUrl = URL.createObjectURL(blob);
    const editorScript = document.createElement("script");

    editorScript.onload = () => {
      URL.revokeObjectURL(editorUrl);

      if (
        typeof window.D8InitZoneEditor === "function" &&
        window.D8Map
      ) {
        window.D8InitZoneEditor(window.D8Map);

        console.log(
          "DYNASTY 8 — Éditeur Direction initialisé."
        );
      } else {
        console.error(
          "Impossible d'initialiser l'éditeur de zones."
        );
      }
    };

    editorScript.onerror = () => {
      URL.revokeObjectURL(editorUrl);

      console.error(
        "Impossible d'exécuter l'éditeur sécurisé."
      );
    };

    editorScript.src = editorUrl;
    document.body.appendChild(editorScript);

  } catch (error) {
    console.error(
      "DYNASTY 8 — Accès éditeur refusé :",
      error
    );

    alert(
      "Impossible de charger l'éditeur : " +
      error.message
    );
  }
};


    script.onerror = () => {
      message.textContent =
        "Impossible de charger la carte immobilière.";
      directionMap.hidden = true;
    };

    document.body.appendChild(script);

  } catch (error) {
    message.textContent =
      "Impossible de vérifier les autorisations : " +
      error.message;
  }
})();

