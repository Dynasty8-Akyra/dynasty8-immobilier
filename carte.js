
(() => {
  "use strict";

  const root = document.querySelector(".map-page");
  if (!root) return;

  if (typeof L === "undefined") {
    document.getElementById("viewport").textContent =
      "Impossible de charger la carte.";
    return;
  }

  // INFORMATIONS DES QUARTIERS
  const zones = {
    paleto: [
      "Paleto Bay", "Résidentiel",
      "Petite ville côtière du nord de San Andreas.",
      ["Maisons individuelles", "Appartements", "Commerces de proximité"],
      "res", [1450, 4250]
    ],
    grapeseed: [
      "Grapeseed", "Rural",
      "Secteur agricole de Blaine County.",
      ["Fermes", "Maisons rurales", "Terrains agricoles"],
      "rural", [3000, 5550]
    ],
    blaine: [
      "Blaine County", "Rural",
      "Grands espaces naturels et terrains isolés.",
      ["Chalets", "Maisons rurales", "Terrains"],
      "rural", [3100, 3400]
    ],
    sandy: [
      "Sandy Shores", "Résidentiel",
      "Secteur désertique avec habitations et activités locales.",
      ["Maisons", "Mobil-homes", "Petits commerces"],
      "res", [3550, 4450]
    ],
    vinewood: [
      "Vinewood Hills", "Luxe",
      "Résidences prestigieuses sur les hauteurs de Los Santos.",
      ["Villas de luxe", "Maisons avec piscine", "Résidences privées"],
      "lux", [5350, 4050]
    ],
    downtown: [
      "Downtown Los Santos", "Commerces",
      "Quartier central adapté aux activités professionnelles.",
      ["Bureaux", "Commerces", "Locaux professionnels"],
      "biz", [6350, 4650]
    ],
    delperro: [
      "Del Perro", "Résidentiel",
      "Quartier côtier proche de la plage.",
      ["Appartements", "Penthouses", "Maisons"],
      "res", [5900, 3250]
    ],
    industrial: [
      "Zone industrielle", "Garages",
      "Secteur adapté au stockage et aux activités techniques.",
      ["Garages", "Ateliers", "Entrepôts"],
      "ind", [6800, 5150]
    ]
  };

  // CONSERVATION DES PERSONNALISATIONS
  try {
    const saved = JSON.parse(
      localStorage.getItem("dynasty8_zones_v11") || "null"
    );
    if (saved) {
      for (const [id, val] of Object.entries(saved)) {
        if (zones[id] && Array.isArray(val) && val.length === 4) {
          zones[id].splice(0, 4, ...val);
        }
      }
    }
  } catch (e) {}

  const colors = {
    lux: "#bb65ff",
    res: "#4daeff",
    biz: "#ff69b9",
    ind: "#efb54c",
    rural: "#56d78c"
  };

  // CARTE SATELLITE
  const CRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1 / 32, 0, 1 / 32, 0)
  });

  const map = L.map("viewport", {
    crs: CRS,
    minZoom: 0,
    maxZoom: 5,
    zoomControl: false,
    attributionControl: false,
    preferCanvas: false,
    zoomSnap: 0.25,
    zoomDelta: 0.5
  });

  const bounds = [[0, 0], [8192, 8192]];

  L.tileLayer(
    "https://viruxe.github.io/gtav-map-tiles/satelite/{z}/{x}-{y}.webp",
    {
      minZoom: 0,
      maxZoom: 5,
      noWrap: true,
      bounds: bounds,
      tileSize: 256,
      keepBuffer: 3
    }
  ).addTo(map);

  map.fitBounds(bounds);

  const panel = document.getElementById("zonePanel");
  const markers = {};
  const polygons = {};

  let pinned = null;
  let currentFilter = "all";

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  // CONTOURS INDICATIFS DES QUARTIERS
  // Coordonnées [verticale, horizontale] sur la carte 8192.
  const contours = {
    paleto: [
      [1100, 3750], [1000, 4200], [1200, 4600],
      [1650, 4750], [1950, 4400], [1800, 3900]
    ],
    grapeseed: [
      [2600, 5250], [2550, 5750], [3000, 6100],
      [3500, 5900], [3450, 5400]
    ],
    blaine: [
      [2300, 2900], [2200, 3550], [2550, 4100],
      [3050, 4150], [3450, 3800], [3500, 3150],
      [3000, 2750]
    ],
    sandy: [
      [3250, 4050], [3150, 4600], [3400, 5000],
      [3800, 5050], [4050, 4550], [3800, 4100]
    ],
    vinewood: [
      [4950, 3600], [4850, 4200], [5100, 4650],
      [5550, 4600], [5700, 4000], [5400, 3550]
    ],
    downtown: [
      [6000, 4200], [5900, 4800], [6250, 5100],
      [6750, 5050], [6900, 4500], [6500, 4150]
    ],
    delperro: [
      [5550, 2850], [5450, 3350], [5750, 3700],
      [6200, 3600], [6350, 3150], [6000, 2800]
    ],
    industrial: [
      [6500, 4800], [6450, 5400], [6850, 5650],
      [7300, 5450], [7350, 4950], [7000, 4750]
    ]
  };

  function render(id) {
    const z = zones[id];
    if (!z) return;

    panel.innerHTML = `
      <div class="d8-panel-top">
        <div>
          <div class="d8-kicker">
            DYNASTY 8 · ZONE IMMOBILIÈRE
          </div>
          <h2>${escapeHTML(z[0])}</h2>
          <div class="type">${escapeHTML(z[1])}</div>
        </div>
        <button class="d8-close" type="button">×</button>
      </div>

      <div class="d8-panel-photo">
        <span>Catalogue de la zone · Photos à ajouter</span>
      </div>

      <p>${escapeHTML(z[2])}</p>

      <h3>Catégories autorisées</h3>

      <div class="d8-categories">
        ${z[3].map(category => `
          <div class="chip">
            <span class="d8-pin">⌂</span>
            ${escapeHTML(category)}
          </div>
        `).join("")}
      </div>

      <small class="d8-note">
        Les annonces et leurs photos seront ajoutées
        prochainement. Contours provisoires à ajuster.
      </small>
    `;

    panel.classList.add("is-open");
  }

    function highlight(id) {
    for (const [key, polygon] of Object.entries(polygons)) {
      const active = key === id;

      polygon.setStyle({
        weight: active ? 5 : 3,
        fillOpacity: active ? 0.25 : 0.10
      });
    }
  }

  function preview(id) {
    if (pinned) return;
    render(id);
    highlight(id);
  }

  function select(id) {
    pinned = id;
    render(id);
    highlight(id);
  }

  function close() {
    pinned = null;
    panel.classList.remove("is-open");
    highlight(null);
  }

  // CRÉATION DES ZONES NÉON
  for (const [id, z] of Object.entries(zones)) {
    const color = colors[z[4]];

    const polygon = L.polygon(contours[id], {
      color: color,
      weight: 3,
      opacity: 0.95,
      fillColor: color,
      fillOpacity: 0.10,
      interactive: true,
      className: "d8-neon-polygon"
    }).addTo(map);

    polygons[id] = polygon;

    polygon.on("mouseover", () => preview(id));

    polygon.on("mouseout", () => {
      if (!pinned) {
        panel.classList.remove("is-open");
        highlight(null);
      }
    });

    polygon.on("click", () => select(id));


    // NOM DU QUARTIER AU SURVOL UNIQUEMENT
    polygon.bindTooltip(
      `<span class="d8-zone-label">${escapeHTML(z[0])}</span>`,
      {
        permanent: false,
        sticky: true,
        direction: "top",
        opacity: 1,
        className: "d8-label-tooltip"
      }
    );
  
  }

  // FERMETURE DU CATALOGUE
  panel.addEventListener("click", e => {
    if (e.target.closest(".d8-close")) {
      close();
    }
  });

  // FILTRES
  document.getElementById("filters")
    .addEventListener("click", e => {
      const button = e.target.closest("button[data-type]");
      if (!button) return;

      currentFilter = button.dataset.type;

      document.querySelectorAll(".map-toolbar button")
        .forEach(b => b.classList.toggle("on", b === button));

      for (const [id, z] of Object.entries(zones)) {
        const visible =
          currentFilter === "all" || z[4] === currentFilter;

        for (const layer of [polygons[id]]) {
          if (visible) {
            if (!map.hasLayer(layer)) layer.addTo(map);
          } else {
            if (map.hasLayer(layer)) map.removeLayer(layer);
          }
        }

        if (!visible && pinned === id) close();
      }
    });

  // ZOOM
  document.getElementById("zoomIn").onclick =
    () => map.zoomIn(0.5);

  document.getElementById("zoomOut").onclick =
    () => map.zoomOut(0.5);

  document.getElementById("reset").onclick =
    () => map.fitBounds(bounds);

  // POSITION DE DÉPART
  map.whenReady(() => {
    map.setView([5350, 4500], 3);
  });

})();
