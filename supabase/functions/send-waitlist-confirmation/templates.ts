// Branded waitlist confirmation emails.
// Inline CSS only — most email clients ignore <style> blocks.
// Brand: cream #FBF6EE bg, ink #1B1410 text, terracotta #C46A4B accent.
// Voice rules (docs/voice.md): no emoji, confident not cute, tell people
// what to do.

const COLORS = {
  cream: "#FBF6EE",
  ink: "#1B1410",
  mute: "#6B5B53",
  terracotta: "#C46A4B",
  line: "#E8DFD3",
};

type EmailContent = { subject: string; html: string; text: string };

function shell({ preheader, body }: { preheader: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kichana</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.ink};">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.cream};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid ${COLORS.line};border-radius:20px;overflow:hidden;">
      <tr><td style="padding:28px 32px 8px 32px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:-0.5px;color:${COLORS.ink};">Kichana</div>
      </td></tr>
      <tr><td style="padding:8px 32px 32px 32px;font-size:16px;line-height:1.55;color:${COLORS.ink};">
        ${body}
      </td></tr>
    </table>
    <div style="max-width:560px;margin:16px auto 0;font-size:12px;color:${COLORS.mute};line-height:1.5;">
      Kichana — Nairobi, Kenya. You're receiving this because you joined the waitlist.
    </div>
  </td></tr>
</table>
</body>
</html>`;
}

function cta(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr><td style="background:${COLORS.terracotta};border-radius:999px;">
    <a href="${href}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${label}</a>
  </td></tr></table>`;
}

export function customerEmail({ name }: { name: string }): EmailContent {
  const first = name.split(/\s+/)[0] || "there";
  const subject = "You're on the Kichana list — 10% off when we open";
  const html = shell({
    preheader: "Your 10% off your first booking is locked in for launch day.",
    body: `
      <p style="margin:0 0 16px 0;">Hi ${first},</p>
      <p style="margin:0 0 16px 0;">You're on the Kichana waitlist. When we open in Nairobi, you'll get <strong>10% off your first booking</strong> — automatically.</p>
      <p style="margin:0 0 16px 0;">We'll email you the moment bookings open, with a link straight to your code. No app to download. No queue.</p>
      <p style="margin:0 0 16px 0;color:${COLORS.mute};font-size:14px;">In the meantime, follow <a href="https://instagram.com/kichana" style="color:${COLORS.terracotta};text-decoration:none;">@kichana</a> on Instagram for stylist features and launch news.</p>
      ${cta("https://instagram.com/kichana", "Follow on Instagram")}
      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.mute};">— The Kichana team</p>
    `,
  });
  const text = [
    `Hi ${first},`,
    "",
    "You're on the Kichana waitlist. When we open in Nairobi, you'll get 10% off your first booking — automatically.",
    "",
    "We'll email you the moment bookings open.",
    "",
    "Follow @kichana on Instagram for launch news: https://instagram.com/kichana",
    "",
    "— The Kichana team",
  ].join("\n");
  return { subject, html, text };
}

export function stylistEmail({ name }: { name: string }): EmailContent {
  const first = name.split(/\s+/)[0] || "there";
  const subject = "Welcome to Kichana — your launch offer inside";
  const html = shell({
    preheader: "0% commission for 30 days, featured launch placement, and a feature on @kichana.",
    body: `
      <p style="margin:0 0 16px 0;">Hi ${first},</p>
      <p style="margin:0 0 16px 0;">Thanks for joining the Kichana stylist waitlist. Your launch offer is locked in:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px 0;width:100%;">
        <tr><td style="padding:10px 0;border-top:1px solid ${COLORS.line};font-size:15px;"><strong>0% commission</strong> for your first 30 days on the platform.</td></tr>
        <tr><td style="padding:10px 0;border-top:1px solid ${COLORS.line};font-size:15px;"><strong>Featured placement</strong> at launch — front-page exposure to early customers.</td></tr>
        <tr><td style="padding:10px 0;border-top:1px solid ${COLORS.line};border-bottom:1px solid ${COLORS.line};font-size:15px;"><strong>Instagram feature</strong> on <a href="https://instagram.com/kichana" style="color:${COLORS.terracotta};text-decoration:none;">@kichana</a>.</td></tr>
      </table>
      <p style="margin:0 0 16px 0;">We'll reach out shortly to set up your profile, verify your portfolio, and lock in your launch date.</p>
      <p style="margin:0 0 8px 0;color:${COLORS.mute};font-size:14px;">A few things that help us get you launched faster:</p>
      <ul style="margin:0 0 16px 18px;padding:0;color:${COLORS.mute};font-size:14px;line-height:1.6;">
        <li>A public portfolio link (Instagram, TikTok, or a Google Drive of recent work).</li>
        <li>The services you offer and your starting prices.</li>
        <li>Whether you work in a salon, at-home, or both.</li>
      </ul>
      ${cta("https://instagram.com/kichana", "Follow @kichana")}
      <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.mute};">— The Kichana team</p>
    `,
  });
  const text = [
    `Hi ${first},`,
    "",
    "Thanks for joining the Kichana stylist waitlist. Your launch offer is locked in:",
    "",
    "  • 0% commission for your first 30 days.",
    "  • Featured placement at launch.",
    "  • Instagram feature on @kichana.",
    "",
    "We'll reach out shortly to set up your profile, verify your portfolio, and lock in your launch date.",
    "",
    "Helpful to have ready: a public portfolio link, your services and starting prices, and whether you work salon / at-home / both.",
    "",
    "— The Kichana team",
  ].join("\n");
  return { subject, html, text };
}
