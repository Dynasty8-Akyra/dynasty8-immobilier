const $=id=>document.getElementById(id);let items=[],selected=null;
function paint(){$('entries').innerHTML=items.map(p=>`<button class="entry ${p.id===selected?'active':''}" data-id="${safe(p.id)}">${safe(p.name)}<br><small>${safe(p.area)}</small></button>`).join('')||'<p>Aucune annonce.</p>'}
function choose(id){selected=id;let p=items.find(x=>x.id===id);for(let k of ['id','name','type','area','price','surface','description'])$(k).value=p?.[k]??'';paint();$('status').textContent=''}
async function load(){items=await D8Cloud.list();choose(items[0]?.id||null)}
async function gate(){try{if(!await D8Cloud.authenticated()){location.replace('agent-login.html');return}if(!await D8Cloud.isAgent()){location.replace('agent-dashboard.html');return}await load();const requested=new URLSearchParams(location.search).get('edit');if(requested&&items.some(p=>p.id===requested))choose(requested);$('authGate').style.display='none';$('agentEditor').style.display='block'}catch(e){$('authGate').textContent='Connexion impossible : '+e.message}}
$('entries').onclick=e=>{let b=e.target.closest('[data-id]');if(b)choose(b.dataset.id)};
$('new').onclick=()=>choose(null);
$('form').onsubmit=async e=>{e.preventDefault();let p={id:$('id').value||('bien-'+Date.now()),name:$('name').value.trim(),type:$('type').value,area:$('area').value.trim(),price:Number($('price').value),surface:Number($('surface').value),photo:items.find(x=>x.id===selected)?.photo||'',description:$('description').value.trim()};if(!p.name||!p.area||!Number.isFinite(p.price)||!Number.isFinite(p.surface)||p.price<0||p.surface<0){$('status').textContent='Vérifie les champs.';return}if(p.photo&&!/^https:\/\//i.test(p.photo)){$('status').textContent='Utilise une photo HTTPS.';return}if(!p.photo)p.photo='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000';try{await D8Cloud.upsert(p);await load();choose(p.id);$('status').textContent='Annonce publiée en ligne.'}catch(err){$('status').textContent=err.message}};
$('delete').onclick=async()=>{if(!selected||!confirm('Supprimer cette annonce ?'))return;try{await D8Cloud.remove(selected);await load();$('status').textContent='Annonce supprimée.'}catch(e){$('status').textContent=e.message}};
$('export').onclick=()=>{let blob=new Blob([JSON.stringify(items,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dynasty8-annonces.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('import').disabled=true;$('import').title='Import non disponible en mode cloud.';
$('logoutAgent').onclick=async()=>{await D8Cloud.logout();location.href='agent-login.html'};gate();

/* DYNASTY 8 — NAVIGATION DU FORMULAIRE */

let currentPropertyStep = 1;

const propertyPages = [
  document.getElementById('step1'),
  document.getElementById('step2'),
  document.getElementById('step3')
];

const propertyStepIndicators =
  document.querySelectorAll('.property-step');

const previousStepButton =
  document.getElementById('previousStep');

const nextStepButton =
  document.getElementById('nextStep');

const publishPropertyButton =
  document.getElementById('publishProperty');

function showPropertyStep(step) {
  currentPropertyStep = Math.max(1, Math.min(3, step));

  propertyPages.forEach((page, index) => {
    if (page) {
      page.hidden = index + 1 !== currentPropertyStep;
    }
  });

  propertyStepIndicators.forEach((indicator, index) => {
    indicator.classList.toggle(
      'active',
      index + 1 === currentPropertyStep
    );
  });

  previousStepButton.hidden = currentPropertyStep === 1;
  nextStepButton.hidden = currentPropertyStep === 3;

  publishPropertyButton.hidden = currentPropertyStep !== 3;
}

nextStepButton.addEventListener('click', () => {
  if (currentPropertyStep === 1) {
    const name = document.getElementById('name');
    const area = document.getElementById('area');
    const purchase = document.getElementById('purchasePrice').value;
    const rental = document.getElementById('rentalPrice').value;

    if (!name.reportValidity() || !area.reportValidity()) {
      return;
    }

    if (purchase.trim() === '' && rental.trim() === '') {
      document.getElementById('status').textContent =
        "Renseignez au moins un prix : achat ou location.";
      return;
    }
  }

  document.getElementById('status').textContent = '';
  showPropertyStep(currentPropertyStep + 1);
});

previousStepButton.addEventListener('click', () => {
  showPropertyStep(currentPropertyStep - 1);
});

showPropertyStep(1);

/* Publication désactivée jusqu'à la connexion
   du nouveau formulaire à Supabase. */
publishPropertyButton.disabled = true;

