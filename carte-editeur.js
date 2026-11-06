
(function () {
  "use strict";

  // L'éditeur ne fonctionne que sur la page admin.
  if (document.body.dataset.mapMode !== "admin") return;

  window.D8InitZoneEditor = function (map) {
    if (!map || !window.L) {
      console.error("Carte Leaflet indisponible.");
      return;
    }

    if (document.getElementById("d8-draw-tools")) return;

    const drawing = {
      enabled: false,
      points: [],
      polygon: null,
      markers: [],
      color: "#bb65ff"
    };

    const drawTools = document.createElement("div");
    drawTools.id = "d8-draw-tools";

    drawTools.innerHTML = `
      <div class="d8-draw-title">✦ ÉDITION DES ZONES</div>
      <button id="d8-draw-toggle" type="button">✏️ Activer le dessin</button>
      <button id="d8-draw-undo" type="button">↶ Annuler un point</button>
      <button id="d8-draw-copy" type="button">📋 Copier les coordonnées</button>
      <button id="d8-draw-clear" type="button">✕ Effacer le tracé</button>
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

      drawing.markers.forEach(marker => map.removeLayer(marker));
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
          "points: " + JSON.stringify(drawing.points, null, 2);

        try {
          await navigator.clipboard.writeText(coordinates);
          alert("Coordonnées copiées !");
        } catch {
          window.prompt(
            "Copie ces coordonnées avec Ctrl + C :",
            coordinates
          );
        }
      });
  };
})();
