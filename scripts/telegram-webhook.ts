#!/usr/bin/env node
/**
 * Telegram Bot Webhook Management Script
 * 
 * Usage:
 *   npx tsx scripts/telegram-webhook.ts set [BOT_TOKEN] [WEBHOOK_URL] [SECRET_TOKEN]
 *   npx tsx scripts/telegram-webhook.ts info [BOT_TOKEN]
 *   npx tsx scripts/telegram-webhook.ts delete [BOT_TOKEN]
 * 
 * Environment variables supported:
 *   TELEGRAM_BOT_TOKEN (or BOT_TOKEN)
 *   APP_URL (used as default base for /api/webhook/telegram)
 */

import dotenv from 'dotenv';
dotenv.config();

const command = process.argv[2] || 'info';
const tokenArg = process.argv[3];
const urlArg = process.argv[4];
const secretArg = process.argv[5];

const botToken = tokenArg || process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

function printUsage() {
  console.log(`
🪐 Pocket Planet — Telegram Bot Webhook Manager

Usage:
  npx tsx scripts/telegram-webhook.ts set <BOT_TOKEN> [WEBHOOK_URL] [SECRET_TOKEN]
  npx tsx scripts/telegram-webhook.ts info [BOT_TOKEN]
  npx tsx scripts/telegram-webhook.ts delete [BOT_TOKEN]

Examples:
  npx tsx scripts/telegram-webhook.ts set 123456:ABC-DEF https://my-app.run.app/api/webhook/telegram
  npx tsx scripts/telegram-webhook.ts info 123456:ABC-DEF
  npx tsx scripts/telegram-webhook.ts delete 123456:ABC-DEF
`);
}

async function setWebhook(token: string, targetUrl: string, secretToken?: string) {
  console.log(`\n📡 Setting Telegram Webhook to: ${targetUrl}`);
  try {
    const payload: Record<string, any> = {
      url: targetUrl,
      drop_pending_updates: true,
      allowed_updates: ['message', 'callback_query'],
    };
    if (secretToken) {
      payload.secret_token = secretToken;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Webhook successfully set!');
      console.log(`ℹ️  Description: ${data.description || 'Webhook was set'}`);
      await getWebhookInfo(token);
    } else {
      console.error('❌ Failed to set webhook:');
      console.error(`   Error code: ${data.error_code}`);
      console.error(`   Description: ${data.description}`);
    }
  } catch (err: any) {
    console.error('❌ Network error communicating with Telegram API:', err.message);
  }
}

async function getWebhookInfo(token: string) {
  console.log('\n🔍 Fetching current Telegram Webhook info...');
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();

    if (data.ok) {
      const info = data.result;
      console.log('--------------------------------------------------');
      console.log(`🌐 Current Webhook URL:     ${info.url ? info.url : '(none configured)'}`);
      console.log(`🔐 Has Custom Certificate:  ${info.has_custom_certificate ? 'Yes' : 'No'}`);
      console.log(`📬 Pending Updates Count:    ${info.pending_update_count}`);
      if (info.ip_address) {
        console.log(`📍 Telegram Server IP:       ${info.ip_address}`);
      }
      if (info.last_error_date) {
        const errorDate = new Date(info.last_error_date * 1000).toISOString();
        console.log(`⚠️  Last Error Date:         ${errorDate}`);
        console.log(`⚠️  Last Error Message:      ${info.last_error_message}`);
      } else {
        console.log('✨ Health Status:            Healthy (no recent errors)');
      }
      console.log('--------------------------------------------------');
    } else {
      console.error('❌ Failed to retrieve webhook info:');
      console.error(`   Error code: ${data.error_code}`);
      console.error(`   Description: ${data.description}`);
    }
  } catch (err: any) {
    console.error('❌ Network error communicating with Telegram API:', err.message);
  }
}

async function deleteWebhook(token: string) {
  console.log('\n🗑️  Deleting Telegram Webhook...');
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: true }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Webhook deleted successfully!');
      console.log('🤖 Bot is now restored to getUpdates long-polling mode.');
    } else {
      console.error('❌ Failed to delete webhook:');
      console.error(`   Error code: ${data.error_code}`);
      console.error(`   Description: ${data.description}`);
    }
  } catch (err: any) {
    console.error('❌ Network error communicating with Telegram API:', err.message);
  }
}

async function main() {
  if (!botToken) {
    console.error('❌ Missing Telegram Bot Token.');
    console.error('   Please provide it as an argument or set TELEGRAM_BOT_TOKEN in .env\n');
    printUsage();
    process.exit(1);
  }

  switch (command.toLowerCase()) {
    case 'set': {
      let targetUrl = urlArg;
      if (!targetUrl) {
        if (process.env.APP_URL) {
          const base = process.env.APP_URL.replace(/\/$/, '');
          targetUrl = `${base}/api/webhook/telegram`;
        } else {
          console.error('❌ Missing Webhook URL.');
          console.error('   Please specify a URL or define APP_URL in .env');
          printUsage();
          process.exit(1);
        }
      }
      await setWebhook(botToken, targetUrl, secretArg);
      break;
    }
    case 'info':
    case 'status': {
      await getWebhookInfo(botToken);
      break;
    }
    case 'delete':
    case 'remove': {
      await deleteWebhook(botToken);
      break;
    }
    default:
      printUsage();
      break;
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
