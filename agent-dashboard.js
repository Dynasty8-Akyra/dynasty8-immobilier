
/* DYNASTY 8 — Tableau de bord / Red Neon Prestige V2 */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let properties = [];
  let canWrite = false;

  const currency = n =>
    new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(Number(n) || 0) + ' $';

  const esc = s =>
    String(s ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );

  /* AFFICHAGE DES ANNONCES */

  function render() {
    const search = $('search');
    const rows = $('rows');

    if (!search || !rows) return;

    const q = search.value
      .toLocaleLowerCase('fr')
      .trim();

    const filtered = properties.filter(p =>
      [p.name, p.area, p.type].some(v =>
        String(v || '')
          .toLocaleLowerCase('fr')
          .includes(q)
      )
    );

    rows.innerHTML = filtered.map(p => `
      <tr>
        <td>${esc(p.name)}</td>
        <td>${esc(p.type)}</td>
        <td>${esc(p.area)}</td>
        <td>${currency(p.price)}</td>
        ${canWrite ? `
          <td>
            <a href="admin-annonces.html?edit=${encodeURIComponent(p.id)}">
              MODIFIER ↗
            </a>
          </td>
        ` : ''}
      </tr>
    `).join('');

    if ($('empty')) {
      $('empty').hidden = filtered.length > 0;
    }
  }

  /* PERMISSIONS DISCORD */

  function applyPermissions(access) {
    canWrite = access.canWrite === true;
    window.canWriteDashboard = canWrite;

    if (!canWrite) {
      document
        .querySelectorAll('.primary, .bottom a:first-child')
        .forEach(el => el.hidden = true);

      document
        .querySelectorAll('thead th:last-child')
        .forEach(el => el.remove());
    }

    const title = document.querySelector(
      '#dashboard .intro h1'
    );

    if (title) {
      const role =
        access.canEditZones === true
          ? 'Direction'
          : access.role === 'formation'
            ? 'Formation'
            : 'Agent';

      title.innerHTML =
        'Tableau de bord <em>' + role + '</em>';
    }
  }

  /* NAVIGATION DES CARTES */

  function createMapNavigation(access) {
    const dashboard = $('dashboard');

    if (
      !dashboard ||
      dashboard.querySelector('.d8-dashboard-maps')
    ) return;

    const nav = document.createElement('nav');
    nav.className = 'd8-dashboard-maps';
    nav.setAttribute('aria-label', 'Accès aux cartes');

    const publicMap = document.createElement('a');
    publicMap.href = 'carte.html';
    publicMap.className = 'd8-map-access';
    publicMap.textContent = '⌖ CARTE IMMOBILIÈRE';
    nav.appendChild(publicMap);

    if (access.canEditZones === true) {
      const directionMap = document.createElement('a');
      directionMap.href = 'admin-carte.html';
      directionMap.className =
        'd8-map-access d8-map-direction';
      directionMap.textContent = '♛ ÉDITEUR DIRECTION';
      nav.appendChild(directionMap);
    }

    // Placer les cartes SOUS les statistiques.
    const stats = dashboard.querySelector('.stats');

    if (stats) {
      stats.insertAdjacentElement('afterend', nav);
    } else {
      dashboard.prepend(nav);
    }
  }

  /* STATISTIQUES */

  function updateStats() {
    const total = properties.length;

    const sum = properties.reduce(
      (a, p) => a + (Number(p.price) || 0),
      0
    );

    const values = {
      total: String(total),
      value: currency(sum),
      average: currency(total ? sum / total : 0),
      types: String(
        new Set(properties.map(p => p.type)).size
      )
    };

    Object.entries(values).forEach(([id, value]) => {
      if ($(id)) $(id).textContent = value;
    });
  }

  /* CHARGEMENT DU TABLEAU DE BORD */

  async function init() {
    try {
      if (
        !window.D8Cloud ||
        !D8Cloud.ready() ||
        !(await D8Cloud.authenticated())
      ) {
        location.replace('agent-login.html');
        return;
      }

      const access = await D8Cloud.role();

      if (access.canViewDashboard !== true) {
        location.replace('index.html');
        return;
      }

      applyPermissions(access);
      createMapNavigation(access);

      properties = await D8Cloud.list();

      updateStats();

      if ($('gate')) $('gate').hidden = true;
      if ($('dashboard')) $('dashboard').hidden = false;

      render();

    } catch (error) {
      console.error(
        'DYNASTY 8 — Tableau de bord :',
        error
      );

      if ($('gate')) {
        $('gate').hidden = false;
        $('gate').textContent =
          'Impossible de charger le tableau de bord : ' +
          error.message;
      }
    }
  }

  /* RECHERCHE */

  if ($('search')) {
    $('search').addEventListener('input', render);
  }

  /* DÉCONNEXION */

  if ($('logout')) {
    $('logout').addEventListener('click', async () => {
      try {
        await D8Cloud.logout();
      } finally {
        location.replace('agent-login.html');
      }
    });
  }

  init();
})();
