// Cloudflare Pages Functions Edge Handler for MOONCOIN
// Automatically handles all /api/* requests when deployed to Cloudflare Pages!

interface Env {
  TELEGRAM_BOT_TOKEN?: string;
  APP_URL?: string;
  [key: string]: any;
}

interface EventContext<Env, P extends string, Data> {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
}

type PagesFunction<Env = unknown, P extends string = string, Data = Record<string, unknown>> = (
  context: EventContext<Env, P, Data>
) => Response | Promise<Response>;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json',
};

// Response helper
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // Handle pre-flight CORS
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  try {
    // 1. Health check & Config
    if (path === '/api/health') {
      return jsonResponse({ status: 'ok', platform: 'cloudflare-pages-edge', timestamp: Date.now() });
    }

    // 2. Incoming Telegram Webhook Receiver
    if (path === '/api/webhook/telegram' && method === 'POST') {
      const update = await request.json().catch(() => ({})) as any;
      const botToken = env.TELEGRAM_BOT_TOKEN;

      if (update?.message?.chat?.id && botToken) {
        const chatId = update.message.chat.id;
        const text = (update.message.text || '').trim();
        const appUrl = env.APP_URL ? env.APP_URL.replace(/\/$/, '') : `${url.protocol}//${url.host}`;

        if (text.startsWith('/start') || text.startsWith('/play') || text.startsWith('/help')) {
          const welcomeText = 
            `🌕 *Welcome to MOONCOIN!*\\n\\n` +
            `Tap your celestial moon, harvest MoonCoins, construct planetary megastructures, summon rare alien companions, and compete on the global leaderboard!\\n\\n` +
            `🎮 *Launch the game:* [Play MOONCOIN](${appUrl})\\n` +
            `⚡ *Instant tap & idle income running on Cloudflare Pages!*`;

          // Fire-and-forget message reply to Telegram
          fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: welcomeText,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🌕 Play MOONCOIN Mini App',
                      web_app: { url: appUrl },
                    },
                  ],
                  [
                    {
                      text: '📢 Join Community & Leaderboard',
                      url: 'https://t.me/telegram',
                    },
                  ],
                ],
              },
            }),
          }).catch(() => {});
        }
      }

      return jsonResponse({ ok: true });
    }

    // 3. Telegram Webhook Setter
    if (path === '/api/deploy/telegram/set-auto-webhook' && method === 'POST') {
      const body = await request.json().catch(() => ({})) as any;
      const botToken = body.botToken || env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return jsonResponse({ error: 'Missing Telegram Bot Token' }, 400);
      }
      const baseUrl = (body.customBaseUrl || env.APP_URL || `${url.protocol}//${url.host}`).replace(/\/$/, '');
      const webhookUrl = `${baseUrl}/api/webhook/telegram`;

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          drop_pending_updates: body.dropPendingUpdates !== false,
          secret_token: body.secretToken || undefined,
        }),
      });

      const tgData = await tgRes.json();
      return jsonResponse({ ...tgData, webhookUrl, appUrl: baseUrl });
    }

    if (path === '/api/deploy/telegram/webhook-info' && method === 'POST') {
      const body = await request.json().catch(() => ({})) as any;
      const botToken = body.botToken || env.TELEGRAM_BOT_TOKEN;
      if (!botToken) return jsonResponse({ error: 'Missing botToken' }, 400);

      const tgRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getWebhookInfo`);
      const tgData = await tgRes.json();
      return jsonResponse(tgData);
    }

    // 4. Default: return status ok for game endpoints on edge
    return jsonResponse({
      status: 'ok',
      platform: 'cloudflare-pages',
      message: 'MOONCOIN Edge API active',
    });
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Edge function error' }, 500);
  }
};
