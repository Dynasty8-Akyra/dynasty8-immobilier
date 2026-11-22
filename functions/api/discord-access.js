
import editorSource from "../_lib/carte-editeur.txt";

/* ==========================================================
   DYNASTY 8 — API SÉCURISÉE
   NEON MAX — PRESTIGE
   ========================================================== */

const GUILD = "1567889374836957286";
const DIRECTOR = "1567889789569728583";
const CONFIRMED = "1567889964639723631";
const PRESTIGE = "1568940978008760340";


const PROPERTY_TYPES = [
  "Appartement",
  "Studio",
  "Maison",
  "Villa",
  "Loft",
  "Commerce",
  "Garage",
  "Entrepôt",
  "Terrain",
  "Autre"
];


/* ==========================================================
   RÉPONSES ET APPELS API
   ========================================================== */

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = {
      message: "Réponse du service invalide"
    };
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
      data?.error ||
      "Service indisponible"
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

function validId(value) {
  return (
    typeof value === "string" &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(value)
  );
}

function validText(value, maximum, required = false) {
  return (
    typeof value === "string" &&
    value.length <= maximum &&
    (!required || value.trim().length > 0)
  );
}

function validNumber(value, integer = false) {
  return (
    value === null ||
    (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      (!integer || Number.isSafeInteger(value))
    )
  );
}

function validImageUrl(value) {
  if (typeof value !== "string" || value.length > 2000) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/* ==========================================================
   VALIDATION DES PROPRIÉTÉS
   ========================================================== */

function validateProperty(property) {
  if (
    !property ||
    typeof property !== "object" ||
    Array.isArray(property)
  ) {
    return null;
  }

  const purchasePrice = property.purchase_price ?? null;
  const rentalPrice = property.rental_price ?? null;
  const storageKg = property.storage_kg ?? null;
  const rooms = property.rooms ?? null;

  const thumbnailUrl = property.thumbnail_url ?? null;
  const galleryUrls = property.gallery_urls ?? [];

  const valid =
    validId(property.id) &&

    validText(property.name, 100, true) &&
    validText(property.area, 100, true) &&

    PROPERTY_TYPES.includes(property.type) &&

    validNumber(purchasePrice) &&
    validNumber(rentalPrice) &&

    (
      purchasePrice !== null ||
      rentalPrice !== null
    ) &&

    validNumber(property.surface) &&
    property.surface !== null &&

    validNumber(storageKg, true) &&
    validNumber(rooms, true) &&

    typeof property.exterior === "boolean" &&
    typeof property.garage === "boolean" &&

    validText(property.description, 2000) &&

    (
      thumbnailUrl === null ||
      validImageUrl(thumbnailUrl)
    ) &&

    Array.isArray(galleryUrls) &&
    galleryUrls.length <= 30 &&
    galleryUrls.every(validImageUrl);

  if (!valid) {
    return null;
  }

  const price = purchasePrice ?? rentalPrice;

  const photo =
    thumbnailUrl ||
    (
      validImageUrl(property.photo)
        ? property.photo
        : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000"
    );

  return {
    id: property.id,
    name: property.name.trim(),
    type: property.type,
    area: property.area.trim(),

    price,
    surface: property.surface,
    photo,

    description: property.description,

    purchase_price: purchasePrice,
    rental_price: rentalPrice,

    storage_kg: storageKg,
    rooms,

    exterior: property.exterior,
    garage: property.garage,

    thumbnail_url: thumbnailUrl,
    gallery_urls: galleryUrls
  };
}

/* ==========================================================
   POINT D'ENTRÉE CLOUDFLARE
   ========================================================== */

export async function onRequest(context) {
  const { request, env } = context;

  const method = request.method;
  const params = new URL(request.url).searchParams;
  const action = params.get("action") || "status";

  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const bot = env.DISCORD_BOT_TOKEN;
  const training = env.DISCORD_TRAINING_ROLE_ID || "";

  if (!url || !publicKey || !serviceKey || !bot) {
    return json(503, {
      error: "Configuration serveur incomplète."
    });
  }

  /* ========================================================
     LECTURE PUBLIQUE DES QUARTIERS
     ======================================================== */

  if (action === "zones-list" && method === "GET") {
    try {
      const zones = await api(
        url + "/rest/v1/map_zones?select=*&order=name.asc",
        {
          headers: {
            apikey: serviceKey,
            authorization: "Bearer " + serviceKey
          }
        }
      );

      return json(200, { zones });

    } catch {
      return json(503, {
        error: "Impossible de charger les quartiers."
      });
    }
  }

  /* ========================================================
     AUTHENTIFICATION SUPABASE / DISCORD
     ======================================================== */

  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];

  if (!token) {
    return json(401, {
      error: "Connexion Discord nécessaire."
    });
  }

  try {
    const user = await api(url + "/auth/v1/user", {
      headers: {
        apikey: publicKey,
        authorization: "Bearer " + token
      }
    });

    const discord = (user.identities || [])
      .find(identity => identity.provider === "discord");

    const discordId = discord?.id;

    if (!discordId || !/^\d{17,22}$/.test(discordId)) {
      return json(403, {
        error: "Compte non lié à Discord."
      });
    }

    let member;

    try {
      member = await api(
        "https://discord.com/api/v10/guilds/" +
        GUILD + "/members/" + discordId,
        {
          headers: {
            authorization: "Bot " + bot
          }
        }
      );

    } catch (error) {
      if (error.status === 404) {
        return json(403, {
          error: "Vous ne faites pas partie du Discord Dynasty 8."
        });
      }

      throw error;
    }

    const roles = member.roles || [];

    /* ======================================================
       RÔLES DYNASTY 8
       ====================================================== */

    const role = roles.includes(DIRECTOR)
      ? "direction"
      : roles.includes(CONFIRMED)
        ? "confirme"
        : (
          training &&
          /^\d{17,22}$/.test(training) &&
          roles.includes(training)
        )
          ? "formation"
          : "aucun";

    const canWrite =
      role === "direction" ||
      role === "confirme";

    const canEditZones =
      role === "direction";

    const canManageProperties =
      role === "direction";

    const canViewDashboard =
      canWrite || role === "formation";

    /* ======================================================
       PRESTIGE CIRCLE
       ====================================================== */

    const isPrestige = roles.includes(PRESTIGE);

    const isPrestigeDirection =
      roles.includes(DIRECTOR) && isPrestige;

    const isPrestigeAgent =
      !roles.includes(DIRECTOR) &&
      (
        roles.includes(CONFIRMED) ||
        (
          training &&
          roles.includes(training)
        )
      ) &&
      isPrestige;

    const isPrestigeClient =
      isPrestige &&
      !roles.includes(DIRECTOR) &&
      !roles.includes(CONFIRMED) &&
      !(
        training &&
        roles.includes(training)
      );

    /* ======================================================
       STATUT ET AUTORISATIONS
       ====================================================== */

    if (action === "status" && method === "GET") {
      return json(200, {
        role,
        canWrite,
        canViewDashboard,
        canEditZones,
        canManageProperties,

        prestige: {
          isMember: isPrestige,
          isDirection: isPrestigeDirection,
          isAgent: Boolean(isPrestigeAgent),
          isClient: isPrestigeClient,
          canManageMembers: isPrestigeDirection
        }
      });
    }

    /* ======================================================
       ÉDITEUR DE CARTE — DIRECTION
       ====================================================== */

    if (action === "zone-editor" && method === "GET") {
      if (!canEditZones) {
        return json(403, {
          error: "Accès réservé à la Direction."
        });
      }

      return new Response(editorSource, {
        status: 200,
        headers: {
          "content-type":
            "application/javascript; charset=utf-8",
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff"
        }
      });
    }

    /* ======================================================
       GESTION DES QUARTIERS
       ====================================================== */

    if (
      action === "zones-save" ||
      action === "zones-delete"
    ) {
      if (!canEditZones) {
        return json(403, {
          error: "Accès réservé à la Direction."
        });
      }

      const zoneEndpoint =
        url + "/rest/v1/map_zones";

      const zoneHeaders = {
        apikey: serviceKey,
        authorization: "Bearer " + serviceKey,
        "content-type": "application/json"
      };

      /* ENREGISTREMENT D'UN QUARTIER */

      if (action === "zones-save" && method === "POST") {
        const raw = await request.text();

        if (raw.length > 200000) {
          return json(413, {
            error: "Quartier trop volumineux."
          });
        }

        let zone;

        try {
          zone = JSON.parse(raw);
        } catch {
          return json(400, {
            error: "Données du quartier invalides."
          });
        }

        if (
          !zone ||
          typeof zone !== "object" ||
          Array.isArray(zone)
        ) {
          return json(400, {
            error: "Quartier invalide."
          });
        }

        const valid =
          validId(zone.id) &&

          validText(zone.name, 100, true) &&
          validText(zone.type, 100) &&

          [
            "lux",
            "res",
            "rural",
            "ind",
            "excluded"
          ].includes(zone.category) &&

          validText(zone.description, 2000) &&

          Array.isArray(zone.interiors) &&
          zone.interiors.length <= 30 &&

          zone.interiors.every(item =>
            validText(item, 100)
          ) &&

          Array.isArray(zone.points) &&
          zone.points.length >= 3 &&
          zone.points.length <= 5000 &&

          zone.points.every(point =>
            Array.isArray(point) &&
            point.length === 2 &&
            point.every(value =>
              Number.isFinite(value) &&
              value >= 0 &&
              value <= 8192
            )
          );

        if (!valid) {
          return json(400, {
            error:
              "Vérifiez les informations et les points du quartier."
          });
        }

        const clean = {
          id: zone.id,
          name: zone.name.trim(),
          type: zone.type,
          category: zone.category,
          description: zone.description,
          interiors: zone.interiors,
          points: zone.points
        };

        await api(
          zoneEndpoint + "?on_conflict=id",
          {
            method: "POST",
            headers: {
              ...zoneHeaders,
              Prefer:
                "resolution=merge-duplicates,return=minimal"
            },
            body: JSON.stringify(clean)
          }
        );

        return json(200, { ok: true });
      }

      /* SUPPRESSION D'UN QUARTIER */

      if (
        action === "zones-delete" &&
        method === "DELETE"
      ) {
        const id = params.get("id") || "";

        if (!validId(id)) {
          return json(400, {
            error: "Identifiant du quartier invalide."
          });
        }

        await api(
          zoneEndpoint +
          "?id=eq." + encodeURIComponent(id),
          {
            method: "DELETE",
            headers: zoneHeaders
          }
        );

        return json(200, { ok: true });
      }

      return json(405, {
        error: "Méthode non autorisée."
      });
    }

    /* ======================================================
       PROPRIÉTÉS — DIRECTION UNIQUEMENT
       ====================================================== */

    if (
      action !== "save" &&
      action !== "delete"
    ) {
      return json(404, {
        error: "Action inconnue."
      });
    }

    if (!canManageProperties) {
      return json(403, {
        error:
          "La gestion des propriétés est réservée à la Direction Dynasty 8."
      });
    }

    const endpoint =
      url + "/rest/v1/properties";

    const headers = {
      apikey: serviceKey,
      authorization: "Bearer " + serviceKey,
      "content-type": "application/json"
    };

    /* ======================================================
       ENREGISTRER OU MODIFIER UNE PROPRIÉTÉ
       ====================================================== */

    if (action === "save" && method === "POST") {
      const raw = await request.text();

      if (raw.length > 30000) {
        return json(413, {
          error: "Propriété trop volumineuse."
        });
      }

      let property;

      try {
        property = JSON.parse(raw);
      } catch {
        return json(400, {
          error: "Données de propriété invalides."
        });
      }

      const clean = validateProperty(property);

      if (!clean) {
        return json(400, {
          error:
            "Vérifiez les informations, les prix et les caractéristiques de la propriété."
        });
      }

      await api(
        endpoint + "?on_conflict=id",
        {
          method: "POST",
          headers: {
            ...headers,
            Prefer:
              "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify(clean)
        }
      );

      return json(200, {
        ok: true,
        id: clean.id
      });
    }

    /* ======================================================
       SUPPRIMER UNE PROPRIÉTÉ
       ====================================================== */

    if (
      action === "delete" &&
      method === "DELETE"
    ) {
      const id = params.get("id") || "";

      if (!validId(id)) {
        return json(400, {
          error: "Identifiant de propriété invalide."
        });
      }

      await api(
        endpoint +
        "?id=eq." + encodeURIComponent(id),
        {
          method: "DELETE",
          headers
        }
      );

      return json(200, {
        ok: true
      });
    }

    
  } catch (error) {
    console.error("DYNASTY 8 — Erreur API sécurisée", {
      status: error?.status ?? null,
      message: error?.message ?? "Erreur inconnue"
    });

    return json(
      error?.status === 401 ? 401 : 503,
      {
        error:
          error?.status === 401
            ? "Session expirée. Reconnectez-vous."
            : "Vérification sécurisée indisponible. Réessayez plus tard."
      }
    );
  }
}
