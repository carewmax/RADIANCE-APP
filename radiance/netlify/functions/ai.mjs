// Netlify Function: server-side bridge to Claude for the patient app's photo observations and Skin & Hair Guide.
// Set ANTHROPIC_API_KEY in Netlify → Site settings → Environment variables. The key never reaches the browser.
// GET  → { configured: boolean }   (the app probes this on load)
// POST { input, images:[{media_type,data}] } → { text, truncated }

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const hits = new Map(); // light per-instance rate limit; use a shared store for production scale

export default async (req) => {
  const key = process.env.ANTHROPIC_API_KEY;
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  if (req.method === "GET") return json({ configured: !!key });
  if (req.method !== "POST") return json({ code: "method" }, 405);
  if (!key) return json({ code: "unavailable", message: "AI isn't configured." }, 503);

  const ip = req.headers.get("x-nf-client-connection-ip") || "anon", now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60_000); recent.push(now); hits.set(ip, recent);
  if (recent.length > 12) return json({ code: "rate_limited" }, 429);

  let body; try { body = await req.json(); } catch { return json({ code: "invalid_request" }, 400); }
  const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
  for (const im of images) {
    if (!/^image\/(jpeg|png|webp)$/.test(im.media_type) || typeof im.data !== "string" || im.data.length * 0.75 > MAX_IMAGE_BYTES) return json({ code: "image_rejected" }, 400);
  }
  // input is either a prompt string or [{role, content}] turns (same shape the page uses inside claude.ai)
  let messages = typeof body.input === "string" ? [{ role: "user", content: body.input }] : Array.isArray(body.input) ? body.input.slice(-20) : null;
  if (!messages?.length || messages.at(-1).role !== "user") return json({ code: "invalid_request" }, 400);
  if (images.length) {
    const last = messages.at(-1);
    messages = [...messages.slice(0, -1), { role: "user", content: [...images.map(i => ({ type: "image", source: { type: "base64", media_type: i.media_type, data: i.data } })), { type: "text", text: String(last.content) }] }];
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: AbortSignal.timeout(55_000),
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1600, messages })
    });
    if (r.status === 429) return json({ code: "rate_limited" }, 429);
    if (!r.ok) return json({ code: "provider_error" }, 502);
    const out = await r.json();
    return json({ text: out.content.filter(c => c.type === "text").map(c => c.text).join(""), truncated: out.stop_reason === "max_tokens" });
  } catch (e) {
    return json({ code: e.name === "TimeoutError" ? "timeout" : "provider_error" }, 504);
  }
};
