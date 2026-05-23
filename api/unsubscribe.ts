import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './_lib/supabase-admin.js';

const SITE_URL = 'https://berniedaily.com';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const rawToken = req.query.token;
  const token = typeof rawToken === 'string' ? rawToken : undefined;

  if (!token) {
    sendHtml(res, 404, notFoundPage());
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('email_reminders')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('email')
    .maybeSingle();

  if (error) {
    console.error('[unsubscribe] db error:', error);
    sendHtml(res, 500, notFoundPage());
    return;
  }

  if (!data) {
    sendHtml(res, 404, notFoundPage());
    return;
  }

  console.log(`[unsubscribe] success for ${data.email}`);
  sendHtml(res, 200, confirmationPage());
}

function sendHtml(res: VercelResponse, status: number, body: string): void {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.status(status).send(body);
}

function shell(title: string, heading: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { margin: 0; background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .card { max-width: 420px; width: 100%; background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; text-align: center; }
  .wordmark { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px; line-height: 1; }
  .eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 3px; color: #e63946; margin-top: 4px; text-transform: uppercase; }
  h1 { font-size: 20px; color: #ffffff; margin: 24px 0 12px; }
  p { font-size: 15px; line-height: 1.5; margin: 0 0 20px; }
  a.btn { display: inline-block; background: #e63946; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 24px; border-radius: 8px; margin-top: 8px; }
</style>
</head>
<body>
  <div class="card">
    <div class="wordmark">BERNIE</div>
    <div class="eyebrow">Daily</div>
    <h1>${heading}</h1>
    ${body}
  </div>
</body>
</html>`;
}

function confirmationPage(): string {
  return shell(
    'Unsubscribed — BERNIE',
    "You're unsubscribed",
    `<p>You won't get daily BERNIE reminder emails anymore.</p>
     <a class="btn" href="${SITE_URL}">Back to BERNIE</a>`,
  );
}

function notFoundPage(): string {
  return shell(
    'Link not found — BERNIE',
    'Link not found',
    `<p>That unsubscribe link is invalid or has already been used. If you're still getting emails, reply to one and we'll sort it out.</p>
     <a class="btn" href="${SITE_URL}">Back to BERNIE</a>`,
  );
}
