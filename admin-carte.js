
(async function () {
  const message = document.getElementById("admin-message");
  const actions = document.getElementById("admin-actions");

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

    if (status.canEditZones !== true) {
      message.textContent =
        "Accès refusé. Cette page est réservée à la Direction.";
      return;
    }

    message.textContent =
      "Accès Direction confirmé. Préparation de l'éditeur…";

    // L'éditeur sera chargé ici lors de l'étape suivante.

  } catch (error) {
    message.textContent =
      "Impossible de vérifier les autorisations : " +
      error.message;
  }
})();
