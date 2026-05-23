import { Resend } from 'resend';
import { supabaseAdmin } from '../_lib/supabase-admin';

const SITE_URL = 'https://berniedaily.com';
const FROM = 'BERNIE <hello@berniedaily.com>';
const SUBJECT = "Today's BERNIE is live";

type Subscriber = {
  email: string;
  unsubscribe_token: string;
};

export default async function handler(req: Request): Promise<Response> {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await supabaseAdmin
    .from('email_reminders')
    .select('email, unsubscribe_token')
    .is('unsubscribed_at', null);

  if (error) {
    console.error('[cron] failed to query email_reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const subscribers = (data ?? []) as Subscriber[];
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${sub.unsubscribe_token}`;
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: sub.email,
        subject: SUBJECT,
        html: renderEmail(unsubscribeUrl),
        text: renderEmailText(unsubscribeUrl),
      });
      if (result.error) {
        console.error(`[cron] resend error for ${sub.email}:`, result.error);
        failed++;
      } else {
        console.log(`[cron] sent to ${sub.email} (id=${result.data?.id})`);
        sent++;
      }
    } catch (e) {
      console.error(`[cron] exception sending to ${sub.email}:`, e);
      failed++;
    }
  }

  const summary = { total: subscribers.length, sent, failed };
  console.log('[cron] summary:', summary);

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function renderEmail(unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d1117;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:32px;">
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <div style="font-size:32px;font-weight:900;letter-spacing:-1px;color:#ffffff;line-height:1;">BERNIE</div>
              <div style="font-size:11px;font-weight:600;letter-spacing:3px;color:#e63946;margin-top:4px;text-transform:uppercase;">Daily</div>
            </td>
          </tr>
          <tr>
            <td style="color:#c9d1d9;font-size:16px;line-height:1.5;padding-bottom:28px;">
              A new BERNIE puzzle is live. Take a guess at today's car and see how close you can get.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <a href="${SITE_URL}" style="display:inline-block;background:#e63946;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:8px;">Play today's BERNIE</a>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;margin-top:24px;">
          <tr>
            <td style="text-align:center;color:#8b949e;font-size:12px;line-height:1.5;">
              You're getting this because you signed up for daily reminders.<br/>
              <a href="${unsubscribeUrl}" style="color:#8b949e;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderEmailText(unsubscribeUrl: string): string {
  return [
    "A new BERNIE puzzle is live.",
    '',
    `Play today's BERNIE: ${SITE_URL}`,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');
}
