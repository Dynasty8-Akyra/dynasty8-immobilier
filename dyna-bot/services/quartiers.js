// ==========================================
// DYNASTY 8 — SERVICE IMMOBILIER
// SYNCHRONISATION DES QUARTIERS
// NEON MAX — PRESTIGE
// ==========================================

const ZONES_API =
  "https://dynasty8-immobilier.pages.dev/api/discord-access?action=zones-list";

// ==========================================
// RÉCUPÉRATION DES QUARTIERS
// ==========================================

async function getQuartiers() {

  const response = await fetch(ZONES_API, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache"
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(
      `API quartiers indisponible : ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data.zones)) {
    throw new Error("Liste des quartiers invalide.");
  }

  const quartiers = [];
  const ids = new Set();

  for (const zone of data.zones) {

    if (
      !zone ||
      typeof zone.id !== "string" ||
      typeof zone.name !== "string" ||
      !zone.id.trim() ||
      !zone.name.trim()
    ) {
      throw new Error("Quartier immobilier invalide.");
    }

    // Exclusion des zones non immobilières

    if (zone.category === "excluded") {
      continue;
    }

    if (!Array.isArray(zone.interiors)) {
      throw new Error("Catégories d'intérieurs invalides.");
    }

    if (ids.has(zone.id)) {
      throw new Error("Identifiant de quartier en double.");
    }

    ids.add(zone.id);

    // Récupération des types d'intérieurs

    const interieurs = [
      ...new Set(
        zone.interiors
          .filter(item => typeof item === "string")
          .map(item => item.trim())
          .filter(Boolean)
      )
    ];

    quartiers.push({
      id: zone.id,
      nom: zone.name.trim(),
      categorie: zone.category,
      interieurs
    });

  }

  // Classement alphabétique

  quartiers.sort((a, b) =>
    a.nom.localeCompare(b.nom, "fr")
  );

  return quartiers;

}

// ==========================================
// RÉCUPÉRATION DES TYPES D'INTÉRIEURS
// ==========================================

function getTypesInterieurs(quartiers, quartierId = null) {

  if (quartierId === null) {

    // Aucune préférence de localisation

    return [
      ...new Set(
        quartiers.flatMap(quartier =>
          quartier.interieurs
        )
      )
    ].sort((a, b) => a.localeCompare(b, "fr"));

  }

  const quartier = quartiers.find(
    item => item.id === quartierId
  );

  if (!quartier) {
    throw new Error("Quartier introuvable.");
  }

  return [...quartier.interieurs].sort(
    (a, b) => a.localeCompare(b, "fr")
  );

}

// ==========================================
// EXPORTATION DU SERVICE
// ==========================================

module.exports = {
  getQuartiers,
  getTypesInterieurs
};
