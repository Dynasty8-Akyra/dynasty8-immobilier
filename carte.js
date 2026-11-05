(()=>{
'use strict';
const root=document.querySelector('.map-page');if(!root)return;
if(typeof L==='undefined'){document.getElementById('viewport').textContent='Impossible de charger la carte : vérifiez votre connexion internet.';return;}
const zones={
 paleto:['Paleto Bay','Résidentiel','Petite ville côtière du nord de San Andreas.',['Maisons individuelles','Appartements','Commerces de proximité'],'res',[1450,4250]],
 grapeseed:['Grapeseed','Rural','Secteur agricole et rural de Blaine County.',['Fermes','Maisons rurales','Terrains agricoles'],'rural',[3000,5550]],
 blaine:['Blaine County','Rural','Grands espaces naturels et terrains isolés.',['Chalets','Maisons rurales','Terrains'],'rural',[3100,3400]],
 sandy:['Sandy Shores','Résidentiel','Secteur désertique avec habitations et activités locales.',['Maisons','Mobil-homes','Petits commerces'],'res',[3550,4450]],
 vinewood:['Vinewood Hills','Luxe','Résidences prestigieuses sur les hauteurs de Los Santos.',['Villas de luxe','Maisons avec piscine','Résidences privées'],'lux',[5350,4050]],
 downtown:['Downtown Los Santos','Commerces','Quartier central adapté aux activités professionnelles.',['Bureaux','Commerces','Locaux professionnels'],'biz',[6350,4650]],
 delperro:['Del Perro','Résidentiel','Quartier côtier proche de la plage.',['Appartements','Penthouses','Maisons'],'res',[5900,3250]],
 industrial:['Zone industrielle','Garages','Secteur adapté aux activités techniques et au stockage.',['Garages','Ateliers','Entrepôts'],'ind',[6800,5150]]
};
// Les positions ci-dessus sont des repères initiaux indicatifs en pixels sur la carte 8192x8192.
// Elles devront être ajustées après contrôle visuel. Elles ne sont pas des contours officiels.
try{const saved=JSON.parse(localStorage.getItem('dynasty8_zones_v11')||'null');if(saved)for(const [id,val] of Object.entries(saved))if(zones[id]&&Array.isArray(val)&&val.length===4)zones[id].splice(0,4,...val)}catch(e){}
const colors={lux:'#bb65ff',res:'#4daeff',biz:'#ff69b9',ind:'#efb54c',rural:'#56d78c'};
const CRS=L.extend({},L.CRS.Simple,{transformation:new L.Transformation(1/32,0,1/32,0)});
const map=L.map('viewport',{crs:CRS,minZoom:0,maxZoom:5,zoomControl:false,attributionControl:false,preferCanvas:true,zoomSnap:.25,zoomDelta:.5});
const bounds=[[0,0],[8192,8192]];
L.tileLayer('https://viruxe.github.io/gtav-map-tiles/satelite/{z}/{x}-{y}.webp',{minZoom:0,maxZoom:5,noWrap:true,bounds:bounds,tileSize:256,keepBuffer:3,errorTileUrl:''}).addTo(map);
map.fitBounds(bounds,{padding:[10,10]});
const panel=document.getElementById('zonePanel');let pinned=null,preview=null,currentFilter='all';
const markers={};
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(id){const z=zones[id];if(!z)return;Object.entries(markers).forEach(([k,m])=>{const el=m.getElement();if(el)el.querySelector('.d8-zone-marker')?.classList.toggle('active',k===id)});
panel.innerHTML=`<div class="d8-panel-top"><div><div class="d8-kicker">DYNASTY 8 · ZONE IMMOBILIÈRE</div><h2>${escapeHTML(z[0])}</h2><div class="type">${escapeHTML(z[1])}</div></div><button class="d8-close" type="button" aria-label="Fermer le catalogue">×</button></div><div class="d8-panel-photo"><span>Catalogue de la zone · Photos à ajouter</span></div><p>${escapeHTML(z[2])}</p><h3>Catégories autorisées</h3><div class="d8-categories">${z[3].map(s=>`<div class="chip"><span class="d8-pin">⌂</span>${escapeHTML(s)}</div>`).join('')}</div><small class="d8-note">Les annonces, photos et prix apparaîtront ici après connexion à la liste de biens. Les repères sur la carte sont provisoires et doivent être recalés sur les quartiers exacts.</small>`;
panel.classList.add('is-open');}
function close(){pinned=null;preview=null;panel.classList.remove('is-open');Object.values(markers).forEach(m=>m.getElement()?.querySelector('.d8-zone-marker')?.classList.remove('active'));}
for(const [id,z] of Object.entries(zones)){
 const icon=L.divIcon({className:'',html:`<div class="d8-zone-marker" style="--zone-color:${colors[z[4]]}"></div>`,iconSize:[22,22],iconAnchor:[11,11]});
 const marker=L.marker(z[5],{icon,keyboard:true,title:z[0]}).addTo(map);markers[id]=marker;
 marker.bindTooltip(`<span class="d8-zone-label">${escapeHTML(z[0])}</span>`,{permanent:true,direction:'top',offset:[0,-10],className:'d8-label-tooltip'});
 marker.on('mouseover',()=>{if(!pinned){preview=id;render(id)}});
 marker.on('mouseout',()=>{if(!pinned){preview=null;panel.classList.remove('is-open')}});
 marker.on('click',()=>{pinned=id;preview=null;render(id)});
}
panel.addEventListener('click',e=>{if(e.target.closest('.d8-close'))close()});
document.getElementById('filters').addEventListener('click',e=>{const btn=e.target.closest('button[data-type]');if(!btn)return;currentFilter=btn.dataset.type;document.querySelectorAll('.map-toolbar button').forEach(b=>b.classList.toggle('on',b===btn));for(const [id,m] of Object.entries(markers)){const visible=currentFilter==='all'||zones[id][4]===currentFilter;if(visible){if(!map.hasLayer(m))m.addTo(map)}else{if(map.hasLayer(m))map.removeLayer(m);if(pinned===id)close()}}});
document.getElementById('zoomIn').onclick=()=>map.zoomIn(.5);
document.getElementById('zoomOut').onclick=()=>map.zoomOut(.5);
document.getElementById('reset').onclick=()=>map.fitBounds(bounds,{padding:[10,10]});
// Centre la vue sur Los Santos pour montrer les quartiers dès l'ouverture.
map.whenReady(()=>{map.setView([5350,4500],3);});
})();

/* DYNASTY 8 — ZONES IMMOBILIÈRES NÉON */

(() => {
  // Récupère la carte Leaflet existante.
  // La carte doit être accessible via window.dynastyMap.
  const map = window.dynastyMap;

  if (!map || typeof L === "undefined") {
    console.warn("Carte Leaflet non accessible.");
    return;
  }

  const zones = [
    {
      name: "Paleto Bay",
      color: "#4daeff",
      points: [
        [-29, 39], [-26, 44], [-21, 45],
        [-18, 40], [-20, 34], [-26, 33]
      ]
    },
    {
      name: "Grapeseed",
      color: "#56d78c",
      points: [
        [-45, 67], [-42, 75], [-49, 80],
        [-55, 74], [-54, 67]
      ]
    },
    {
      name: "Blaine County",
      color: "#56d78c",
      points: [
        [-35, 32], [-29, 50], [-35, 65],
        [-46, 67], [-53, 54], [-47, 35]
      ]
    },
    {
      name: "Sandy Shores",
      color: "#4daeff",
      points: [
        [-52, 60], [-48, 70], [-52, 79],
        [-59, 77], [-62, 65]
      ]
    },
    {
      name: "Vinewood Hills",
      color: "#bb65ff",
      points: [
        [-67, 39], [-63, 53], [-67, 65],
        [-73, 62], [-76, 46]
      ]
    },
    {
      name: "Downtown Los Santos",
      color: "#ff69b9",
      points: [
        [-78, 56], [-74, 69], [-81, 77],
        [-89, 71], [-89, 60]
      ]
    },
    {
      name: "Del Perro",
      color: "#4daeff",
      points: [
        [-77, 32], [-73, 43], [-80, 49],
        [-88, 42], [-87, 33]
      ]
    },
    {
      name: "Zone industrielle",
      color: "#efb54c",
      points: [
        [-89, 69], [-85, 79], [-93, 85],
        [-99, 77], [-98, 66]
      ]
    }
  ];

  zones.forEach(zone => {
    const polygon = L.polygon(zone.points, {
      color: zone.color,
      weight: 3,
      opacity: 0.95,
      fillColor: zone.color,
      fillOpacity: 0.13,
      interactive: true
    }).addTo(map);

    polygon.bindTooltip(zone.name, {
      sticky: true,
      direction: "top"
    });

    polygon.on("mouseover", () => {
      polygon.setStyle({
        weight: 5,
        fillOpacity: 0.28
      });
    });

    polygon.on("mouseout", () => {
      polygon.setStyle({
        weight: 3,
        fillOpacity: 0.13
      });
    });
  });
})();
