const allowedOrigin = "https://ribeiroparauapebas.simulead.com.br";
const downstreamUrl = "https://traffic-api.hurtzcompany.com/api/flow/inbound/1cd16dbb-722b-4add-ae0a-d6346b728ae5/2oo4x1dpuyosnDHsMkDCvGNrZSYTcFqy";
const pixelId = "561285766391551";

const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
};

const response = (body, status = 200) => new Response(body, { status, headers: corsHeaders });

const normalizePhone = (value) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
};

const sha256 = async (value) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sendCapiLead = async (request, env, lead) => {
  const userData = {
    ph: [await sha256(normalizePhone(lead.whatsapp))],
    fbp: lead.fbp || undefined,
    fbc: lead.fbc || undefined,
    client_ip_address: request.headers.get("CF-Connecting-IP") || undefined,
    client_user_agent: request.headers.get("User-Agent") || undefined,
  };

  const capiResponse = await fetch(
    `https://graph.facebook.com/v24.0/${pixelId}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: lead.eventId,
          action_source: "website",
          event_source_url: request.headers.get("Referer") || allowedOrigin,
          user_data: userData,
          custom_data: { interest: lead.interest },
        }],
      }),
    },
  );

  await env.DB.prepare(
    "UPDATE leads SET capi_status = ?, capi_response_status = ? WHERE event_id = ?",
  ).bind(capiResponse.ok ? "sent" : "failed", capiResponse.status, lead.eventId).run();

  if (!capiResponse.ok) {
    console.error("Meta CAPI rejected Lead event", capiResponse.status, await capiResponse.text());
  }
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return response(null, 204);
    if (request.method !== "POST") return response("Method Not Allowed", 405);
    if (request.headers.get("Origin") !== allowedOrigin) return new Response("Forbidden", { status: 403 });
    if (Number(request.headers.get("Content-Length") || 0) > 512 * 1024) return response("Payload too large", 413);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return response("Invalid JSON", 400);
    }

    const submittedAt = String(payload["Data de Entrada"] || "").trim();
    const fullName = String(payload["Nome Completo"] || "").trim();
    const whatsapp = String(payload.WhatsApp || "").trim();
    const interest = String(payload.Interesse || "").trim();
    const eventId = String(payload.event_id || crypto.randomUUID()).trim();
    const fbp = String(payload.fbp || "").trim();
    const fbc = String(payload.fbc || "").trim();
    if (!submittedAt || !fullName || !whatsapp || !interest) return response("Missing required lead fields", 400);

    const insertResult = await env.DB.prepare(
      "INSERT OR IGNORE INTO leads (submitted_at, full_name, whatsapp, interest, event_id, capi_status) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(submittedAt, fullName, whatsapp, interest, eventId, "pending").run();

    if (!insertResult.meta.changes) return response(JSON.stringify({ success: true, duplicate: true }), 200);

    const downstreamPayload = {
      "Data de Entrada": submittedAt,
      "Nome Completo": fullName,
      WhatsApp: whatsapp,
      Interesse: interest,
    };

    ctx.waitUntil(Promise.all([
      fetch(downstreamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(downstreamPayload),
      }),
      sendCapiLead(request, env, { whatsapp, interest, eventId, fbp, fbc }),
    ]));

    return response(JSON.stringify({ success: true }), 201);
  },
};
