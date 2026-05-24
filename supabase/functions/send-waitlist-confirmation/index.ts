// Sends a branded confirmation email when someone joins the waitlist.
// Invoked from src/pages/Waitlist.tsx after a successful insert.
//
// Required secret in production:
//   RESEND_API_KEY   (re_...)
//
// When the key is missing, returns { ok: true, skipped: true } so dev
// environments (and the demo Vercel preview) don't error.

import { customerEmail, stylistEmail } from "./templates.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM = "Kichana <hello@kichana.co.ke>";
const REPLY_TO = "hello@kichana.co.ke";

type Role = "customer" | "stylist";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { role, email, full_name } = await req.json();

    if (role !== "customer" && role !== "stylist") {
      return json({ error: "role must be 'customer' or 'stylist'" }, 400);
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return json({ error: "valid email required" }, 400);
    }
    if (typeof full_name !== "string" || full_name.trim().length < 2) {
      return json({ error: "full_name required" }, 400);
    }

    const KEY = Deno.env.get("RESEND_API_KEY");
    if (!KEY) {
      console.log("[send-waitlist-confirmation] RESEND_API_KEY not set; skipping send");
      return json({ ok: true, skipped: true });
    }

    const template = (role as Role) === "stylist"
      ? stylistEmail({ name: full_name })
      : customerEmail({ name: full_name });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: REPLY_TO,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[send-waitlist-confirmation] resend error", res.status, body);
      return json({ error: "Resend send failed", details: body }, 502);
    }

    return json({ ok: true, id: body.id ?? null });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
