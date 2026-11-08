
/*
 DYNASTY 8 — ARCHIVE CLIENTS CLASSIQUE
 Cloudflare Pages + Supabase + Discord

 GET  ?action=status
 GET  ?action=list
 POST ?action=create

 Création : nom RP, téléphone RP, ID Discord
 et photo CNI RP obligatoires.

 Les dossiers Prestige ne sont jamais retournés
 par cette API.
*/

const GUILD_ID = "1567889374836957286";
const DIRECTION_ROLE_ID = "1567889789569728583";
const AGENT_ROLE_ID = "1567889964639723631";
const BUCKET = "d8-client-cni";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

async function api(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = new Error("Service indisponible");
    error.status = response.status;
    throw error;
  }

  return response;
}

function storageHeaders(serviceKey, extra = {}) {
  return {
    apikey: serviceKey,
    authorization: "Bearer " + serviceKey,
    ...extra
  };
}

function validDiscordId(value) {
  return /^\d{17,22}$/.test(value);
}

function imageFormat(bytes) {
  const b = new Uint8Array(bytes);

  if (
    b.length >= 3 &&
    b[0] === 255 &&
    b[1] === 216 &&
    b[2] === 255
  ) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (
    b.length >= 8 &&
    [137,80,78,71,13,10,26,10]
      .every((v, i) => b[i] === v)
  ) {
    return { mime: "image/png", ext: "png" };
  }

  if (
    b.length >= 12 &&
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

export async function onRequest(context) {
  const { request, env } = context;

  const base = env.SUPABASE_URL?.replace(/\/$/, "");
  const publicKey = env.SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const botToken = env.DISCORD_BOT_TOKEN;

  if (!base || !publicKey || !serviceKey || !botToken) {
    return json(503, {
      error: "Configuration serveur incomplète."
    });
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
    // 1 — Vérification de la session Supabase
    const userResponse = await api(
      base + "/auth/v1/user",
      {
        headers: {
          apikey: publicKey,
          authorization: "Bearer " + token
        }
      }
    );

    const user = await userResponse.json();

    const discordIdentity = (user.identities || [])
      .find(identity => identity.provider === "discord");

    const discordId = discordIdentity?.id;

    if (!validDiscordId(discordId || "")) {
      return json(403, {
        error: "Compte Discord non reconnu."
      });
    }

    // 2 — Vérification des rôles Discord
    let memberResponse;

    try {
      memberResponse = await api(
        "https://discord.com/api/v10/guilds/" +
          GUILD_ID + "/members/" + discordId,
        {
          headers: {
            authorization: "Bot " + botToken
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

    const member = await memberResponse.json();
    const roles = member.roles || [];

    const isDirection = roles.includes(DIRECTION_ROLE_ID);
    const isAgent = roles.includes(AGENT_ROLE_ID);

    if (!isDirection && !isAgent) {
      return json(403, {
        error: "Accès réservé à la Direction et aux agents confirmés."
      });
    }

    const params = new URL(request.url).searchParams;
    const action = params.get("action") || "list";

    // 3 — Statut utilisateur
    if (action === "status" && request.method === "GET") {
      return json(200, {
        ok: true,
        discordId,
        role: isDirection ? "direction" : "confirme",
        canViewClassicArchives: true,
        canCreateClassicArchives: true
      });
    }

    // 3 BIS — Consultation sécurisée de la CNI RP
    if (action === "cni" && request.method === "GET") {
      const clientId = params.get("id") || "";

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
      ) {
        return json(400, {
          error: "Identifiant de dossier invalide."
        });
      }

      // Vérifier que le dossier existe et n'est pas Prestige
      const dossierURL = new URL(
        base + "/rest/v1/d8_client_archives"
      );

      dossierURL.searchParams.set(
        "select",
        "id,cni_storage_path"
      );

      dossierURL.searchParams.set("id", "eq." + clientId);
      dossierURL.searchParams.set("is_prestige", "eq.false");
      dossierURL.searchParams.set("limit", "1");

      const dossierResponse = await api(
        dossierURL.toString(),
        {
          headers: storageHeaders(serviceKey)
        }
      );

      const dossiers = await dossierResponse.json();
      const dossier = dossiers[0];

      if (!dossier || !dossier.cni_storage_path) {
        return json(404, {
          error: "CNI RP introuvable."
        });
      }

      // Empêcher l'accès à un autre chemin de stockage
      const path = dossier.cni_storage_path;

      if (
        typeof path !== "string" ||
        !path.startsWith(clientId + "/") ||
        !/^[-a-zA-Z0-9_/\.]+$/.test(path) ||
        path.includes("..")
      ) {
        return json(403, {
          error: "Chemin de CNI non autorisé."
        });
      }

      // Lire l'image dans le bucket privé
      const imageURL =
        base + "/storage/v1/object/" +
        BUCKET + "/" + path;

      const imageResponse = await fetch(imageURL, {
        headers: storageHeaders(serviceKey)
      });

      if (!imageResponse.ok) {
        return json(404, {
          error: "Image de CNI indisponible."
        });
      }

      const imageBytes = await imageResponse.arrayBuffer();

      if (
        imageBytes.byteLength === 0 ||
        imageBytes.byteLength > MAX_IMAGE_SIZE
      ) {
        return json(415, {
          error: "Image de CNI invalide."
        });
      }

      const format = imageFormat(imageBytes);

      if (!format) {
        return json(415, {
          error: "Format de CNI non reconnu."
        });
      }

      return new Response(imageBytes, {
        status: 200,
        headers: {
          "content-type": format.mime,
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy": "default-src 'none'; sandbox"
        }
      });
    }

    // 4 — Lecture des dossiers classiques
    if (action === "list" && request.method === "GET") {
      const endpoint = new URL(
        base + "/rest/v1/d8_client_archives"
      );

      endpoint.searchParams.set(
        "select",
        "id,rp_name,rp_phone,client_discord_id," +
        "assigned_agent_discord_id,created_by_discord_id," +
        "created_at,updated_at"
      );

      endpoint.searchParams.set("is_prestige", "eq.false");
      endpoint.searchParams.set("order", "created_at.desc");
      endpoint.searchParams.set("limit", "100");

      const response = await api(endpoint.toString(), {
        headers: storageHeaders(serviceKey)
      });

      const clients = await response.json();

      return json(200, {
        ok: true,
        clients
      });
    }

    // 5 — Création d'un dossier classique
    if (action === "create" && request.method === "POST") {
      const contentType =
        request.headers.get("content-type") || "";

      if (!contentType.startsWith("multipart/form-data")) {
        return json(415, {
          error: "Formulaire avec photo obligatoire."
        });
      }

      const declaredLength = Number(
        request.headers.get("content-length") || 0
      );

      if (declaredLength > MAX_IMAGE_SIZE + 100000) {
        return json(413, {
          error: "Fichier trop volumineux."
        });
      }

      let form;

      try {
        form = await request.formData();
      } catch {
        return json(400, {
          error: "Formulaire invalide."
        });
      }

      const rpName = String(
        form.get("rp_name") || ""
      ).trim();

      const rpPhone = String(
        form.get("rp_phone") || ""
      ).trim();

      const clientDiscordId = String(
        form.get("client_discord_id") || ""
      ).trim();

      const cni = form.get("cni");

      if (rpName.length < 2 || rpName.length > 160) {
        return json(400, {
          error: "Nom RP invalide."
        });
      }

      if (
        rpPhone.length < 3 ||
        rpPhone.length > 40 ||
        !/^[0-9+(). -]+$/.test(rpPhone)
      ) {
        return json(400, {
          error: "Téléphone RP invalide."
        });
      }

      if (!validDiscordId(clientDiscordId)) {
        return json(400, {
          error: "ID Discord invalide."
        });
      }

      if (
        !cni ||
        typeof cni.arrayBuffer !== "function" ||
        !cni.size
      ) {
        return json(400, {
          error: "La photo de CNI RP est obligatoire."
        });
      }

      if (cni.size > MAX_IMAGE_SIZE) {
        return json(413, {
          error: "La CNI ne doit pas dépasser 5 Mo."
        });
      }

      const imageBytes = await cni.arrayBuffer();
      const format = imageFormat(imageBytes);

      if (
        !format ||
        cni.type !== format.mime
      ) {
        return json(415, {
          error: "CNI : utilisez JPG, PNG ou WEBP."
        });
      }

      // 6 — Vérification des doublons
      const existingURL = new URL(
        base + "/rest/v1/d8_client_archives"
      );

      existingURL.searchParams.set("select", "id");
      existingURL.searchParams.set(
        "client_discord_id",
        "eq." + clientDiscordId
      );
      existingURL.searchParams.set("limit", "1");

      const existingResponse = await api(
        existingURL.toString(),
        {
          headers: storageHeaders(serviceKey)
        }
      );

      const existing = await existingResponse.json();

      if (existing.length) {
        return json(409, {
          error: "Un dossier existe déjà pour cet ID Discord."
        });
      }

      // 7 — Envoi de la photo dans le bucket privé
      const clientId = crypto.randomUUID();
      const storagePath =
        clientId + "/cni." + format.ext;

      const uploadURL =
        base + "/storage/v1/object/" +
        BUCKET + "/" + storagePath;

      await api(uploadURL, {
        method: "POST",
        headers: storageHeaders(serviceKey, {
          "content-type": format.mime,
          "x-upsert": "false"
        }),
        body: imageBytes
      });

      // 8 — Enregistrement du dossier dans Supabase
      const dossier = {
        id: clientId,
        rp_name: rpName,
        rp_phone: rpPhone,
        client_discord_id: clientDiscordId,
        cni_storage_path: storagePath,
        created_by_discord_id: discordId,
        assigned_agent_discord_id: discordId,
        is_prestige: false
      };

      try {
        await api(
          base + "/rest/v1/d8_client_archives",
          {
            method: "POST",
            headers: storageHeaders(serviceKey, {
              "content-type": "application/json",
              Prefer: "return=minimal"
            }),
            body: JSON.stringify(dossier)
          }
        );
      } catch (error) {
        // Supprimer la photo si le dossier n'a pas pu
        // être enregistré, pour éviter un fichier orphelin.
        try {
          await api(
            base + "/storage/v1/object/" +
              BUCKET + "/" + storagePath,
            {
              method: "DELETE",
              headers: storageHeaders(serviceKey)
            }
          );
        } catch {
          // Une vérification administrative sera nécessaire
          // si le nettoyage du stockage échoue.
        }

        if (error.status === 409) {
          return json(409, {
            error: "Un dossier existe déjà pour cet ID Discord."
          });
        }

        throw error;
      }

      return json(201, {
        ok: true,
        message: "Dossier client créé.",
        client: {
          id: clientId,
          rp_name: rpName,
          rp_phone: rpPhone,
          client_discord_id: clientDiscordId
        }
      });
    }

    return json(405, {
      error: "Action ou méthode non autorisée."
    });

  } catch (error) {
    if (error.status === 401) {
      return json(401, {
        error: "Session expirée. Reconnectez-vous."
      });
    }

    return json(503, {
      error: "Service momentanément indisponible."
    });
  }
}
