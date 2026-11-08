
/* ==========================================
   DYNASTY 8 — AGENT DASHBOARD
   RED NEON PRESTIGE V2
   ========================================== */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  let properties = [];
  let canWriteDashboard = false;

  /* ------------------------------------------
     OUTILS
     ------------------------------------------ */

  const currency = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0
    }).format(Number(value) || 0) + " $";
  };

  const esc = (value) => {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]
    );
  };

  /* ------------------------------------------
     AFFICHAGE DES ANNONCES
     ------------------------------------------ */

  function render() {
    const search = $("search");
    const rows = $("rows");
    const empty = $("empty");

    if (!search || !rows) return;

    const query = search.value
      .toLocaleLowerCase("fr")
      .trim();

    const filtered = properties.filter((property) => {
      return [
        property.name,
        property.area,
        property.type
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("fr")
          .includes(query)
      );
    });

    rows.innerHTML = filtered.map((property) => `
      <tr>
        <td>${esc(property.name)}</td>
        <td>${esc(property.type)}</td>
        <td>${esc(property.area)}</td>
        <td>${currency(property.price)}</td>
        ${
          canWriteDashboard
            ? `<td>
                <a href="admin-annonces.html?edit=${encodeURIComponent(property.id)}">
                  MODIFIER ↗
                </a>
              </td>`
            : ""
        }
      </tr>
    `).join("");

    if (empty) {
      empty.hidden = filtered.length > 0;
    }
  }

  /* ------------------------------------------
     NAVIGATION DES CARTES
     ------------------------------------------ */

  function createMapNavigation(access) {
    const dashboard = $("dashboard");

    if (!dashboard) return;

    // Éviter de créer plusieurs fois les boutons.
    if (dashboard.querySelector(".d8-dashboard-maps")) {
      return;
    }

    const navigation = document.createElement("nav");

    navigation.className = "d8-dashboard-maps";
    navigation.setAttribute(
      "aria-label",
      "Navigation des cartes immobilières"
    );

    // Carte immobilière publique.
    const publicMap = document.createElement("a");

    publicMap.href = "carte.html";
    publicMap.className = "d8-map-access";
    publicMap.textContent = "⌖ CARTE IMMOBILIÈRE";

    navigation.appendChild(publicMap);

    // Éditeur réservé à la Direction.
    if (access.canEditZones === true) {
      const directionMap = document.createElement("a");

      directionMap.href = "admin-carte.html";
      directionMap.className =
        "d8-map-access d8-map-direction";

      directionMap.textContent =
        "♛ ÉDITEUR DIRECTION";

      navigation.appendChild(directionMap);
    }

    dashboard.prepend(navigation);
  }

  /* ------------------------------------------
     AUTORISATIONS DU TABLEAU DE BORD
     ------------------------------------------ */

  function applyPermissions(access) {
    canWriteDashboard = access.canWrite === true;

    window.canWriteDashboard = canWriteDashboard;

    if (!canWriteDashboard) {
      // Masquer les actions d'écriture.
      const primary = document.querySelector(".primary");

      if (primary) {
        primary.style.display = "none";
      }

      const bottomAction = document.querySelector(
        ".bottom a:first-child"
      );

      if (bottomAction) {
        bottomAction.style.display = "none";
      }

      // Supprimer la colonne Modifier.
      const lastHeader = document.querySelector(
        "thead th:last-child"
      );

      if (lastHeader) {
        lastHeader.remove();
      }
    }
  }

  /* ------------------------------------------
     STATISTIQUES
     ------------------------------------------ */

  function updateStatistics() {
    const total = properties.length;

    const sum = properties.reduce(
      (result, property) =>
        result + (Number(property.price) || 0),
      0
    );

    const average = total ? sum / total : 0;

    const types = new Set(
      properties.map((property) => property.type)
    ).size;

    if ($("total")) {
      $("total").textContent = total;
    }

    if ($("value")) {
      $("value").textContent = currency(sum);
    }

    if ($("average")) {
      $("average").textContent = currency(average);
    }

    if ($("types")) {
      $("types").textContent = types;
    }
  }

  /* ------------------------------------------
     INITIALISATION ET CONNEXION DISCORD
     ------------------------------------------ */

  async function init() {
    const gate = $("gate");
    const dashboard = $("dashboard");

    try {
      if (
        !window.D8Cloud ||
        !D8Cloud.ready() ||
        !(await D8Cloud.authenticated())
      ) {
        location.replace("agent-login.html");
        return;
      }

      // Vérifier les permissions Discord côté serveur.
      const access = await D8Cloud.role();

      if (access.canViewDashboard !== true) {
        location.replace("index.html");
        return;
      }

      // Appliquer les autorisations.
      applyPermissions(access);

/* ==========================================
   DYNASTY 8 — TITRE SELON LE RÔLE DISCORD
   ========================================== */

const dashboardTitle = document.querySelector(
  "#dashboard h1"
);

if (dashboardTitle) {
  if (access.canEditZones === true) {
    dashboardTitle.textContent =
      "Tableau de bord Direction";
  } else if (access.role === "formation") {
    dashboardTitle.textContent =
      "Tableau de bord Formation";
  } else {
    dashboardTitle.textContent =
      "Tableau de bord Agent";
  }
}

      // Ajouter les boutons de navigation.
      createMapNavigation(access);

      // Charger les annonces.
      properties = await D8Cloud.list();

      // Calculer les statistiques.
      updateStatistics();

      // Afficher le tableau de bord.
      if (gate) {
        gate.hidden = true;
      }

      if (dashboard) {
        dashboard.hidden = false;
      }

      render();

      console.log(
        "DYNASTY 8 — Tableau de bord chargé.",
        {
          role: access.role,
          canWrite: access.canWrite,
          canEditZones: access.canEditZones
        }
      );

    } catch (error) {
      console.error(
        "DYNASTY 8 — Erreur tableau de bord :",
        error
      );

      if (gate) {
        gate.hidden = false;
        gate.textContent =
          "Impossible de charger le tableau de bord : " +
          error.message;
      }
    }
  }

  /* ------------------------------------------
     ÉVÉNEMENTS
     ------------------------------------------ */

  const search = $("search");

  if (search) {
    search.addEventListener("input", render);
  }

  const logout = $("logout");

  if (logout) {
    logout.addEventListener("click", async () => {
      try {
        await D8Cloud.logout();
      } finally {
        location.replace("agent-login.html");
      }
    });
  }

  // Démarrer le tableau de bord.
  init();

})();

