

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

    script.onload = () => {
      accessCheck.hidden = true;
      console.log("DYNASTY 8 - Carte Direction chargée.");
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

