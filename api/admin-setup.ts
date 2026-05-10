// One-time admin setup endpoint. Runs the database migration and configures
// auth (disable email confirmation, enable Google OAuth) via the Supabase
// Management API. Token-gated. Will be removed in a follow-up commit.

const SECRET_KEY = "kichana-setup-9F2X8K";
const SBP_TOKEN = "sbp_abcf0c25580073eeadb1caf748cb5daab575ddca";
const PROJECT_REF = "wdqpmyhtyhlwkkdrkjwv";
const GOOGLE_CLIENT_ID = "552945836961-4jcmupilbk56kmo7e63ancfaupk2o5dr.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const SITE_URL = "https://kichana.vercel.app";

const MIGRATION_RAW_URL =
  "https://raw.githubusercontent.com/sylviarutto2-star/kichana/main/supabase/migrations/20260509120000_kichana_v1.sql";

export const config = { runtime: "nodejs" };

// @ts-ignore - Vercel-style handler signature
export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  if (url.searchParams.get("key") !== SECRET_KEY) {
    res.statusCode = 401;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ error: "unauthorized" }));
  }

  const out: any = { steps: [] };

  // 1. Fetch migration SQL
  const sqlRes = await fetch(MIGRATION_RAW_URL);
  if (!sqlRes.ok) {
    out.steps.push({ name: "fetch_migration", ok: false, status: sqlRes.status });
    res.statusCode = 500; res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(out));
  }
  const sql = await sqlRes.text();
  out.steps.push({ name: "fetch_migration", ok: true, bytes: sql.length });

  // 2. Run migration via Supabase Management API
  const dbRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SBP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const dbBody = await dbRes.text();
  out.steps.push({
    name: "apply_migration",
    ok: dbRes.ok,
    status: dbRes.status,
    body: dbBody.slice(0, 800),
  });

  // 3. Configure auth (disable email confirmation + Google OAuth)
  const authRes = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${SBP_TOKEN}`,
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
  const authBody = await authRes.text();
  out.steps.push({
    name: "configure_auth",
    ok: authRes.ok,
    status: authRes.status,
    body: authBody.slice(0, 600),
  });

  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(out, null, 2));
}
