// One-shot: enable Google OAuth + disable email confirmation in Supabase.
// Token passed via query so nothing sensitive is baked into the deployment.

const SECRET_KEY = "kichana-fix-9F2X8K";
const PROJECT_REF = "wdqpmyhtyhlwkkdrkjwv";
const GOOGLE_CLIENT_ID = "552945836961-4jcmupilbk56kmo7e63ancfaupk2o5dr.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const SITE_URL = "https://kichana.vercel.app";

export const config = { runtime: "nodejs" };

// @ts-ignore
export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  if (url.searchParams.get("key") !== SECRET_KEY) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ error: "unauthorized" }));
  }
  const token = url.searchParams.get("token");
  if (!token || !token.startsWith("sbp_")) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ error: "missing or invalid token (expected ?token=sbp_...)" }));
  }

  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mailer_autoconfirm: true,
      external_email_enabled: true,
      external_google_enabled: true,
      external_google_client_id: GOOGLE_CLIENT_ID,
      external_google_secret: GOOGLE_CLIENT_SECRET,
      site_url: SITE_URL,
      uri_allow_list: `${SITE_URL},${SITE_URL}/**,http://localhost:8080,http://localhost:8080/**`,
    }),
  });
  const body = await r.text();

  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ ok: r.ok, status: r.status, body: body.slice(0, 2000) }, null, 2));
}
