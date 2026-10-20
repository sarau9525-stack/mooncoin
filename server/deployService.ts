import fs from 'fs';
import path from 'path';

// --- GITHUB REPOSITORY SYNC & AUTOMATION ---

export async function testGitHubToken(token: string): Promise<{
  valid: boolean;
  username?: string;
  name?: string;
  avatar_url?: string;
  error?: string;
}> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'PocketPlanet-Cloudflare-Deployer',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { valid: false, error: err.message || `GitHub error: HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      valid: true,
      username: data.login,
      name: data.name || data.login,
      avatar_url: data.avatar_url,
    };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Connection failed' };
  }
}

// Collect relevant project files to push to GitHub
function getFilesRecursively(dir: string, baseDir: string = dir): { relativePath: string; fullPath: string }[] {
  const results: { relativePath: string; fullPath: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const ignoredDirs = new Set(['node_modules', '.git', 'dist', '.vite', '.aistudio', '.next']);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        results.push(...getFilesRecursively(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      // Don't commit data json with local state or secrets
      if (!relativePath.startsWith('data/') && !relativePath.endsWith('.log') && entry.name !== '.env') {
        results.push({ relativePath, fullPath });
      }
    }
  }

  return results;
}

export async function pushProjectToGitHub(params: {
  token: string;
  repoName: string;
  isPrivate?: boolean;
  commitMessage?: string;
}): Promise<{
  success: boolean;
  repoUrl?: string;
  filesCommitted?: number;
  error?: string;
}> {
  const token = params.token.trim();
  const rawRepo = params.repoName.trim();
  const commitMessage = params.commitMessage || 'Automated MOONCOIN sync for Cloudflare Pages deployment';

  const userTest = await testGitHubToken(token);
  if (!userTest.valid || !userTest.username) {
    return { success: false, error: userTest.error || 'Invalid GitHub token' };
  }

  const username = userTest.username;
  const cleanRepoName = rawRepo.includes('/') ? rawRepo.split('/')[1] : rawRepo;
  const targetOwner = rawRepo.includes('/') ? rawRepo.split('/')[0] : username;

  // 1. Check if repo exists, create if missing
  const checkRes = await fetch(`https://api.github.com/repos/${targetOwner}/${cleanRepoName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'MOONCOIN-Cloudflare-Deployer',
    },
  });

  let repoData: any;
  if (checkRes.status === 404) {
    // Create new repository
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'MOONCOIN-Cloudflare-Deployer',
      },
      body: JSON.stringify({
        name: cleanRepoName,
        description: 'MOONCOIN - Telegram Mini App & Standalone Web Game with automated Cloudflare Pages deployment',
        private: Boolean(params.isPrivate),
        auto_init: true,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      return { success: false, error: `Could not create repo: ${err.message || createRes.statusText}` };
    }
    repoData = await createRes.json();
    // Brief sleep to let GitHub initialize the default branch
    await new Promise((r) => setTimeout(r, 1200));
  } else if (checkRes.ok) {
    repoData = await checkRes.json();
  } else {
    return { success: false, error: `GitHub error checking repo: ${checkRes.statusText}` };
  }

  // 2. Read local project files
  const rootDir = process.cwd();
  const files = getFilesRecursively(rootDir);

  let committedCount = 0;

  // Commit each file to GitHub via Contents API
  for (const file of files) {
    try {
      const content = fs.readFileSync(file.fullPath, 'base64');

      // Check if file already exists to get its SHA
      const getFileRes = await fetch(
        `https://api.github.com/repos/${targetOwner}/${cleanRepoName}/contents/${file.relativePath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'PocketPlanet-Cloudflare-Deployer',
          },
        }
      );

      let sha: string | undefined;
      if (getFileRes.ok) {
        const existingData = await getFileRes.json();
        sha = existingData.sha;
      }

      const putRes = await fetch(
        `https://api.github.com/repos/${targetOwner}/${cleanRepoName}/contents/${file.relativePath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'PocketPlanet-Cloudflare-Deployer',
          },
          body: JSON.stringify({
            message: `${commitMessage}: ${file.relativePath}`,
            content,
            sha,
          }),
        }
      );

      if (putRes.ok) {
        committedCount++;
      }
    } catch (err) {
      console.warn(`Error uploading ${file.relativePath}:`, err);
    }
  }

  return {
    success: true,
    repoUrl: repoData.html_url || `https://github.com/${targetOwner}/${cleanRepoName}`,
    filesCommitted: committedCount,
  };
}

// --- TELEGRAM WEBHOOK AUTOMATION ---

export async function setTelegramWebhook(params: {
  botToken: string;
  webhookUrl: string;
  secretToken?: string;
  dropPendingUpdates?: boolean;
}): Promise<{
  ok: boolean;
  result?: boolean;
  description?: string;
}> {
  const token = params.botToken.trim();
  const url = params.webhookUrl.trim();

  try {
    const body: Record<string, any> = {
      url,
      drop_pending_updates: Boolean(params.dropPendingUpdates),
    };
    if (params.secretToken && params.secretToken.trim()) {
      body.secret_token = params.secretToken.trim();
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { ok: false, description: err.message || 'Network error reaching Telegram API' };
  }
}

export async function getTelegramWebhookInfo(botToken: string): Promise<{
  ok: boolean;
  result?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
    ip_address?: string;
  };
  description?: string;
}> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/getWebhookInfo`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { ok: false, description: err.message || 'Network error reaching Telegram API' };
  }
}

export async function deleteTelegramWebhook(botToken: string): Promise<{
  ok: boolean;
  result?: boolean;
  description?: string;
}> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/deleteWebhook`, {
      method: 'POST',
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { ok: false, description: err.message || 'Network error reaching Telegram API' };
  }
}
