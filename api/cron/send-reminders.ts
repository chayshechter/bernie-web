import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { supabaseAdmin } from '../_lib/supabase-admin.js';

const SITE_URL = 'https://berniedaily.com';
const PLAY_URL = `${SITE_URL}/?utm_source=email&utm_medium=reminder&utm_campaign=daily`;
const FROM = 'BERNIE <hello@berniedaily.com>';
const SUBJECT = "Today's BERNIE is live";

// Resend's default API limit is ~2 requests/second. Pace sends below that and
// retry transient failures so no active subscriber is silently skipped.
const SEND_INTERVAL_MS = 600;
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1000;

type Subscriber = {
  email: string;
  unsubscribe_token: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).send('Unauthorized');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await supabaseAdmin
    .from('email_reminders')
    .select('email, unsubscribe_token')
    .is('unsubscribed_at', null);

  if (error) {
    console.error('[cron] failed to query email_reminders:', error);
    res.status(500).json({ error: error.message });
    return;
  }

  const subscribers = (data ?? []) as Subscriber[];
  const attempted = subscribers.map((s) => s.email);
  const succeeded: string[] = [];
  const failures: { email: string; reason: string }[] = [];

  console.log(`[cron] attempting ${subscribers.length} subscribers:`, attempted);

  for (let i = 0; i < subscribers.length; i++) {
    const sub = subscribers[i];
    const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?token=${sub.unsubscribe_token}`;

    let reason = 'unknown error';
    let ok = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await resend.emails.send({
          from: FROM,
          to: sub.email,
          subject: SUBJECT,
          html: renderEmail(unsubscribeUrl),
          text: renderEmailText(unsubscribeUrl),
        });
        if (result.error) {
          reason = `${result.error.name}: ${result.error.message}`;
          console.warn(`[cron] attempt ${attempt}/${MAX_ATTEMPTS} failed for ${sub.email}: ${reason}`);
          if (attempt < MAX_ATTEMPTS) await sleep(RETRY_BACKOFF_MS * attempt);
          continue;
        }
        ok = true;
        console.log(`[cron] sent to ${sub.email} (id=${result.data?.id}, attempt=${attempt})`);
        break;
      } catch (e) {
        reason = e instanceof Error ? e.message : String(e);
        console.warn(`[cron] attempt ${attempt}/${MAX_ATTEMPTS} threw for ${sub.email}: ${reason}`);
        if (attempt < MAX_ATTEMPTS) await sleep(RETRY_BACKOFF_MS * attempt);
      }
    }

    if (ok) {
      succeeded.push(sub.email);
    } else {
      failures.push({ email: sub.email, reason });
      console.error(`[cron] gave up on ${sub.email} after ${MAX_ATTEMPTS} attempts: ${reason}`);
    }

    // Pace sends to stay under Resend's ~2 req/s limit.
    if (i < subscribers.length - 1) await sleep(SEND_INTERVAL_MS);
  }

  console.log('[cron] summary:', JSON.stringify({
    total: subscribers.length,
    sent: succeeded,
    failed: failures,
  }));

  res.status(200).json({
    total: subscribers.length,
    sent: succeeded.length,
    failed: failures.length,
    failures,
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
              <a href="${PLAY_URL}" style="display:inline-block;background:#e63946;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:8px;">Play today's BERNIE</a>
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
    `Play today's BERNIE: ${PLAY_URL}`,
    '',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');
}
