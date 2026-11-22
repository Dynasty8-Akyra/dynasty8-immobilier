
/*
 * DYNASTY 8 — UPLOAD SÉCURISÉ DES IMAGES
 * Direction uniquement
 * Cloudflare Pages Functions
 */

const GUILD = "1567889374836957286";
const DIRECTOR = "1567889789569728583";
const BUCKET = "d8-property-images";

function respond(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || "Service indisponible."
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return respond(405, {
      error: "Méthode non autorisée."
    });
  }

  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const bot = env.DISCORD_BOT_TOKEN;

  if (!url || !publicKey || !serviceKey || !bot) {
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
    // 1. Vérifier la session Supabase.
    const user = await requestJson(
      url + "/auth/v1/user",
      {
        headers: {
          apikey: publicKey,
          authorization: "Bearer " + token
        }
      }
    );

    const discord = (user.identities || [])
      .find(identity => identity.provider === "discord");

    const discordId = discord?.id;

    if (!discordId || !/^\d{17,22}$/.test(discordId)) {
      return respond(403, {
        error: "Compte Discord invalide."
      });
    }

    // 2. Vérifier le rôle Direction sur Discord.
    const member = await requestJson(
      `https://discord.com/api/v10/guilds/${GUILD}/members/${discordId}`,
      {
        headers: {
          authorization: "Bot " + bot
        }
      }
    );

    if (!member.roles?.includes(DIRECTOR)) {
      return respond(403, {
        error: "Accès réservé à la Direction Dynasty 8."
      });
    }

    // 3. Lire le fichier.
    const form = await request.formData();
    const file = form.get("file");

    const allowed = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    if (
      !file ||
      typeof file.arrayBuffer !== "function" ||
      !allowed[file.type]
    ) {
      return respond(400, {
        error: "Format accepté : JPG, PNG ou WEBP."
      });
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return respond(413, {
        error: "L'image doit faire moins de 5 Mo."
      });
    }

    // 4. Créer un chemin unique.
    const extension = allowed[file.type];
    const path =
      "properties/" +
      crypto.randomUUID() +
      "." + extension;

    // 5. Envoyer le fichier vers Supabase Storage.
    const storageUrl =
      url +
      "/storage/v1/object/" +
      BUCKET + "/" + path;

    await requestJson(storageUrl, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        authorization: "Bearer " + serviceKey,
        "content-type": file.type,
        "x-upsert": "false"
      },
      body: await file.arrayBuffer()
    });

    // 6. Retourner l'URL publique.
    const publicUrl =
      url +
      "/storage/v1/object/public/" +
      BUCKET + "/" + path;

    return respond(200, {
      ok: true,
      path,
      url: publicUrl
    });

  } catch (error) {
    return respond(
      error.status === 401 ? 401 : 503,
      {
        error:
          error.status === 401
            ? "Session expirée. Reconnectez-vous."
            : "Impossible d'envoyer l'image. Réessayez."
      }
    );
  }
}
