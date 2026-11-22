
/* ==========================================================
   DYNASTY 8 — GESTION DES PROPRIÉTÉS
   NEON MAX — PRESTIGE
   Galerie modifiable et prévisualisation
   ========================================================== */

const $ = id => document.getElementById(id);

let items = [];
let selected = null;
let currentPropertyStep = 1;
let previewGalleryIndex = 0;
let previewImages = [];
let galleryPhotos = [];
let thumbnailPhoto = null;
let previewThumbnailUrl = null;

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

function setField(id, value) {
  const element = $(id);
  if (!element || element.type === 'file') return;
  element.value = value ?? '';
}

function validateImage(file) {
  const types = ['image/jpeg', 'image/png', 'image/webp'];

  if (!types.includes(file.type)) {
    throw new Error('Formats acceptés : JPG, PNG et WEBP.');
  }

  if (!file.size || file.size > 5 * 1024 * 1024) {
    throw new Error('Chaque image doit faire moins de 5 Mo.');
  }
}

function releasePhoto(photo) {
  if (photo?.file && photo.url) {
    URL.revokeObjectURL(photo.url);
  }
}

function clearPhotoState() {
  galleryPhotos.forEach(releasePhoto);
  galleryPhotos = [];

  releasePhoto(thumbnailPhoto);
  thumbnailPhoto = null;

  previewImages = [];
  previewThumbnailUrl = null;
  previewGalleryIndex = 0;
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

function choose(id) {
  selected = id;
  const property = items.find(item => item.id === id);

  [
    'id', 'name', 'type', 'area',
    'surface', 'description'
  ].forEach(key => setField(key, property?.[key]));

  setField('price', property?.price);
  setField('purchasePrice', property?.purchase_price);
  setField('rentalPrice', property?.rental_price);
  setField('storageKg', property?.storage_kg);
  setField('rooms', property?.rooms);
  setField('exterior', String(property?.exterior === true));
  setField('garage', String(property?.garage === true));

  if ($('thumbnail')) $('thumbnail').value = '';
  if ($('gallery')) $('gallery').value = '';

  clearPhotoState();

  if (property) {
    const existingGallery = Array.isArray(property.gallery_urls)
      ? property.gallery_urls
      : [];

    galleryPhotos = existingGallery
      .filter(url => typeof url === 'string' && url)
      .map(url => ({
        url,
        file: null,
        key: crypto.randomUUID()
      }));

    const existingThumbnail =
      property.thumbnail_url || property.photo || null;

    if (existingThumbnail) {
      thumbnailPhoto = {
        url: existingThumbnail,
        file: null
      };
    }
  }

  paint();
  renderGalleryManager();
  renderThumbnailManager();
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
   FORMULAIRE EN TROIS ÉTAPES
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
    if (page) page.hidden = index + 1 !== currentPropertyStep;
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
  const surface = $('surface');

  if (
    !name.reportValidity() ||
    !area.reportValidity() ||
    !surface.reportValidity()
  ) return false;

  const purchase = fieldValue('purchasePrice');
  const rental = fieldValue('rentalPrice');

  if (purchase === '' && rental === '') {
    setStatus('Renseignez au moins un prix : achat ou location.');
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
   MINIATURE INDÉPENDANTE
   ========================================================== */

function renderThumbnailManager() {
  let container = $('propertyThumbnailManager');

  if (!container) {
    container = document.createElement('div');
    container.id = 'propertyThumbnailManager';
    container.className = 'property-photo-manager';

    $('thumbnail')?.closest('label')?.after(container);
  }

  if (!container) return;

  container.innerHTML = `
    <h4>Miniature actuelle</h4>
    ${
      thumbnailPhoto
        ? `
          <div class="property-photo-grid">
            <div class="property-photo-card">
              <img
                src="${escapeHtml(thumbnailPhoto.url)}"
                alt="Miniature actuelle"
              >
              <div class="property-photo-actions">
                <button
                  type="button"
                  data-thumbnail-remove
                  aria-label="Retirer la miniature"
                >
                  Retirer
                </button>
              </div>
            </div>
          </div>
        `
        : `
          <div class="property-photo-empty">
            Aucune miniature sélectionnée.
          </div>
        `
    }
  `;
}

$('thumbnail')?.addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    validateImage(file);

    releasePhoto(thumbnailPhoto);

    thumbnailPhoto = {
      url: URL.createObjectURL(file),
      file
    };

    renderThumbnailManager();
    setStatus('');

  } catch (error) {
    event.target.value = '';
    setStatus(error.message);
  }
});

document.addEventListener('click', event => {
  if (!event.target.closest('[data-thumbnail-remove]')) return;

  releasePhoto(thumbnailPhoto);
  thumbnailPhoto = null;

  if ($('thumbnail')) $('thumbnail').value = '';

  renderThumbnailManager();
});

/* ==========================================================
   GALERIE MODIFIABLE
   ========================================================== */

function renderGalleryManager() {
  const container = $('propertyGalleryManager');
  if (!container) return;

  if (!galleryPhotos.length) {
    container.innerHTML = `
      <div class="property-photo-empty">
        Aucune photo dans la galerie.
      </div>
    `;
    return;
  }

  container.innerHTML = galleryPhotos.map((photo, index) => `
    <div class="property-photo-card">
      <img
        src="${escapeHtml(photo.url)}"
        alt="Photo ${index + 1} de la galerie"
      >

      <div class="property-photo-actions">
        <button
          type="button"
          data-photo-action="left"
          data-photo-key="${escapeHtml(photo.key)}"
          ${index === 0 ? 'disabled' : ''}
          aria-label="Déplacer vers la gauche"
        >←</button>

        <button
          type="button"
          data-photo-action="right"
          data-photo-key="${escapeHtml(photo.key)}"
          ${index === galleryPhotos.length - 1 ? 'disabled' : ''}
          aria-label="Déplacer vers la droite"
        >→</button>

        <button
          type="button"
          data-photo-action="remove"
          data-photo-key="${escapeHtml(photo.key)}"
          aria-label="Retirer cette photo"
        >✕</button>
      </div>
    </div>
  `).join('');
}

$('gallery')?.addEventListener('change', event => {
  const files = Array.from(event.target.files || []);

  if (!files.length) return;

  try {
    if (galleryPhotos.length + files.length > 30) {
      throw new Error('La galerie est limitée à 30 photos.');
    }

    files.forEach(validateImage);

    files.forEach(file => {
      galleryPhotos.push({
        url: URL.createObjectURL(file),
        file,
        key: crypto.randomUUID()
      });
    });

    renderGalleryManager();
    setStatus('');

  } catch (error) {
    setStatus(error.message);
  }

  // Permet de sélectionner à nouveau les mêmes fichiers.
  event.target.value = '';
});

$('propertyGalleryManager')?.addEventListener('click', event => {
  const button = event.target.closest('[data-photo-action]');
  if (!button) return;

  const index = galleryPhotos.findIndex(
    photo => photo.key === button.dataset.photoKey
  );

  if (index < 0) return;

  const action = button.dataset.photoAction;

  if (action === 'remove') {
    const removed = galleryPhotos.splice(index, 1)[0];
    releasePhoto(removed);
  }

  if (action === 'left' && index > 0) {
    [
      galleryPhotos[index - 1],
      galleryPhotos[index]
    ] = [
      galleryPhotos[index],
      galleryPhotos[index - 1]
    ];
  }

  if (action === 'right' && index < galleryPhotos.length - 1) {
    [
      galleryPhotos[index],
      galleryPhotos[index + 1]
    ] = [
      galleryPhotos[index + 1],
      galleryPhotos[index]
    ];
  }

  renderGalleryManager();
  setStatus('');
});

/* ==========================================================
   DONNÉES DE LA PROPRIÉTÉ
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
    price: purchasePrice ?? rentalPrice,
    surface: optionalNumber('surface') ?? 0,

    storage_kg: optionalNumber('storageKg'),
    rooms: optionalNumber('rooms'),
    exterior: fieldValue('exterior') === 'true',
    garage: fieldValue('garage') === 'true',
    description: fieldValue('description'),

    photo: existingProperty?.photo ||
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000',

    thumbnail_url:
      thumbnailPhoto && !thumbnailPhoto.file
        ? thumbnailPhoto.url
        : null,

    gallery_urls: galleryPhotos
      .filter(photo => !photo.file)
      .map(photo => photo.url)
  };
}

/* ==========================================================
   PRÉVISUALISATION
   ========================================================== */

function renderPropertyPreview() {
  const preview = $('propertyPreview');
  if (!preview) return;

  const name = fieldValue('name') || 'Propriété sans nom';
  const type = fieldValue('type');

  const areaName =
    $('area')?.selectedOptions?.[0]?.textContent || 'Quartier';

  const purchase =
    formatPropertyPrice(fieldValue('purchasePrice'));

  const rental =
    formatPropertyPrice(fieldValue('rentalPrice'));

  previewImages = galleryPhotos.map(photo => photo.url);
  previewThumbnailUrl = thumbnailPhoto?.url || null;
  previewGalleryIndex = 0;

  const collapsedPreviewHtml = `
    <div class="preview-collapsed-section">
      <span class="preview-eyebrow">
        APERÇU · FICHE REPLIÉE
      </span>

      <div class="preview-collapsed-card">
        <div class="preview-thumbnail">
          ${
            previewThumbnailUrl
              ? `<img
                   src="${escapeHtml(previewThumbnailUrl)}"
                   alt="Miniature de la propriété"
                 >`
              : '<span>Aucune miniature</span>'
          }
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

  const imageHtml = previewImages.length
    ? `
      <div class="preview-gallery">
        <img
          id="previewGalleryImage"
          src="${escapeHtml(previewImages[0])}"
          alt="Photo 1 de la propriété"
        >

        <div class="preview-gallery-controls">
          <button
            type="button"
            id="previewGalleryPrevious"
            aria-label="Photo précédente"
          >‹</button>

          <span id="previewGalleryCounter">
            1 / ${previewImages.length}
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
        Aucune photo dans la galerie
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
   CARROUSEL
   ========================================================== */

$('propertyPreview')?.addEventListener('click', event => {
  const previous =
    event.target.closest('#previewGalleryPrevious');

  const next =
    event.target.closest('#previewGalleryNext');

  if (!previous && !next) return;
  if (!previewImages.length) return;

  previewGalleryIndex = (
    previewGalleryIndex +
    (next ? 1 : -1) +
    previewImages.length
  ) % previewImages.length;

  const image = $('previewGalleryImage');
  const counter = $('previewGalleryCounter');

  if (!image || !counter) return;

  image.src = previewImages[previewGalleryIndex];
  image.alt =
    `Photo ${previewGalleryIndex + 1} de la propriété`;

  counter.textContent =
    `${previewGalleryIndex + 1} / ${previewImages.length}`;
});


/* ==========================================================
   DYNASTY 8 — PUBLICATION SÉCURISÉE
   SUPABASE STORAGE + BASE DE DONNÉES
   ========================================================== */

let propertySaving = false;

async function uploadPropertyImage(file) {
  validateImage(file);

  const token = await D8Cloud.accessToken();

  if (!token) {
    throw new Error(
      'Votre session a expiré. Reconnectez-vous.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/property-images', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token
    },
    body: formData
  });

  const result = await response.json();

  if (!response.ok || !result.ok || !result.url) {
    throw new Error(
      result.error || "Impossible d'envoyer cette image."
    );
  }

  return result.url;
}

function validatePropertyCharacteristics(property) {
  const values = [
    property.storage_kg,
    property.rooms
  ];

  return !values.some(value =>
    value !== null &&
    (!Number.isInteger(value) || value < 0)
  );
}

$('form').setAttribute('novalidate', '');

$('form').onsubmit = async event => {
  event.preventDefault();

  if (propertySaving) return;

  if (!validateFirstStep()) {
    showPropertyStep(1);
    return;
  }

  const property = buildPropertyData();

  if (!validatePropertyCharacteristics(property)) {
    showPropertyStep(2);
    setStatus('Vérifiez les caractéristiques du bien.');
    return;
  }

  if (galleryPhotos.length > 30) {
    showPropertyStep(2);
    setStatus('La galerie est limitée à 30 photos.');
    return;
  }

  if (!confirm(
    'Confirmer la publication des modifications de cette propriété ?'
  )) {
    return;
  }

  propertySaving = true;
  publishPropertyButton.disabled = true;
  nextStepButton.disabled = true;
  previousStepButton.disabled = true;

  try {
    /* 1 — ENVOI DE LA MINIATURE */

    let thumbnailUrl = property.thumbnail_url;

    if (thumbnailPhoto?.file) {
      setStatus('Envoi de la miniature...');

      thumbnailUrl = await uploadPropertyImage(
        thumbnailPhoto.file
      );
    }

    /* 2 — ENVOI DES PHOTOS DE GALERIE */

    const finalGalleryUrls = [];

    for (let index = 0; index < galleryPhotos.length; index++) {
      const photo = galleryPhotos[index];

      if (photo.file) {
        setStatus(
          `Envoi des photos : ${index + 1} / ${galleryPhotos.length}`
        );

        const uploadedUrl = await uploadPropertyImage(
          photo.file
        );

        finalGalleryUrls.push(uploadedUrl);
      } else {
        finalGalleryUrls.push(photo.url);
      }
    }

    /* 3 — PRÉPARATION DES DONNÉES */

    property.thumbnail_url = thumbnailUrl || null;
    property.gallery_urls = finalGalleryUrls;

    if (thumbnailUrl) {
      property.photo = thumbnailUrl;
    } else if (finalGalleryUrls.length) {
      property.photo = finalGalleryUrls[0];
    }

    /* 4 — SAUVEGARDE SUPABASE */

    setStatus('Enregistrement de la propriété...');

    await D8Cloud.upsert(property);

    /* 5 — ACTUALISATION DU CATALOGUE */

    const savedId = property.id;

    items = await D8Cloud.list();
    choose(savedId);

    setStatus(
      '✓ Propriété enregistrée avec succès dans Dynasty 8.'
    );

  } catch (error) {
    console.error('DYNASTY 8 — Erreur publication :', error);

    setStatus(
      'Erreur lors de la publication : ' + error.message
    );

  } finally {
    propertySaving = false;

    publishPropertyButton.disabled = false;
    nextStepButton.disabled = false;
    previousStepButton.disabled = false;
  }
};

/* ==========================================================
   ACTIVATION DU BOUTON DE PUBLICATION
   ========================================================== */

if (publishPropertyButton) {
  publishPropertyButton.disabled = false;
}


/* ==========================================================
   ACTIONS
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
