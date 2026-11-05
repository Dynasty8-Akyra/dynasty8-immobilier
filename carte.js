
(() => {
  "use strict";
  console.log("DYNASTY 8 : démarrage de carte.js");

console.log("Leaflet :", typeof L);

console.log(
  "Conteneur viewport :",
  document.getElementById("viewport")
);

console.log(
  "Page carte :",
  document.querySelector(".map-page")
);

const root = document.getElementById("viewport");
if (!root) {
  console.error("DYNASTY 8 : conteneur de carte introuvable");
  return;
}

  const viewport = document.getElementById("viewport");

  if (!viewport || typeof L === "undefined") {
    if (viewport) {
      viewport.textContent = "Impossible de charger la carte.";
    }
    return;
  }

  // =====================================
  // COULEURS DYNASTY 8
  // =====================================

  const COLORS = {
    lux: "#bb65ff",
    res: "#4daeff",
    rural: "#28e6ed",
    ind: "#ff69b9",
    excluded: "#8e92a5"
  };

  // =====================================
  // QUARTIERS ET ZONES IMMOBILIERES
  // =====================================
  // Coordonnees provisoires sur 8192 x 8192.
  // Nous ajusterons les contours ensemble.

  const zones = {

    paleto: {
      name: "Paleto Bay",
      type: "Rural / Côtier",
      category: "rural",
      description: "Maisons et propriétés du nord de San Andreas.",
      interiors: [
        "Maisons",
        "Propriétés",
        "Commerces de proximité"
      ],
      

points: [
  [720, 3920],
  [810, 3870],
  [900, 3900],
  [1010, 3970],
  [1110, 4080],
  [1240, 4210],
  [1390, 4310],
  [1530, 4340],
  [1630, 4260],
  [1650, 4120],
  [1570, 3980],
  [1440, 3870],
  [1300, 3750],
  [1160, 3670],
  [1020, 3680],
  [890, 3770]
]

    },

    grapeseed: {
      name: "Grapeseed",
      type: "Rural / Côtier",
      category: "rural",
      description: "Fermes et maisons rurales.",
      interiors: ["Fermes","Maisons","Terrains"],
      points: [
        [2600,5250],[2550,5750],[3000,6100],
        [3500,5900],[3450,5400]
      ]
    },

    sandy: {
      name: "Sandy Shores",
      type: "Rural / Côtier",
      category: "rural",
      description: "Habitations et propriétés du désert.",
      interiors: [
        "Maisons",
        "Mobil-homes",
        "Petits commerces"
      ],
      points: [
        [3250,4050],[3150,4600],[3400,5000],
        [3800,5050],[4050,4550],[3800,4100]
      ]
    },

    chumash: {
      name: "Chumash",
      type: "Rural / Côtier",
      category: "rural",
      description: "Maisons et propriétés sur la côte ouest.",
      interiors: ["Maisons","Propriétés côtières"],
      points: [
        [4800,2450],[4650,2700],[5050,2820],
        [5450,2700],[5530,2480],[5200,2360]
      ]
    },

    vinewood_hills: {
      name: "Vinewood Hills",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Villas et demeures d'exception.",
      interiors: [
        "Villas",
        "Maisons haut standing",
        "Propriétés avec piscine"
      ],
      points: [
        [4950,3600],[4850,4200],[5100,4650],
        [5550,4600],[5700,4000],[5400,3550]
      ]
    },

    richman: {
      name: "Richman",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Résidences de prestige.",
      interiors: ["Villas","Maisons haut standing"],
      points: [
        [5480,3150],[5370,3500],[5600,3700],
        [5820,3530],[5760,3200]
      ]
    },

    mirror_park: {
      name: "Mirror Park",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Maisons résidentielles de bon standing.",
      interiors: ["Maisons","Maisons haut standing"],
      points: [
        [5620,5100],[5540,5480],[5850,5650],
        [6100,5400],[5980,5050]
      ]
    },

    vespucci: {
      name: "Vespucci",
      type: "Prestige / Haut standing",
      category: "lux",
      description: "Maisons et résidences haut standing du littoral.",
      interiors: [
        "Maisons haut standing",
        "Appartements",
        "Résidences"
      ],
      points: [
        [5900,2900],[5680,3300],[5870,3600],
        [6250,3550],[6380,3100],[6150,2820]
      ]
    },

    little_seoul: {
      name: "Little Seoul",
      type: "Résidentiel",
      category: "res",
      description: "Logements urbains et appartements.",
      interiors: [
        "Appartements",
        "Studios",
        "Maisons de ville"
      ],
      points: [
        [6250,3550],[6100,4000],[6350,4230],
        [6640,4010],[6630,3600]
      ]
    },

    rockford: {
      name: "Rockford Hills",
      type: "Résidentiel",
      category: "res",
      description: "Appartements et maisons du centre-ouest.",
      interiors: [
        "Appartements",
        "Maisons",
        "Penthouses"
      ],
      points: [
        [5670,3650],[5630,4080],[5890,4300],
        [6170,4120],[6070,3740]
      ]
    },

    vinewood: {
      name: "Vinewood",
      type: "Résidentiel",
      category: "res",
      description: "Logements urbains de Vinewood.",
      interiors: [
        "Appartements",
        "Studios",
        "Maisons"
      ],
      points: [
        [5600,4250],[5580,4830],[5850,5090],
        [6100,4780],[6000,4300]
      ]
    },

    downtown: {
      name: "Centre-ville",
      type: "Résidentiel",
      category: "res",
      description: "Appartements et studios de Los Santos.",
      interiors: [
        "Appartements",
        "Studios",
        "Penthouses"
      ],
      points: [
        [6150,4300],[6100,4810],[6400,5010],
        [6750,4860],[6740,4440],[6500,4190]
      ]
    },

    south_ls: {
      name: "South Los Santos",
      type: "Résidentiel",
      category: "res",
      description: "Maisons, appartements et petits logements.",
      interiors: [
        "Maisons",
        "Appartements",
        "Studios"
      ],
      points: [
        [6770,4000],[6700,4550],[7150,4730],
        [7410,4370],[7320,3970]
      ]
    },

    east_ls: {
      name: "East Los Santos",
      type: "Résidentiel",
      category: "res",
      description: "Habitations et immeubles de l'est de Los Santos.",
      interiors: [
        "Maisons",
        "Appartements",
        "Studios"
      ],
      points: [
        [6420,5100],[6380,5510],[6810,5680],
        [7220,5450],[7180,5000],[6750,4830]
      ]
    },

    la_puerta: {
      name: "La Puerta",
      type: "Industriel / Professionnel",
      category: "ind",
      description: "Garages et locaux professionnels.",
      interiors: [
        "Garages",
        "Entrepôts",
        "Ateliers"
      ],
      points: [
        [6850,3280],[6750,3680],[7040,3930],
        [7320,3740],[7270,3400]
      ]
    },

    port: {
      name: "Port de Los Santos",
      type: "Industriel / Professionnel",
      category: "ind",
      description: "Installations portuaires et stockage.",
      interiors: [
        "Entrepôts",
        "Hangars",
        "Garages"
      ],
      points: [
        [7430,4100],[7380,4780],[7700,5150],
        [7940,4890],[7870,4320]
      ]
    },

    zancudo: {
      name: "Fort Zancudo",
      type: "Zone exclue",
      category: "excluded",
      description: "Secteur non disponible à la vente.",
      interiors: [],
      points: [
        [3950,2150],[3780,2640],[4070,3120],
        [4470,3050],[4600,2500],[4350,2110]
      ]
    },

    airport: {
      name: "Aéroport de Los Santos",
      type: "Zone exclue",
      category: "excluded",
      description: "Secteur non disponible à la vente.",
      interiors: [],
      points: [
        [7250,2700],[7120,3190],[7480,3510],
        [7970,3290],[8050,2810],[7700,2520]
      ]
    },

    power: {
      name: "Centrale électrique",
      type: "Zone exclue",
      category: "excluded",
      description: "Secteur non disponible à la vente.",
      interiors: [],
      points: [
        [6380,5850],[6250,6120],[6490,6300],
        [6750,6120],[6700,5850]
      ]
    }

  };

  // =====================================
  // INITIALISATION CARTE GTA V
  // =====================================

  const CRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(
      1 / 32, 0, 1 / 32, 0
    )
  });

console.log("DYNASTY 8 — AVANT INITIALISATION");

const mapElement = document.getElementById("viewport");

console.log(
  "Dimensions viewport :",
  mapElement.getBoundingClientRect().width,
  mapElement.getBoundingClientRect().height
);

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

  const bounds = [[0,0],[8192,8192]];
  
console.log("DYNASTY 8 — CARTE INITIALISÉE");

map.setView([5350, 4500], 3);

console.log("Centre :", map.getCenter());
console.log("Zoom :", map.getZoom());


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

  // =====================================
  // PANNEAU CATALOGUE
  // =====================================

  const panel = document.getElementById("zonePanel");
  const polygons = {};

  let pinned = null;
  let currentFilter = "all";

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function render(id) {
    if (!panel || !zones[id]) return;

    const z = zones[id];

    panel.innerHTML = `
      <div class="d8-panel-top">
        <div>
          <div class="d8-kicker">
            DYNASTY 8 · ZONE IMMOBILIÈRE
          </div>
          <h2>${escapeHTML(z.name)}</h2>
          <div class="type">${escapeHTML(z.type)}</div>
        </div>
        <button class="d8-close" type="button"
          aria-label="Fermer">×</button>
      </div>

      <div class="d8-panel-photo">
        <span>Catalogue de la zone · Photos à ajouter</span>
      </div>

      <p>${escapeHTML(z.description)}</p>

      <h3>Catégories autorisées</h3>

      <div class="d8-categories">
        ${
          z.interiors.length
            ? z.interiors.map(item => `
              <div class="chip">
                <span class="d8-pin">⌂</span>
                ${escapeHTML(item)}
              </div>
            `).join("")
            : '<div class="chip">Aucun bien disponible</div>'
        }
      </div>

      <small class="d8-note">
        Contours provisoires à ajuster selon le plan validé.
      </small>
    `;

    panel.classList.add("is-open");
  }

  // =====================================
  // SURBRILLANCE DES ZONES
  // =====================================

  function highlight(id) {
    for (const [key, polygon] of Object.entries(polygons)) {
      const active = key === id;

      polygon.setStyle({
        weight: active ? 5 : 3,
        fillOpacity: active ? 0.24 : 0.09
      });
    }
  }

  function preview(id) {
    if (pinned !== null) return;
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

    if (panel) {
      panel.classList.remove("is-open");
    }

    highlight(null);
  }

  // =====================================
  // CREATION DES POLYGONES
  // =====================================

  for (const [id, z] of Object.entries(zones)) {
    const color = COLORS[z.category];

    const polygon = L.polygon(z.points, {
      color: color,
      weight: 3,
      opacity: 0.96,
      fillColor: color,
      fillOpacity: 0.09,
      interactive: true,
      className: "d8-neon-polygon",
      dashArray: z.category === "excluded" ? "7 6" : null
    }).addTo(map);

    polygons[id] = polygon;

    // Nom visible seulement au survol
    polygon.bindTooltip(
      `<span class="d8-zone-label">${escapeHTML(z.name)}</span>`,
      {
        permanent: false,
        sticky: true,
        direction: "top",
        opacity: 1,
        className: "d8-label-tooltip"
      }
    );

    polygon.on("mouseover", () => preview(id));

    polygon.on("mouseout", () => {
      if (pinned === null) {
        if (panel) {
          panel.classList.remove("is-open");
        }
        highlight(null);
      }
    });

    polygon.on("click", () => select(id));
  }

  // =====================================
  // FERMETURE DU CATALOGUE
  // =====================================

  if (panel) {
    panel.addEventListener("click", event => {
      if (event.target.closest(".d8-close")) {
        close();
      }
    });
  }

  // =====================================
  // FILTRES DES ZONES
  // =====================================

  const filters = document.getElementById("filters");

  const aliases = {
    lux: "lux",
    res: "res",
    rural: "rural",
    ind: "ind",
    biz: "ind",
    all: "all"
  };

  if (filters) {
    filters.addEventListener("click", event => {
      const button = event.target.closest("button[data-type]");
      if (!button) return;

      currentFilter = aliases[button.dataset.type] || "all";

      filters.querySelectorAll("button[data-type]")
        .forEach(b => {
          b.classList.toggle("on", b === button);
        });

      for (const [id, z] of Object.entries(zones)) {
        const visible =
          currentFilter === "all" ||
          z.category === currentFilter;

        const layer = polygons[id];

        if (visible && !map.hasLayer(layer)) {
          layer.addTo(map);
        }

        if (!visible && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }

        if (!visible && pinned === id) {
          close();
        }
      }
    });
  }

  // =====================================
  // CONTROLES DE LA CARTE
  // =====================================

  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");
  const reset = document.getElementById("reset");

  if (zoomIn) {
    zoomIn.onclick = () => map.zoomIn(0.5);
  }

  if (zoomOut) {
    zoomOut.onclick = () => map.zoomOut(0.5);
  }

  if (reset) {
    reset.onclick = () => map.fitBounds(bounds);
  }

  

  // =========================================
  // DYNASTY 8 — MODE DESSIN DES QUARTIERS
  // =========================================

  const drawing = {
    enabled: false,
    points: [],
    polygon: null,
    markers: [],
    color: "#bb65ff"
  };

  // Barre d'outils de dessin
  const drawTools = document.createElement("div");
  drawTools.id = "d8-draw-tools";

  drawTools.innerHTML = `
    <div class="d8-draw-title">✦ ÉDITION DES ZONES</div>
    <button id="d8-draw-toggle" type="button">
      ✏️ Activer le dessin
    </button>
    <button id="d8-draw-undo" type="button">
      ↶ Annuler un point
    </button>
    <button id="d8-draw-copy" type="button">
      📋 Copier les coordonnées
    </button>
    <button id="d8-draw-clear" type="button">
      ✕ Effacer le tracé
    </button>
    <div id="d8-draw-count">0 point</div>
  `;

  document.body.appendChild(drawTools);

  const drawToggle = document.getElementById("d8-draw-toggle");
  const drawCount = document.getElementById("d8-draw-count");

  function refreshDrawing() {
    if (drawing.polygon) {
      map.removeLayer(drawing.polygon);
      drawing.polygon = null;
    }

    drawing.markers.forEach(marker => {
      map.removeLayer(marker);
    });

    drawing.markers = [];

    if (drawing.points.length >= 2) {
      drawing.polygon = L.polygon(drawing.points, {
        color: drawing.color,
        weight: 4,
        fillColor: drawing.color,
        fillOpacity: 0.15,
        interactive: false
      }).addTo(map);
    }

    drawing.points.forEach(point => {
      const marker = L.circleMarker(point, {
        radius: 5,
        color: "#ffffff",
        fillColor: drawing.color,
        fillOpacity: 1,
        weight: 2,
        interactive: false
      }).addTo(map);

      drawing.markers.push(marker);
    });

    drawCount.textContent =
      drawing.points.length +
      (drawing.points.length > 1 ? " points" : " point");
  }

  drawToggle.addEventListener("click", () => {
    drawing.enabled = !drawing.enabled;

    drawToggle.textContent = drawing.enabled
      ? "✓ Terminer le dessin"
      : "✏️ Activer le dessin";

    map.getContainer().style.cursor =
      drawing.enabled ? "crosshair" : "";

    drawTools.classList.toggle("drawing-active", drawing.enabled);
  });

  map.on("click", event => {
    if (!drawing.enabled) return;

    // Coordonnées arrondies pour carte.js
    const lat = Math.round(event.latlng.lat);
    const lng = Math.round(event.latlng.lng);

    drawing.points.push([lat, lng]);
    refreshDrawing();
  });

  document.getElementById("d8-draw-undo")
    .addEventListener("click", () => {
      drawing.points.pop();
      refreshDrawing();
    });

  document.getElementById("d8-draw-clear")
    .addEventListener("click", () => {
      drawing.points = [];
      refreshDrawing();
    });

  document.getElementById("d8-draw-copy")
    .addEventListener("click", async () => {
      if (drawing.points.length < 3) {
        alert("Place au moins 3 points sur la carte.");
        return;
      }

      const coordinates =
        "points: " +
        JSON.stringify(drawing.points, null, 2);

      try {
        await navigator.clipboard.writeText(coordinates);
        alert("Coordonnées copiées !");
      } catch (error) {
        window.prompt(
          "Copie ces coordonnées avec Ctrl + C :",
          coordinates
        );
      }
    });

  map.whenReady(() => {
    map.setView([5350, 4500], 3);

    setTimeout(() => {
      map.invalidateSize();

      const element = document.getElementById("viewport");

      console.log("=== DIAGNOSTIC DYNASTY 8 ===");
      console.log("Largeur carte :", element.clientWidth);
      console.log("Hauteur carte :", element.clientHeight);
      console.log("Zoom :", map.getZoom());
      console.log("Centre :", map.getCenter());
      console.log(
        "Images satellites :",
        document.querySelectorAll(".leaflet-tile").length
      );
      console.log(
        "Images chargées :",
        document.querySelectorAll(".leaflet-tile-loaded").length
      );
    }, 1000);
  });

})();
