const $=id=>document.getElementById(id);let properties=[];const currency=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n)+' $';const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));function render(){const q=$('search').value.toLocaleLowerCase('fr').trim();const filtered=properties.filter(p=>[p.name,p.area,p.type].some(v=>String(v||'').toLocaleLowerCase('fr').includes(q)));$('rows').innerHTML=filtered.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.type)}</td><td>${esc(p.area)}</td><td>${currency(Number(p.price)||0)}</td>${window.canWriteDashboard?`<td><a href="admin-annonces.html?edit=${encodeURIComponent(p.id)}">MODIFIER ↗</a></td>`:''}</tr>`).join('');$('empty').hidden=filtered.length>0}async function init(){try{if(!D8Cloud.ready()||!await D8Cloud.authenticated()){location.replace('agent-login.html');return}const access=await D8Cloud.role();if(!access.canViewDashboard){location.replace('index.html');return;}window.canWriteDashboard=access.canWrite===true;
/* DYNASTY 8 — NAVIGATION CARTES */

const mapNavigation = document.createElement("nav");
mapNavigation.className = "d8-dashboard-maps";
mapNavigation.setAttribute(
  "aria-label",
  "Navigation des cartes immobilières"
);

const publicMap = document.createElement("a");
publicMap.href = "carte.html";
publicMap.className = "d8-map-access";
publicMap.textContent = "⌖ CARTE IMMOBILIÈRE";
mapNavigation.appendChild(publicMap);

// La Direction seule voit l'éditeur sécurisé.
if (access.canEditZones === true) {
  const directionMap = document.createElement("a");
  directionMap.href = "admin-carte.html";
  directionMap.className =
    "d8-map-access d8-map-direction";
  directionMap.textContent = "♛ ÉDITEUR DIRECTION";
  mapNavigation.appendChild(directionMap);
}

// Ajouter les liens au tableau de bord.
const dashboard = document.getElementById("dashboard");

if (dashboard) {
  dashboard.prepend(mapNavigation);
}
if(!window.canWriteDashboard){document.querySelector('.primary').style.display='none';document.querySelector('.bottom a:first-child').style.display='none';}properties=await D8Cloud.list();if(!window.canWriteDashboard){document.querySelectorAll('thead th:last-child').forEach(e=>e.remove());}const sum=properties.reduce((a,p)=>a+(Number(p.price)||0),0);$('total').textContent=properties.length;$('value').textContent=currency(sum);$('average').textContent=currency(properties.length?sum/properties.length:0);$('types').textContent=new Set(properties.map(p=>p.type)).size;$('gate').hidden=true;$('dashboard').hidden=false;render()}catch(err){$('gate').textContent='Impossible de charger le tableau de bord : '+err.message}}$('search').addEventListener('input',render);$('logout').onclick=async()=>{await D8Cloud.logout();location.replace('agent-login.html')};init();

/* ==========================================
   DYNASTY 8 — ACCÈS CARTES RED NEON
   ========================================== */

.d8-dashboard-maps {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 0 0 28px;
}

.d8-map-access {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 48px;
  padding: 13px 22px;

  color: #fff1f3;
  background: linear-gradient(
    135deg, #380d1a, #17070e
  );

  border: 1px solid #a82b43;
  border-radius: 12px;

  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;

  box-shadow: 0 0 15px rgba(229,28,61,.16);
  transition: .25s ease;
}

.d8-map-access:hover {
  color: #fff;
  border-color: #ff647d;
  background: #651126;

  box-shadow:
    0 0 18px rgba(229,28,61,.4),
    inset 0 0 12px rgba(229,28,61,.12);

  transform: translateY(-2px);
}

.d8-map-direction {
  border-color: #e51c3d;
  background: linear-gradient(
    135deg, #601025, #220710
  );
}

@media (max-width: 600px) {
  .d8-dashboard-maps {
    flex-direction: column;
  }

  .d8-map-access {
    width: 100%;
    box-sizing: border-box;
  }
}
