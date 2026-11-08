
/*
 * DYNASTY 8 — ARCHIVE CLIENTS CLASSIQUE
 * API sécurisée Cloudflare Pages
 *
 * Étape 1 : authentification et lecture des dossiers.
 * La création sera activée après l'installation
 * du stockage privé des photos de CNI RP.
 */

const GUILD_ID = "1567889374836957286";
const DIRECTION_ROLE_ID = "1567889789569728583";
const AGENT_ROLE_ID = "1567889964639723631";

function respond(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

async function getJSON(url, headers) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = new Error("Service indisponible");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "GET") {
    return respond(405, {
      error: "Méthode non autorisée."
    });
  }

  const supabaseURL = env.SUPABASE_URL?.replace(/\/$/, "");
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const botToken = env.DISCORD_BOT_TOKEN;

  if (!supabaseURL || !publicKey || !serviceKey || !botToken) {
    return respond(503, {
      error: "Configuration serveur incomplète."
    });
  }

  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];

  if (!token) {
    return respond(401, {
      error: "Connexion Discord nécessaire."
    });
  }

  try {
    // Vérification de la session Supabase
    const user = await getJSON(
      supabaseURL + "/auth/v1/user",
      {
        apikey: publicKey,
        authorization: "Bearer " + token
      }
    );

    const discordIdentity = (user.identities || [])
      .find(identity => identity.provider === "discord");

    const discordId = discordIdentity?.id;

    if (!discordId || !/^\d{17,22}$/.test(discordId)) {
      return respond(403, {
        error: "Compte Discord non reconnu."
      });
    }

    // Vérification des rôles sur le Discord Dynasty 8
    let member;

    try {
      member = await getJSON(
        "https://discord.com/api/v10/guilds/" +
        GUILD_ID + "/members/" + discordId,
        {
          authorization: "Bot " + botToken
        }
      );
    } catch (error) {
      if (error.status === 404) {
        return respond(403, {
          error: "Vous ne faites pas partie du Discord Dynasty 8."
        });
      }
      throw error;
    }

    const roles = member.roles || [];
    const isDirection = roles.includes(DIRECTION_ROLE_ID);
    const isAgent = roles.includes(AGENT_ROLE_ID);

    if (!isDirection && !isAgent) {
      return respond(403, {
        error: "Accès réservé à la Direction et aux agents confirmés."
      });
    }

    const params = new URL(request.url).searchParams;
    const action = params.get("action") || "list";

    // Informations sur l'utilisateur connecté
    if (action === "status") {
      return respond(200, {
        ok: true,
        discordId,
        role: isDirection ? "direction" : "confirme",
        canViewClassicArchives: true
      });
    }

    // Liste des dossiers clients classiques
    if (action === "list") {
      const endpoint = new URL(
        supabaseURL + "/rest/v1/d8_client_archives"
      );

      endpoint.searchParams.set(
        "select",
        "id,rp_name,discord_name,assigned_agent_discord_id,created_at,updated_at"
      );

      endpoint.searchParams.set(
        "is_prestige",
        "eq.false"
      );

      endpoint.searchParams.set(
        "order",
        "created_at.desc"
      );

      endpoint.searchParams.set("limit", "100");

      const clients = await getJSON(
        endpoint.toString(),
        {
          apikey: serviceKey,
          authorization: "Bearer " + serviceKey
        }
      );

      return respond(200, {
        ok: true,
        clients
      });
    }

    return respond(404, {
      error: "Action inconnue."
    });

  } catch (error) {
    if (error.status === 401) {
      return respond(401, {
        error: "Session expirée. Reconnectez-vous."
      });
    }

    return respond(503, {
      error: "Vérification ou lecture indisponible."
    });
  }
}
