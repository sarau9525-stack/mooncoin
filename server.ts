import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { gameStorage } from './server/storage';
import { validateTelegramInitData } from './server/telegramAuth';
import {
  ALIENS_CONFIG,
  BUILDINGS_CONFIG,
  DAILY_LOGIN_REWARDS,
  PLANET_STAGES,
  PLANET_WORLDS,
} from './src/config/gameConfig';
import {
  testGitHubToken,
  pushProjectToGitHub,
  setTelegramWebhook,
  getTelegramWebhookInfo,
  deleteTelegramWebhook,
} from './server/deployService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// --- TELEGRAM & GUEST AUTHENTICATION ---

app.post('/api/auth/telegram', (req, res) => {
  try {
    const { initData, referrerCode } = req.body;
    if (!initData) {
      return res.status(400).json({ error: 'Missing initData parameter' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const validation = validateTelegramInitData(initData, botToken);

    if (!validation.isValid || !validation.user) {
      return res.status(401).json({ error: 'Invalid Telegram authentication signature' });
    }

    const tgUser = validation.user;
    const username = tgUser.username || `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`;

    const { user, isNew } = gameStorage.getOrCreateUser({
      telegramId: tgUser.id,
      username,
      avatarSeed: `tg_${tgUser.id}`,
      referrerCode,
    });

    return res.json({
      user,
      isNew,
      isTelegram: true,
      telegramUser: tgUser,
      isSimulated: validation.isSimulated,
    });
  } catch (err: any) {
    console.error('Telegram auth error:', err);
    return res.status(500).json({ error: err.message || 'Authentication failed' });
  }
});

app.post('/api/auth/guest', (req, res) => {
  try {
    const { username, avatarSeed, referrerCode, existingUserId } = req.body;

    if (existingUserId) {
      const existing = gameStorage.getUser(existingUserId);
      if (existing) {
        return res.json({ user: existing, isNew: false });
      }
    }

    const { user, isNew } = gameStorage.getOrCreateUser({
      username,
      avatarSeed,
      isGuest: true,
      referrerCode,
    });

    return res.json({ user, isNew });
  } catch (err: any) {
    console.error('Guest auth error:', err);
    return res.status(500).json({ error: err.message || 'Guest login failed' });
  }
});

// --- USER SYNC & PROFILE ---

app.get('/api/game/me', (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.headers.authorization?.replace('Bearer ', ''));
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing userId' });
    }

    const user = gameStorage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Player profile not found' });
    }

    const missions = gameStorage.getMissions(userId);
    return res.json({ user, missions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- CORE GAMEPLAY ACTIONS ---

app.post('/api/game/tap', (req, res) => {
  try {
    const { userId, count } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const result = gameStorage.processTap(userId, count || 1);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/upgrade/building', (req, res) => {
  try {
    const { userId, buildingId } = req.body;
    if (!userId || !buildingId) {
      return res.status(400).json({ error: 'Missing userId or buildingId' });
    }

    const result = gameStorage.purchaseBuilding(userId, buildingId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/upgrade/tap', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const result = gameStorage.upgradeTapPower(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/upgrade/energy', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const result = gameStorage.upgradeEnergyCapacity(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/evolve', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const result = gameStorage.evolvePlanetStage(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/aliens/summon', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const result = gameStorage.summonAlien(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/game/daily-reward', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const result = gameStorage.claimDailyReward(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/missions', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const missions = gameStorage.getMissions(userId);
    return res.json({ missions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/missions/claim', (req, res) => {
  try {
    const { userId, missionId } = req.body;
    if (!userId || !missionId) return res.status(400).json({ error: 'Missing userId or missionId' });

    const result = gameStorage.claimMissionReward(userId, missionId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaderboard', (_req, res) => {
  try {
    const leaderboard = gameStorage.getLeaderboard();
    return res.json({ leaderboard });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/public', (req, res) => {
  try {
    const profile = gameStorage.getPublicProfile(req.params.userId);
    if (!profile) return res.status(404).json({ error: 'Player not found' });
    return res.json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/config', (_req, res) => {
  return res.json({
    stages: PLANET_STAGES,
    buildings: BUILDINGS_CONFIG,
    aliens: ALIENS_CONFIG,
    dailyRewards: DAILY_LOGIN_REWARDS,
    worlds: PLANET_WORLDS,
  });
});

// --- GITHUB & CLOUDFLARE AUTOMATED DEPLOYMENT ROUTES ---

app.post('/api/deploy/github/test-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing GitHub token' });
    const result = await testGitHubToken(token);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/deploy/github/push', async (req, res) => {
  try {
    const { token, repoName, isPrivate, commitMessage } = req.body;
    if (!token || !repoName) {
      return res.status(400).json({ error: 'Missing token or repoName' });
    }
    const result = await pushProjectToGitHub({
      token,
      repoName,
      isPrivate,
      commitMessage,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- TELEGRAM WEBHOOK AUTOMATION ROUTES ---

app.post('/api/deploy/telegram/set-webhook', async (req, res) => {
  try {
    const { botToken, webhookUrl, secretToken, dropPendingUpdates } = req.body;
    if (!botToken || !webhookUrl) {
      return res.status(400).json({ error: 'Missing botToken or webhookUrl' });
    }
    const result = await setTelegramWebhook({
      botToken,
      webhookUrl,
      secretToken,
      dropPendingUpdates,
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Auto-detect current app endpoint and set Telegram Webhook
app.post('/api/deploy/telegram/set-auto-webhook', async (req, res) => {
  try {
    const { botToken, secretToken, dropPendingUpdates, customBaseUrl } = req.body;
    if (!botToken) {
      return res.status(400).json({ error: 'Missing Telegram Bot Token' });
    }

    // Determine current app base URL automatically
    let baseUrl = customBaseUrl ? customBaseUrl.trim().replace(/\/$/, '') : '';
    if (!baseUrl) {
      if (process.env.APP_URL) {
        baseUrl = process.env.APP_URL.replace(/\/$/, '');
      } else {
        const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
        const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
        baseUrl = `${proto}://${host}`;
      }
    }

    const webhookUrl = `${baseUrl}/api/webhook/telegram`;

    const result = await setTelegramWebhook({
      botToken,
      webhookUrl,
      secretToken,
      dropPendingUpdates: dropPendingUpdates !== false,
    });

    return res.json({
      ...result,
      webhookUrl,
      appUrl: baseUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/deploy/telegram/webhook-info', async (req, res) => {
  try {
    const { botToken } = req.body;
    if (!botToken) return res.status(400).json({ error: 'Missing botToken' });
    const result = await getTelegramWebhookInfo(botToken);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/deploy/telegram/delete-webhook', async (req, res) => {
  try {
    const { botToken } = req.body;
    if (!botToken) return res.status(400).json({ error: 'Missing botToken' });
    const result = await deleteTelegramWebhook(botToken);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- INCOMING TELEGRAM WEBHOOK RECEIVER ---

app.post('/api/webhook/telegram', async (req, res) => {
  try {
    const update = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Acknowledge Telegram webhook quickly
    res.status(200).json({ ok: true });

    if (!update || !update.message) return;

    const message = update.message;
    const chatId = message.chat?.id;
    const text = (message.text || '').trim();

    if (!chatId) return;

    // If bot token is available, reply to /start or /play commands
    if (botToken) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
      const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : `${proto}://${host}`;

      if (text.startsWith('/start') || text.startsWith('/play') || text.startsWith('/help')) {
        const welcomeText = 
          `🌕 *Welcome to MOONCOIN!*\n\n` +
          `Tap your celestial moon, harvest MoonCoins, construct planetary mega-structures, ` +
          `hatch rare alien companions, and rule the galaxy leaderboard!\n\n` +
          `👇 Tap below to launch MOONCOIN in Telegram:`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
                    text: '🌕 Launch MOONCOIN',
                    web_app: { url: appUrl },
                  },
                ],
                [
                  {
                    text: '🌐 Open Web Game',
                    url: appUrl,
                  },
                ],
              ],
            },
          }),
        }).catch((e) => console.warn('Telegram reply error:', e.message));
      }
    }
  } catch (err: any) {
    console.error('Error handling Telegram webhook:', err);
    if (!res.headersSent) {
      res.status(200).json({ ok: true });
    }
  }
});

// --- ADMIN MANAGEMENT ROUTES ---

app.get('/api/admin/users', (_req, res) => {
  try {
    const data = gameStorage.getAllUsersAdmin();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:userId/adjust', (req, res) => {
  try {
    const { userId } = req.params;
    const adjustments = req.body;
    const result = gameStorage.adminAdjustUser(userId, adjustments);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const result = gameStorage.adminDeleteUser(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/broadcast', (req, res) => {
  try {
    const { cosmicEnergy, stardust } = req.body;
    const result = gameStorage.adminBroadcastReward({ cosmicEnergy, stardust });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/create', (req, res) => {
  try {
    const { username, cosmicEnergy, stardust, planetLevel } = req.body;
    const result = gameStorage.adminCreateUser({
      username,
      cosmicEnergy: cosmicEnergy ? Number(cosmicEnergy) : 0,
      stardust: stardust !== undefined ? Number(stardust) : 50,
      planetLevel: planetLevel ? Number(planetLevel) : 1,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- VITE DEV MIDDLEWARE OR STATIC PRODUCTION SERVING ---

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pocket Planet server is actively running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Pocket Planet server:', err);
  process.exit(1);
});
