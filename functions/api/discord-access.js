
import editorSource from "../_lib/carte-editeur.txt";

const GUILD = "1567889374836957286";
const DIRECTOR = "1567889789569728583";
const CONFIRMED = "1567889964639723631";

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
    data = { message: "Réponse du service invalide" };
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Service indisponible");
    error.status = response.status;
    throw error;
  }

  return data;
}

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

  // DYNASTY 8 — LECTURE PUBLIQUE DES QUARTIERS
  if (action === "zones-list" && method === "GET") {
    try {
      const response = await api(
        url + "/rest/v1/map_zones?select=*&order=name.asc",
        {
          headers: {
            apikey: serviceKey,
            authorization: "Bearer " + serviceKey
          }
        }
      );

      return json(200, { zones: response });
    } catch {
      return json(503, {
        error: "Impossible de charger les quartiers."
      });
    }
  }

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

    const role = roles.includes(DIRECTOR)
      ? "direction"
      : roles.includes(CONFIRMED)
        ? "confirme"
        : training &&
          /^\d{17,22}$/.test(training) &&
          roles.includes(training)
          ? "formation"
          : "aucun";

    const canWrite =
      role === "direction" || role === "confirme";
    
const canEditZones = role === 'direction';


    const canViewDashboard =
      canWrite || role === "formation";

    if (action === "status" && method === "GET") {
      return json(200, {
        role,
        canWrite,
        canViewDashboard,
        canEditZones
      });
    }

    // DYNASTY 8 — ÉDITEUR RÉSERVÉ À LA DIRECTION
    if (action === "zone-editor" && method === "GET") {
      if (!canEditZones) {
        return json(403, {
          error: "Accès réservé à la Direction."
        });
      }

      return new Response(editorSource, {
        status: 200,
        headers: {
          "content-type": "application/javascript; charset=utf-8",
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff"
        }
      });
    }

    // DYNASTY 8 — GESTION DES QUARTIERS
    if (
      action === "zones-save" ||
      action === "zones-delete"
    ) {
      if (!canEditZones) {
        return json(403, {
          error: "Accès réservé à la Direction."
        });
      }

      const zoneEndpoint = url + "/rest/v1/map_zones";

      const zoneHeaders = {
        apikey: serviceKey,
        authorization: "Bearer " + serviceKey,
        "content-type": "application/json"
      };

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

        if (!zone || typeof zone !== "object" ||
            Array.isArray(zone)) {
          return json(400, {
            error: "Quartier invalide."
          });
        }

        const valid =
          typeof zone.id === "string" &&
          /^[a-zA-Z0-9_-]{1,100}$/.test(zone.id) &&
          typeof zone.name === "string" &&
          zone.name.trim().length > 0 &&
          zone.name.length <= 100 &&
          typeof zone.type === "string" &&
          zone.type.length <= 100 &&
          ["lux", "res", "rural", "ind", "excluded"]
            .includes(zone.category) &&
          typeof zone.description === "string" &&
          zone.description.length <= 2000 &&
          Array.isArray(zone.interiors) &&
          zone.interiors.length <= 30 &&
          zone.interiors.every(
            item => typeof item === "string" &&
                    item.length <= 100
          ) &&
          Array.isArray(zone.points) &&
          zone.points.length >= 3 &&
          zone.points.length <= 5000 &&
          zone.points.every(
            point =>
              Array.isArray(point) &&
              point.length === 2 &&
              point.every(
                value =>
                  Number.isFinite(value) &&
                  value >= 0 &&
                  value <= 8192
              )
          );

        if (!valid) {
          return json(400, {
            error: "Vérifiez les informations et les points du quartier."
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

        await api(zoneEndpoint + "?on_conflict=id", {
          method: "POST",
          headers: {
            ...zoneHeaders,
            Prefer: "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify(clean)
        });

        return json(200, { ok: true });
      }

      if (action === "zones-delete" &&
          method === "DELETE") {
        const id = params.get("id") || "";

        if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
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

    if (!canWrite) {
      return json(403, {
        error: "Seuls la Direction et les Agents confirmés peuvent gérer les annonces."
      });
    }

    const endpoint = url + "/rest/v1/properties";

    const headers = {
      apikey: serviceKey,
      authorization: "Bearer " + serviceKey,
      "content-type": "application/json"
    };

    if (action === "save" && method === "POST") {
      const raw = await request.text();

      if (raw.length > 15000) {
        return json(413, {
          error: "Annonce trop volumineuse."
        });
      }

      let property;

      try {
        property = JSON.parse(raw);
      } catch {
        return json(400, {
          error: "Annonce invalide."
        });
      }

      if (!property || typeof property !== "object" ||
          Array.isArray(property)) {
        return json(400, {
          error: "Annonce invalide."
        });
      }

      const keys = [
        "id", "name", "type", "area",
        "price", "surface", "photo", "description"
      ];

      const clean = Object.fromEntries(
        keys
          .filter(key => property[key] !== undefined)
          .map(key => [key, property[key]])
      );

      const valid =
        typeof clean.id === "string" &&
        /^[a-zA-Z0-9_-]{1,100}$/.test(clean.id) &&
        typeof clean.name === "string" &&
        clean.name.trim().length > 0 &&
        clean.name.length <= 100 &&
        typeof clean.area === "string" &&
        clean.area.trim().length > 0 &&
        clean.area.length <= 100 &&
        [
          "Villa", "Appartement", "Commerce",
          "Garage", "Entrepôt", "Terrain"
        ].includes(clean.type) &&
        Number.isFinite(clean.price) &&
        clean.price >= 0 &&
        Number.isFinite(clean.surface) &&
        clean.surface >= 0 &&
        typeof clean.description === "string" &&
        clean.description.length <= 2000 &&
        typeof clean.photo === "string" &&
        clean.photo.length <= 2000 &&
        /^https:\/\//.test(clean.photo);

      if (!valid) {
        return json(400, {
          error: "Vérifiez les champs de votre annonce."
        });
      }

      await api(endpoint + "?on_conflict=id", {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(clean)
      });

      return json(200, { ok: true });
    }

    if (action === "delete" && method === "DELETE") {
      const id = params.get("id") || "";

      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
        return json(400, {
          error: "Identifiant incorrect."
        });
      }

      await api(
        endpoint + "?id=eq." + encodeURIComponent(id),
        {
          method: "DELETE",
          headers
        }
      );

      return json(200, { ok: true });
    }

    return json(405, {
      error: "Action non autorisée."
    });

  } catch (error) {
    return json(error.status === 401 ? 401 : 503, {
      error: error.status === 401
        ? "Session expirée. Reconnectez-vous."
        : "Vérification sécurisée indisponible. Réessayez plus tard."
    });
  }
}
