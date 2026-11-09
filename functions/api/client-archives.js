
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

/*
 DYNASTY 8 — FINANCE PRESTIGE
 Calcul progressif des frais d'agence.

 Achat : frais sur le prix de vente.
 Location : frais uniques calculés sur
 le loyer mensuel à la signature du bail.

 Commission agent : 20 % des frais nets.
*/

function calculateProgressiveFees(amount, brackets) {
  let remaining = amount;
  let previousLimit = 0;
  let total = 0;

  for (const [limit, rate] of brackets) {
    if (remaining <= 0) break;

    const taxable = Math.min(
      remaining,
      limit - previousLimit
    );

    total += taxable * rate;
    remaining -= taxable;
    previousLimit = limit;
  }

  return Math.round((total + Number.EPSILON) * 100) / 100;
}

function calculateAgencyFees(type, amount) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1000000000000
  ) {
    throw new Error("Montant immobilier invalide.");
  }

  if (type === "purchase") {
    return calculateProgressiveFees(amount, [
      [250000, 0.08],
      [500000, 0.07],
      [1000000, 0.06],
      [2000000, 0.05],
      [5000000, 0.04],
      [Infinity, 0.03]
    ]);
  }

  if (type === "rental") {
    return calculateProgressiveFees(amount, [
      [2500, 0.20],
      [5000, 0.18],
      [10000, 0.15],
      [20000, 0.12],
      [50000, 0.10],
      [Infinity, 0.08]
    ]);
  }

  throw new Error("Type de transaction invalide.");
}

function calculateAgentCommission(agencyFees) {
  return Math.round(
    (agencyFees * 0.20 + Number.EPSILON) * 100
  ) / 100;
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

    // DYNASTY 8 — NOTES INTERNES DES CLIENTS
    // Lecture et création réservées aux rôles autorisés.

    if (
      (action === "notes-list" && request.method === "GET") ||
      (action === "notes-create" && request.method === "POST")
    ) {
      const clientId = params.get("id") || "";

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
      ) {
        return json(400, {
          error: "Identifiant de dossier invalide."
        });
      }

      // Vérifier que le dossier est classique, jamais Prestige.
      const clientURL = new URL(
        base + "/rest/v1/d8_client_archives"
      );

      clientURL.searchParams.set("select", "id");
      clientURL.searchParams.set("id", "eq." + clientId);
      clientURL.searchParams.set("is_prestige", "eq.false");
      clientURL.searchParams.set("limit", "1");

      const clientResponse = await api(
        clientURL.toString(),
        {
          headers: storageHeaders(serviceKey)
        }
      );

      const existingClients = await clientResponse.json();

      if (!existingClients.length) {
        return json(404, {
          error: "Dossier client introuvable."
        });
      }

      // Lire les notes enregistrées.
      if (action === "notes-list") {
        const notesURL = new URL(
          base + "/rest/v1/d8_client_notes"
        );

        notesURL.searchParams.set(
          "select",
          "id,client_id,note,created_by_discord_id,created_at"
        );

        notesURL.searchParams.set("client_id", "eq." + clientId);
        notesURL.searchParams.set("order", "created_at.desc");
        notesURL.searchParams.set("limit", "100");

        const notesResponse = await api(
          notesURL.toString(),
          {
            headers: storageHeaders(serviceKey)
          }
        );

        const notes = await notesResponse.json();

        return json(200, {
          ok: true,
          notes
        });
      }

      // Créer une nouvelle note.
      const contentType =
        request.headers.get("content-type") || "";

      if (!contentType.toLowerCase().startsWith("application/json")) {
        return json(415, {
          error: "Le format JSON est obligatoire."
        });
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json(400, {
          error: "Contenu de note invalide."
        });
      }

      if (
        !body ||
        typeof body.note !== "string" ||
        body.note.trim().length < 1 ||
        body.note.trim().length > 2000
      ) {
        return json(400, {
          error: "La note doit contenir entre 1 et 2000 caractères."
        });
      }

      const newNote = {
        client_id: clientId,
        note: body.note.trim(),
        created_by_discord_id: discordId
      };

      const createResponse = await api(
        base + "/rest/v1/d8_client_notes",
        {
          method: "POST",
          headers: storageHeaders(serviceKey, {
            "content-type": "application/json",
            Prefer: "return=representation"
          }),
          body: JSON.stringify(newNote)
        }
      );

      const createdNotes = await createResponse.json();

      return json(201, {
        ok: true,
        message: "Note interne enregistrée.",
        note: createdNotes[0]
      });
    }

    // DYNASTY 8 — ENREGISTREMENT D'UNE TRANSACTION
    if (action === "transaction-create" && request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";

      if (!contentType.startsWith("multipart/form-data")) {
        return json(415, { error: "Formulaire invalide." });
      }

      const declaredLength = Number(
        request.headers.get("content-length") || 0
      );

      if (declaredLength > MAX_IMAGE_SIZE + 100000) {
        return json(413, { error: "Formulaire trop volumineux." });
      }

      let form;

      try {
        form = await request.formData();
      } catch {
        return json(400, { error: "Impossible de lire le formulaire." });
      }

      // DYNASTY 8 — Identifiant unique de transaction
      const requestId = String(
        form.get("request_id") || ""
      ).trim();

      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          requestId
        )
      ) {
        return json(400, {
          error: "Identifiant de transaction invalide."
        });
      }


      const mode = String(form.get("client_mode") || "");
      const type = String(form.get("transaction_type") || "");
      const propertyId = String(form.get("property_id") || "").trim();
      const propertyName = String(form.get("property_name") || "").trim();
      const propertyAddress = String(
        form.get("property_address") || ""
      ).trim();

      const rawAmount = String(form.get("amount") || "").trim();
      const amount = Number(rawAmount);

      if (!["new", "existing"].includes(mode)) {
        return json(400, { error: "Mode client invalide." });
      }

      if (!["purchase", "rental"].includes(type)) {
        return json(400, { error: "Type de transaction invalide." });
      }

      if (
        !propertyId || propertyId.length > 100 ||
        !propertyName || propertyName.length > 160 ||
        propertyAddress.length > 250
      ) {
        return json(400, { error: "Informations du bien invalides." });
      }

      if (
        !/^\d{1,13}(\.\d{1,2})?$/.test(rawAmount) ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 1000000000000
      ) {
        return json(400, { error: "Montant immobilier invalide." });
      }

      const agencyFees = calculateAgencyFees(type, amount);
      const agentCommission = calculateAgentCommission(agencyFees);

      
      let existingClientId = null;
      let newClientId = null;
      let storagePath = null;
      let uploaded = false;
      let reuseExistingCni = false;


      let rpName = null;
      let rpPhone = null;
      let clientDiscordId = null;

      if (mode === "existing") {
        existingClientId = String(
          form.get("existing_client_id") || ""
        ).trim();

        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            existingClientId
          )
        ) {
          return json(400, { error: "Client existant invalide." });
        }
      } else {
        rpName = String(form.get("rp_name") || "").trim();
        rpPhone = String(form.get("rp_phone") || "").trim();
        clientDiscordId = String(
          form.get("client_discord_id") || ""
        ).trim();

        const cni = form.get("cni");

        if (
          rpName.length < 2 || rpName.length > 160 ||
          rpPhone.length < 3 || rpPhone.length > 40 ||
          !/^[0-9+(). -]+$/.test(rpPhone) ||
          !validDiscordId(clientDiscordId)
        ) {
          return json(400, { error: "Identité client invalide." });
        }

        if (
          !cni ||
          typeof cni.arrayBuffer !== "function" ||
          !cni.size ||
          cni.size > MAX_IMAGE_SIZE
        ) {
          return json(400, {
            error: "CNI RP obligatoire, 5 Mo maximum."
          });
        }

        const imageBytes = await cni.arrayBuffer();
        const format = imageFormat(imageBytes);

        if (!format || cni.type !== format.mime) {
          return json(415, {
            error: "CNI RP : JPG, PNG ou WEBP uniquement."
          });
        }

       
        // Identifiant stable pour une même demande.
        // Permet de retrouver le même dossier lors d'un réessai.
        newClientId = requestId;
        storagePath = newClientId + "/cni." + format.ext;


        const uploadURL =
          base + "/storage/v1/object/" +
          BUCKET + "/" + storagePath;

        // Vérifier si la CNI de cette demande existe déjà.
        const existingCniResponse = await fetch(uploadURL, {
          method: "GET",
          headers: storageHeaders(serviceKey)
        });

        
        if (existingCniResponse.ok) {
         
          // Comparer la CNI déjà stockée au fichier envoyé.
         
          // Limiter la lecture de la CNI déjà stockée.
          const existingCniLength = Number(
            existingCniResponse.headers.get("content-length")
          );

         
          if (
            existingCniResponse.headers.has("content-length") &&
            (
              !Number.isFinite(existingCniLength) ||
              existingCniLength <= 0 ||
              existingCniLength > MAX_IMAGE_SIZE
            )
          ) {

            await existingCniResponse.body?.cancel();

            return json(413, {
              error:
                "Impossible de vérifier la taille de la CNI existante."
            });
          }

         
          // Lire la CNI par morceaux avec une limite stricte.
          const reader = existingCniResponse.body?.getReader();

          if (!reader) {
            return json(503, {
              error: "Impossible de lire la CNI existante."
            });
          }

          const chunks = [];
          let totalBytes = 0;

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) break;

              totalBytes += value.byteLength;

              if (totalBytes > MAX_IMAGE_SIZE) {
                await reader.cancel();

                return json(413, {
                  error: "La CNI existante dépasse la taille autorisée."
                });
              }

              chunks.push(value);
            }
          } finally {
            reader.releaseLock();
          }

          const existingCniBytes = new Uint8Array(totalBytes);
          let offset = 0;

          for (const chunk of chunks) {
            existingCniBytes.set(chunk, offset);
            offset += chunk.byteLength;
          }

          if (
            existingCniBytes.byteLength === 0 ||
            existingCniBytes.byteLength > MAX_IMAGE_SIZE
          ) {
            return json(413, {
              error: "CNI existante trop volumineuse ou invalide."
            });
          }


          const originalBytes = new Uint8Array(existingCniBytes);
          const submittedBytes = new Uint8Array(imageBytes);

          const sameCni =
            originalBytes.length === submittedBytes.length &&
            originalBytes.every(
              (byte, index) => byte === submittedBytes[index]
            );

          // Vérifier si la CNI existante correspond
          // exactement à celle de cette demande.
          const canReuseExistingCni = sameCni;

        
          if (canReuseExistingCni) {
            reuseExistingCni = true;
          }


          if (!sameCni) {
            return json(409, {
              error:
                "Cette demande possède une CNI différente. " +
                "Aucun fichier n'a été modifié."
            });
          }

        }
 
        if (
          existingCniResponse.status !== 404 &&
          !reuseExistingCni
        ) {
          return json(503, {
            error:
              "Impossible de vérifier la CNI. " +
              "Réessayez plus tard."
          });
        }

        // Ne télécharger la CNI que si elle n'existe pas déjà.
        if (!reuseExistingCni) {
          await api(uploadURL, {
            method: "POST",
            headers: storageHeaders(serviceKey, {
              "content-type": format.mime,
              "x-upsert": "false"
            }),
            body: imageBytes
          });

          uploaded = true;
        }

      }

     
      const payload = {
        p_request_id: requestId,
        p_client_id: existingClientId,
        p_new_client_id: newClientId,
        p_rp_name: rpName,
        p_rp_phone: rpPhone,
        p_client_discord_id: clientDiscordId,
        p_cni_storage_path: storagePath,
        p_agent_discord_id: discordId,
        p_property_id: propertyId,
        p_property_name: propertyName,
        p_property_address: propertyAddress,
        p_transaction_type: type,
        p_amount: amount,
        p_agency_fees: agencyFees,
        p_agent_commission: agentCommission
      };

      try {
        const response = await api(
          base + "/rest/v1/rpc/d8_register_classic_transaction",
          {
            method: "POST",
            headers: storageHeaders(serviceKey, {
              "content-type": "application/json"
            }),
            body: JSON.stringify(payload)
          }
        );

        const result = await response.json();
        const saved = Array.isArray(result) ? result[0] : result;

        if (!saved?.saved_client_id || !saved?.saved_transaction_id) {
          throw new Error("Réponse de transaction invalide.");
        }

        return json(201, {
          ok: true,
          message: "Transaction enregistrée.",
          client: { id: saved.saved_client_id },
          transaction: { id: saved.saved_transaction_id },
          agency_fees: agencyFees,
          agent_commission: agentCommission
        });

      
      } catch (error) {
        // Ne jamais supprimer automatiquement une CNI ici.
        // La transaction peut avoir été enregistrée même si
        // la réponse de Supabase n'est pas arrivée.

        if (error.status === 409) {
          return json(409, {
            error:
              "Conflit lors de l'enregistrement. " +
              "Vérifiez les archives avant de recommencer."
          });
        }

        throw error;
      }
     
    }

    // DYNASTY 8 — HISTORIQUE IMMOBILIER SÉCURISÉ
    if (action === "transactions-list" && request.method === "GET") {
      const clientId = String(params.get("id") || "").trim();

      if (
       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
      ) {
        return json(400, {
          error: "Identifiant client invalide."
        });
      }

      // Vérifier que le client appartient aux archives classiques.
      const clientURL = new URL(
        base + "/rest/v1/d8_client_archives"
      );

      clientURL.searchParams.set("select", "id");
      clientURL.searchParams.set("id", "eq." + clientId);
      clientURL.searchParams.set("is_prestige", "eq.false");
      clientURL.searchParams.set("limit", "1");

      const clientResponse = await api(
        clientURL.toString(),
        {
          headers: storageHeaders(serviceKey)
        }
      );

      const matchingClients = await clientResponse.json();

      if (!matchingClients.length) {
        return json(404, {
          error: "Dossier client introuvable."
        });
      }

      // Récupérer les transactions de ce client uniquement.
      const transactionsURL = new URL(
        base + "/rest/v1/d8_property_transactions"
      );

      transactionsURL.searchParams.set(
        "select",
        "id,client_id,property_id,property_name," +
        "property_address,transaction_type,amount," +
        "agency_fees,agent_commission,agent_discord_id,created_at"
      );

      transactionsURL.searchParams.set(
        "client_id",
        "eq." + clientId
      );

      transactionsURL.searchParams.set(
        "order",
        "created_at.desc"
      );

      transactionsURL.searchParams.set("limit", "100");

      const transactionsResponse = await api(
        transactionsURL.toString(),
        {
          headers: storageHeaders(serviceKey)
        }
      );

      const transactions = await transactionsResponse.json();

      return json(200, {
        ok: true,
        client_id: clientId,
        transactions
      });
    }

// DYNASTY 8 — FINANCES CLIENTS
// Lecture et modification du solde bancaire RP.

if (
  (action === "finance-get" && request.method === "GET") ||
  (action === "finance-update" && request.method === "POST")
) {
  const clientId = String(params.get("id") || "").trim();

  // Vérifier le format de l'identifiant client.
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)
  ) {
    return json(400, {
      error: "Identifiant client invalide."
    });
  }

  // Vérifier que le dossier existe et n'est pas Prestige.
  const clientURL = new URL(
    base + "/rest/v1/d8_client_archives"
  );

  clientURL.searchParams.set(
    "select",
    "id,bank_declared,bank_verified_at"
  );

  clientURL.searchParams.set("id", "eq." + clientId);
  clientURL.searchParams.set("is_prestige", "eq.false");
  clientURL.searchParams.set("limit", "1");

  const clientResponse = await api(
    clientURL.toString(),
    {
      headers: storageHeaders(serviceKey)
    }
  );

  const matchingClients = await clientResponse.json();

  if (!matchingClients.length) {
    return json(404, {
      error: "Dossier client introuvable."
    });
  }

  const client = matchingClients[0];

  // LECTURE DU SOLDE BANCAIRE
  if (action === "finance-get") {
    return json(200, {
      ok: true,
      client_id: clientId,
      bank_declared: client.bank_declared,
      bank_verified_at: client.bank_verified_at
    });
  }

  // MODIFICATION DU SOLDE BANCAIRE
  const contentType =
    request.headers.get("content-type") || "";

  if (
    !contentType.toLowerCase().startsWith("application/json")
  ) {
    return json(415, {
      error: "Le format JSON est obligatoire."
    });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json(400, {
      error: "Données financières invalides."
    });
  }

  // Accepter uniquement un montant positif ou nul,
  // avec deux décimales maximum.
  const rawAmount = String(body?.bank_declared ?? "").trim();

  if (
    !/^\d{1,13}(\.\d{1,2})?$/.test(rawAmount)
  ) {
    return json(400, {
      error:
        "Le solde doit être un montant positif ou nul, " +
        "avec deux décimales maximum."
    });
  }

  const amount = Number(rawAmount);

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 1000000000000
  ) {
    return json(400, {
      error: "Montant bancaire invalide."
    });
  }

  // Enregistrer le solde déclaré.
  const updateURL = new URL(
    base + "/rest/v1/d8_client_archives"
  );

  updateURL.searchParams.set("id", "eq." + clientId);
  updateURL.searchParams.set("is_prestige", "eq.false");

  const updateResponse = await api(
    updateURL.toString(),
    {
      method: "PATCH",
      headers: storageHeaders(serviceKey, {
        "content-type": "application/json",
        Prefer: "return=representation"
      }),
      body: JSON.stringify({
        bank_declared: amount,
        updated_at: new Date().toISOString()
      })
    }
  );

  const updatedClients = await updateResponse.json();

  if (!updatedClients.length) {
    return json(404, {
      error: "Impossible de mettre à jour le dossier."
    });
  }

  return json(200, {
    ok: true,
    message: "Solde bancaire enregistré avec succès.",
    client_id: clientId,
    bank_declared: updatedClients[0].bank_declared
  });
}
   
    // DYNASTY 8 — MODIFICATION DES ARCHIVES CLIENTS
    if (action === "client-update" && request.method === "POST") {
      const clientId = String(params.get("id") || "").trim();

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
        return json(400, { error: "Identifiant client invalide." });
      }

      const contentType = request.headers.get("content-type") || "";

      if (!contentType.toLowerCase().startsWith("application/json")) {
        return json(415, { error: "Format JSON obligatoire." });
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json(400, { error: "Formulaire invalide." });
      }

      const rpName = String(body?.rp_name ?? "").trim();
      const rpPhone = String(body?.rp_phone ?? "").trim();

      if (rpName.length < 2 || rpName.length > 160) {
        return json(400, { error: "Nom RP invalide." });
      }

      if (
        rpPhone.length < 3 ||
        rpPhone.length > 40 ||
        !/^[0-9+(). -]+$/.test(rpPhone)
      ) {
        return json(400, { error: "Téléphone RP invalide." });
      }

      const changes = {
        rp_name: rpName,
        rp_phone: rpPhone,
        updated_at: new Date().toISOString()
      };

      if (isDirection) {
        if (body.client_discord_id !== undefined) {
          const newDiscordId = String(body.client_discord_id).trim();

          if (!validDiscordId(newDiscordId)) {
            return json(400, { error: "ID Discord invalide." });
          }

          const duplicateURL = new URL(
            base + "/rest/v1/d8_client_archives"
          );

          duplicateURL.searchParams.set("select", "id");
          duplicateURL.searchParams.set(
            "client_discord_id",
            "eq." + newDiscordId
          );
          duplicateURL.searchParams.set("id", "neq." + clientId);
          duplicateURL.searchParams.set("limit", "1");

          const duplicateResponse = await api(
            duplicateURL.toString(),
            { headers: storageHeaders(serviceKey) }
          );

          const duplicates = await duplicateResponse.json();

          if (duplicates.length) {
            return json(409, {
              error: "Cet ID Discord appartient déjà à un dossier."
            });
          }

          changes.client_discord_id = newDiscordId;
        }

        if (body.assigned_agent_discord_id !== undefined) {
          const agentId = String(
            body.assigned_agent_discord_id
          ).trim();

          if (!validDiscordId(agentId)) {
            return json(400, {
              error: "Identifiant de l'agent invalide."
            });
          }

          changes.assigned_agent_discord_id = agentId;
        }
      } else if (
        body.client_discord_id !== undefined ||
        body.assigned_agent_discord_id !== undefined
      ) {
        return json(403, {
          error: "Modification réservée à la Direction."
        });
      }

      const updateURL = new URL(
        base + "/rest/v1/d8_client_archives"
      );

      updateURL.searchParams.set("id", "eq." + clientId);
      updateURL.searchParams.set("is_prestige", "eq.false");

      const response = await api(updateURL.toString(), {
        method: "PATCH",
        headers: storageHeaders(serviceKey, {
          "content-type": "application/json",
          Prefer: "return=representation"
        }),
        body: JSON.stringify(changes)
      });

      const updated = await response.json();

      if (!updated.length) {
        return json(404, {
          error: "Dossier classique introuvable."
        });
      }

      return json(200, {
        ok: true,
        message: "Dossier client modifié avec succès.",
        client: updated[0]
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
  "bank_declared,created_at,updated_at"
);

      endpoint.searchParams.set("is_prestige", "eq.false");
      endpoint.searchParams.set("order", "created_at.desc");
      endpoint.searchParams.set("limit", "100");

      const response = await api(endpoint.toString(), {
        headers: storageHeaders(serviceKey)
      });

      const clients = await response.json();
// DYNASTY 8 — Résolution des pseudos Discord des agents
const agentIds = [
  ...new Set(
    clients
      .map(client => client.assigned_agent_discord_id)
      .filter(id => validDiscordId(String(id || "")))
  )
];

const agentNames = {};

await Promise.all(
  agentIds.map(async id => {
    try {
      const response = await fetch(
        "https://discord.com/api/v10/guilds/" +
          GUILD_ID + "/members/" + id,
        {
          headers: {
            authorization: "Bot " + botToken
          }
        }
      );

      if (response.ok) {
        const member = await response.json();

        agentNames[id] =
          member.nick ||
          member.user?.global_name ||
          member.user?.username ||
          id;
      } else {
        agentNames[id] = id;
      }
    } catch {
      agentNames[id] = id;
    }
  })
);

for (const client of clients) {
  const id = client.assigned_agent_discord_id;

  client.assigned_agent_name =
    agentNames[id] || "Non attribué";
}
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
