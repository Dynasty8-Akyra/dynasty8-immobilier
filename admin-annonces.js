
/* ==========================================================
   DYNASTY 8 — GESTION DES PROPRIÉTÉS
   NEON MAX — PRESTIGE
   Accès : Direction uniquement
   ========================================================== */

const $ = id => document.getElementById(id);

let items = [];
let selected = null;
let currentPropertyStep = 1;
let previewGalleryIndex = 0;
let previewImageUrls = [];

/* ==========================================================
   OUTILS
   ========================================================== */

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function fieldValue(id) {
  return $(id)?.value?.trim() ?? '';
}

function optionalNumber(id) {
  const value = fieldValue(id);
  return value === '' ? null : Number(value);
}

function formatPropertyPrice(value) {
  if (value === '' || value == null) return null;

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return new Intl.NumberFormat('fr-FR').format(amount) + ' $';
}

function setStatus(message) {
  if ($('status')) $('status').textContent = message;
}

/* ==========================================================
   LISTE DES PROPRIÉTÉS
   ========================================================== */

function paint() {
  const entries = $('entries');
  if (!entries) return;

  entries.innerHTML = items.map(property => `
    <button
      type="button"
      class="entry ${property.id === selected ? 'active' : ''}"
      data-id="${escapeHtml(property.id)}"
    >
      ${escapeHtml(property.name)}
      <br>
      <small>${escapeHtml(property.area)}</small>
    </button>
  `).join('') || '<p>Aucune annonce.</p>';
}

function setField(id, value) {
  const element = $(id);
  if (!element || element.type === 'file') return;

  element.value = value ?? '';
}

function choose(id) {
  selected = id;

  const property = items.find(item => item.id === id);

  [
    'id',
    'name',
    'type',
    'area',
    'surface',
    'description'
  ].forEach(key => setField(key, property?.[key]));

  setField('price', property?.price);
  setField('purchasePrice', property?.purchase_price);
  setField('rentalPrice', property?.rental_price);
  setField('storageKg', property?.storage_kg);
  setField('rooms', property?.rooms);

  setField(
    'exterior',
    property ? String(property.exterior === true) : 'false'
  );

  setField(
    'garage',
    property ? String(property.garage === true) : 'false'
  );

  if ($('thumbnail')) $('thumbnail').value = '';
  if ($('gallery')) $('gallery').value = '';

  clearPreviewImages();
  previewGalleryIndex = 0;

  paint();
  setStatus('');
  showPropertyStep(1);
}

async function load() {
  items = await D8Cloud.list();
  choose(items[0]?.id || null);
}

/* ==========================================================
   CONTRÔLE D'ACCÈS — DIRECTION
   ========================================================== */

async function gate() {
  try {
    if (!await D8Cloud.authenticated()) {
      location.replace('agent-login.html');
      return;
    }

    if (!await D8Cloud.isDirection()) {
      location.replace('agent-dashboard.html');
      return;
    }

    await load();

    const requested =
      new URLSearchParams(location.search).get('edit');

    if (requested && items.some(item => item.id === requested)) {
      choose(requested);
    }

    $('authGate').style.display = 'none';
    $('agentEditor').style.display = 'block';

  } catch (error) {
    $('authGate').textContent =
      'Connexion impossible : ' + error.message;
  }
}

/* ==========================================================
   NAVIGATION — FORMULAIRE EN 3 ÉTAPES
   ========================================================== */

const propertyPages = [
  $('step1'),
  $('step2'),
  $('step3')
];

const propertyStepIndicators =
  document.querySelectorAll('.property-step');

const previousStepButton = $('previousStep');
const nextStepButton = $('nextStep');
const publishPropertyButton = $('publishProperty');

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

  if (previousStepButton) {
    previousStepButton.hidden = currentPropertyStep === 1;
  }

  if (nextStepButton) {
    nextStepButton.hidden = currentPropertyStep === 3;
  }

  if (publishPropertyButton) {
    publishPropertyButton.hidden = currentPropertyStep !== 3;
  }
}

function validateFirstStep() {
  const name = $('name');
  const area = $('area');

  if (!name.reportValidity() || !area.reportValidity()) {
    return false;
  }

  const purchase = fieldValue('purchasePrice');
  const rental = fieldValue('rentalPrice');

  if (purchase === '' && rental === '') {
    setStatus(
      "Renseignez au moins un prix : achat ou location."
    );
    return false;
  }

  const values = [
    optionalNumber('purchasePrice'),
    optionalNumber('rentalPrice'),
    optionalNumber('surface')
  ];

  if (values.some(value =>
    value !== null &&
    (!Number.isFinite(value) || value < 0)
  )) {
    setStatus('Vérifiez les prix et la superficie.');
    return false;
  }

  return true;
}

nextStepButton?.addEventListener('click', () => {
  if (currentPropertyStep === 1 && !validateFirstStep()) {
    return;
  }

  setStatus('');
  showPropertyStep(currentPropertyStep + 1);

  if (currentPropertyStep === 3) {
    previewGalleryIndex = 0;
    renderPropertyPreview();
  }
});

previousStepButton?.addEventListener('click', () => {
  showPropertyStep(currentPropertyStep - 1);
});

/* ==========================================================
   PRÉPARATION DES DONNÉES SUPABASE
   ========================================================== */

function buildPropertyData() {
  const purchasePrice = optionalNumber('purchasePrice');
  const rentalPrice = optionalNumber('rentalPrice');

  const existingProperty =
    items.find(item => item.id === selected);

  return {
    id: fieldValue('id') || 'bien-' + Date.now(),
    name: fieldValue('name'),
    type: fieldValue('type'),
    area: fieldValue('area'),

    purchase_price: purchasePrice,
    rental_price: rentalPrice,

    // Compatibilité avec l'ancienne structure.
    price: purchasePrice ?? rentalPrice,
    surface: optionalNumber('surface') ?? 0,

    storage_kg: optionalNumber('storageKg'),
    rooms: optionalNumber('rooms'),

    exterior: fieldValue('exterior') === 'true',
    garage: fieldValue('garage') === 'true',

    description: fieldValue('description'),

    photo: existingProperty?.photo ||
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000',

    thumbnail_url: existingProperty?.thumbnail_url || null,
    gallery_urls: existingProperty?.gallery_urls || []
  };
}

/* ==========================================================
   PUBLICATION — EN ATTENTE DE L'API ET DU STORAGE
   ========================================================== */

$('form').onsubmit = event => {
  event.preventDefault();

  if (!validateFirstStep()) {
    showPropertyStep(1);
    return;
  }

  const property = buildPropertyData();

  const values = [
    property.storage_kg,
    property.rooms
  ];

  if (values.some(value =>
    value !== null &&
    (!Number.isInteger(value) || value < 0)
  )) {
    setStatus('Vérifiez les caractéristiques.');
    showPropertyStep(2);
    return;
  }

  console.log(
    'DYNASTY 8 — Propriété préparée :',
    property
  );

  setStatus(
    'Informations préparées. Publication bientôt disponible.'
  );
};

// Publication désactivée jusqu'à la connexion sécurisée.
if (publishPropertyButton) {
  publishPropertyButton.disabled = true;
}

/* ==========================================================
   PRÉVISUALISATION — GESTION DES IMAGES
   ========================================================== */

function clearPreviewImages() {
  previewImageUrls.forEach(url => URL.revokeObjectURL(url));
  previewImageUrls = [];
}

function createPreviewUrl(file) {
  const url = URL.createObjectURL(file);
  previewImageUrls.push(url);
  return url;
}

/* ==========================================================
   PRÉVISUALISATION IMMOBILIÈRE
   ========================================================== */

function renderPropertyPreview() {
  const preview = $('propertyPreview');
  if (!preview) return;

  clearPreviewImages();

  const name = fieldValue('name') || 'Propriété sans nom';
  const type = fieldValue('type');

  const areaElement = $('area');
  const areaName =
    areaElement?.selectedOptions?.[0]?.textContent || 'Quartier';

  const purchase =
    formatPropertyPrice(fieldValue('purchasePrice'));

  const rental =
    formatPropertyPrice(fieldValue('rentalPrice'));

  const thumbnail = $('thumbnail')?.files?.[0];

  const gallery = Array.from(
    $('gallery')?.files || []
  );

  const images = gallery.map(createPreviewUrl);

  const thumbnailUrl = thumbnail
    ? createPreviewUrl(thumbnail)
    : null;

  /* FICHE REPLIÉE */

  const collapsedPreviewHtml = `
    <div class="preview-collapsed-section">
      <span class="preview-eyebrow">
        APERÇU · FICHE REPLIÉE
      </span>

      <div class="preview-collapsed-card">
        <div class="preview-thumbnail">
          ${thumbnailUrl
            ? `<img src="${thumbnailUrl}" alt="Miniature de la propriété">`
            : '<span>Aucune miniature</span>'}
        </div>

        <div class="preview-collapsed-info">
          <strong>${escapeHtml(name)}</strong>
          <small>
            ${escapeHtml(type)} · ${escapeHtml(areaName)}
          </small>
        </div>

        <span
          class="preview-collapsed-chevron"
          aria-hidden="true"
        >⌄</span>
      </div>
    </div>
  `;

  /* GALERIE — FICHE DÉPLIÉE */

  const imageHtml = images.length
    ? `
      <div class="preview-gallery">
        <img
          id="previewGalleryImage"
          src="${images[0]}"
          alt="Photo 1 de la propriété"
        >

        <div class="preview-gallery-controls">
          <button
            type="button"
            id="previewGalleryPrevious"
            aria-label="Photo précédente"
          >‹</button>

          <span id="previewGalleryCounter">
            1 / ${images.length}
          </span>

          <button
            type="button"
            id="previewGalleryNext"
            aria-label="Photo suivante"
          >›</button>
        </div>
      </div>
    `
    : `
      <div class="preview-no-image">
        Aucune photo de galerie sélectionnée
      </div>
    `;

  const priceHtml = [
    purchase && `
      <div>
        <small>PRIX D'ACHAT</small>
        <strong>${purchase}</strong>
      </div>
    `,
    rental && `
      <div>
        <small>PRIX DE LOCATION</small>
        <strong>${rental}</strong>
      </div>
    `
  ].filter(Boolean).join('');

  preview.innerHTML = `
    ${collapsedPreviewHtml}

    <article class="d8-property-preview">
      <div class="preview-image">
        ${imageHtml}
      </div>

      <div class="preview-content">
        <span class="preview-eyebrow">
          DYNASTY 8 · PROPRIÉTÉ
        </span>

        <h3>${escapeHtml(name)}</h3>

        <p class="preview-location">
          ${escapeHtml(areaName)} · ${escapeHtml(type)}
        </p>

        <div class="preview-features">
          <span>
            KG COFFRE :
            ${escapeHtml(fieldValue('storageKg') || '—')}
          </span>

          <span>
            PIÈCES :
            ${escapeHtml(fieldValue('rooms') || '—')}
          </span>

          <span>
            EXTÉRIEUR :
            ${fieldValue('exterior') === 'true' ? 'Oui' : 'Non'}
          </span>

          <span>
            GARAGE :
            ${fieldValue('garage') === 'true' ? 'Oui' : 'Non'}
          </span>
        </div>

        <p class="preview-description">
          ${escapeHtml(
            fieldValue('description') ||
            'Aucune description renseignée.'
          )}
        </p>

        <div class="preview-prices">
          ${priceHtml}
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================
   CARROUSEL — PHOTOS DE GALERIE
   ========================================================== */

$('propertyPreview')?.addEventListener('click', event => {
  const previous =
    event.target.closest('#previewGalleryPrevious');

  const next =
    event.target.closest('#previewGalleryNext');

  if (!previous && !next) return;

  const files = Array.from($('gallery')?.files || []);
  if (!files.length) return;

  previewGalleryIndex = (
    previewGalleryIndex +
    (next ? 1 : -1) +
    files.length
  ) % files.length;

  const image = $('previewGalleryImage');
  const counter = $('previewGalleryCounter');

  if (!image || !counter) return;

  image.src = previewImageUrls[previewGalleryIndex];
  image.alt =
    `Photo ${previewGalleryIndex + 1} de la propriété`;

  counter.textContent =
    `${previewGalleryIndex + 1} / ${files.length}`;
});

/* ==========================================================
   ACTIONS — LISTE ET OUTILS
   ========================================================== */

$('entries').onclick = event => {
  const button = event.target.closest('[data-id]');
  if (button) choose(button.dataset.id);
};

$('new').onclick = () => choose(null);

$('delete').onclick = async () => {
  if (!selected) return;

  if (!confirm('Supprimer cette annonce ?')) return;

  try {
    await D8Cloud.remove(selected);
    await load();
    setStatus('Annonce supprimée.');
  } catch (error) {
    setStatus(error.message);
  }
};

$('export').onclick = () => {
  const blob = new Blob(
    [JSON.stringify(items, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'dynasty8-annonces.json';
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

$('import').disabled = true;
$('import').title =
  'Import non disponible en mode cloud.';

$('logoutAgent').onclick = async () => {
  await D8Cloud.logout();
  location.href = 'agent-login.html';
};

/* ==========================================================
   INITIALISATION
   ========================================================== */

showPropertyStep(1);
gate();
