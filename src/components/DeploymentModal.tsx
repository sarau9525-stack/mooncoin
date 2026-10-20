import React, { useState } from 'react';
import {
  Github,
  Cloud,
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  Key,
  Globe,
  Radio,
  X,
  FileCode2,
} from 'lucide-react';

interface DeploymentModalProps {
  onClose: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'github' | 'telegram'>('github');

  // GitHub Sync State
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('mooncoin');
  const [isPrivate, setIsPrivate] = useState(false);
  const [testingToken, setTestingToken] = useState(false);
  const [pushingRepo, setPushingRepo] = useState(false);
  const [gitUser, setGitUser] = useState<{ username: string; name: string; avatar_url: string } | null>(null);
  const [gitStatus, setGitStatus] = useState<{ success?: boolean; message?: string; repoUrl?: string; files?: number } | null>(null);

  // Telegram Webhook State
  const [botToken, setBotToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(
    typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/telegram` : ''
  );
  const [secretToken, setSecretToken] = useState('');
  const [dropPending, setDropPending] = useState(true);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<{
    success?: boolean;
    message?: string;
    info?: any;
  } | null>(null);

  // Test GitHub Token
  const handleTestGitHub = async () => {
    if (!githubToken.trim()) {
      setGitStatus({ success: false, message: 'Please enter your GitHub Personal Access Token' });
      return;
    }
    setTestingToken(true);
    setGitStatus(null);
    try {
      const res = await fetch('/api/deploy/github/test-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken }),
      });
      const data = await res.json();
      if (data.valid) {
        setGitUser({ username: data.username, name: data.name, avatar_url: data.avatar_url });
        setGitStatus({ success: true, message: `Connected as @${data.username}` });
      } else {
        setGitStatus({ success: false, message: data.error || 'Invalid token' });
      }
    } catch (err: any) {
      setGitStatus({ success: false, message: err.message || 'Connection failed' });
    } finally {
      setTestingToken(false);
    }
  };

  // Push to GitHub
  const handlePushGitHub = async () => {
    if (!githubToken.trim() || !repoName.trim()) {
      setGitStatus({ success: false, message: 'Please enter both GitHub Token and Repository Name' });
      return;
    }
    setPushingRepo(true);
    setGitStatus(null);
    try {
      const res = await fetch('/api/deploy/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken,
          repoName,
          isPrivate,
          commitMessage: 'Automated Pocket Planet sync with Cloudflare Pages CI/CD',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGitStatus({
          success: true,
          message: `Successfully pushed ${data.filesCommitted} files!`,
          repoUrl: data.repoUrl,
          files: data.filesCommitted,
        });
      } else {
        setGitStatus({ success: false, message: data.error || 'Push failed' });
      }
    } catch (err: any) {
      setGitStatus({ success: false, message: err.message || 'Push failed' });
    } finally {
      setPushingRepo(false);
    }
  };

  // Auto-set Telegram Webhook to current app endpoint automatically
  const handleSetAutoWebhook = async () => {
    if (!botToken.trim()) {
      setWebhookStatus({ success: false, message: 'Please enter your Telegram Bot Token from @BotFather' });
      return;
    }
    setWebhookLoading(true);
    setWebhookStatus(null);
    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const res = await fetch('/api/deploy/telegram/set-auto-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken,
          secretToken,
          dropPendingUpdates: dropPending,
          customBaseUrl: currentOrigin,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookUrl(data.webhookUrl);
        setWebhookStatus({
          success: true,
          message: `Webhook successfully bound to: ${data.webhookUrl}`,
          info: { url: data.webhookUrl },
        });
      } else {
        setWebhookStatus({ success: false, message: data.description || 'Failed to auto-set webhook' });
      }
    } catch (err: any) {
      setWebhookStatus({ success: false, message: err.message || 'Auto-set webhook failed' });
    } finally {
      setWebhookLoading(false);
    }
  };

  // Set Telegram Webhook manually
  const handleSetWebhook = async () => {
    if (!botToken.trim() || !webhookUrl.trim()) {
      setWebhookStatus({ success: false, message: 'Please enter both Bot Token and Webhook URL' });
      return;
    }
    setWebhookLoading(true);
    setWebhookStatus(null);
    try {
      const res = await fetch('/api/deploy/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken,
          webhookUrl,
          secretToken,
          dropPendingUpdates: dropPending,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookStatus({ success: true, message: data.description || 'Webhook successfully configured in Telegram!' });
      } else {
        setWebhookStatus({ success: false, message: data.description || 'Failed to set webhook' });
      }
    } catch (err: any) {
      setWebhookStatus({ success: false, message: err.message || 'Failed to set webhook' });
    } finally {
      setWebhookLoading(false);
    }
  };

  // Get Telegram Webhook Info
  const handleGetWebhookInfo = async () => {
    if (!botToken.trim()) {
      setWebhookStatus({ success: false, message: 'Please enter your Bot Token first' });
      return;
    }
    setWebhookLoading(true);
    try {
      const res = await fetch('/api/deploy/telegram/webhook-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookStatus({
          success: true,
          message: data.result?.url ? `Active webhook: ${data.result.url}` : 'No active webhook set',
          info: data.result,
        });
      } else {
        setWebhookStatus({ success: false, message: data.description || 'Error getting webhook info' });
      }
    } catch (err: any) {
      setWebhookStatus({ success: false, message: err.message });
    } finally {
      setWebhookLoading(false);
    }
  };

  // Delete Telegram Webhook
  const handleDeleteWebhook = async () => {
    if (!botToken.trim()) {
      setWebhookStatus({ success: false, message: 'Please enter your Bot Token first' });
      return;
    }
    setWebhookLoading(true);
    try {
      const res = await fetch('/api/deploy/telegram/delete-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookStatus({ success: true, message: 'Webhook deleted. Bot is now in getUpdates polling mode.' });
      } else {
        setWebhookStatus({ success: false, message: data.description || 'Could not delete webhook' });
      }
    } catch (err: any) {
      setWebhookStatus({ success: false, message: err.message });
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-[11px] font-semibold text-sky-300">
            <Cloud className="w-3.5 h-3.5 text-sky-400" />
            <span>DevOps & Deployment Hub</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-display">
            GitHub, Cloudflare & Telegram Automation
          </h2>
          <p className="text-xs text-slate-400">
            One-click upload to GitHub for Cloudflare Pages, plus automated Telegram Bot webhook configuration.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'github'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub & Cloudflare Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'telegram'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Telegram Webhook Setter</span>
          </button>
        </div>

        {/* TAB 1: GITHUB & CLOUDFLARE PAGES */}
        {activeTab === 'github' && (
          <div className="space-y-4 pt-1">
            {/* Quick 3-Step Persian / English Cloudflare Deployment Guide */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-sky-950/30 border border-amber-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Cloud className="w-4 h-4 text-amber-400" />
                <span>راهنمای ۳ مرحله‌ای اتصال به گیت‌هاب و اجرای کلودفلر</span>
              </div>
              <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal pr-4 leading-relaxed font-sans" dir="rtl">
                <li>
                  <b className="text-amber-200">توکن گیت‌هاب</b> خود را وارد کرده و دکمه آبی زیر را بزنید تا کل سورس‌کد و فایل‌های کانفیگ کلودفلر خودکار روی گیت‌هاب بارگذاری شوند.
                </li>
                <li>
                  در پنل <b>Cloudflare</b> بخش <i>Workers & Pages &gt; Create &gt; Pages &gt; Connect to Git</i> را بزنید و ریپازیتوری را متصل کنید (دستور ساخت <code className="text-sky-300 font-mono">npm run build</code> و پوشه <code className="text-sky-300 font-mono">dist</code>).
                </li>
                <li>
                  آدرس نهایی کلودفلر شما (مثلاً <code className="text-sky-300 font-mono">https://mooncoin.pages.dev</code>) بلافاصله آنلاین شده و آماده اتصال به ربات تلگرام در تب دوم است!
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=MoonCoinDeployer"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Generate Token</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
                <button
                  onClick={handleTestGitHub}
                  disabled={testingToken || !githubToken}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 disabled:opacity-50 transition-colors"
                >
                  {testingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                </button>
              </div>

              {gitUser && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 text-xs text-emerald-400">
                  <img src={gitUser.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                  <span className="font-semibold">{gitUser.name}</span>
                  <span className="text-slate-400">(@{gitUser.username})</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  placeholder="pocket-planet"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                />
                <span>Private Repository</span>
              </label>
            </div>

            {/* Cloudflare Pages CI/CD Notice */}
            <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <span>Pre-configured Cloudflare Pages CI/CD Included</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Pushing will automatically include <code className="text-indigo-300 font-mono">.github/workflows/cloudflare-pages.yml</code> and <code className="text-indigo-300 font-mono">wrangler.jsonc</code> for automatic Cloudflare builds.
              </p>
            </div>

            {/* Status Message */}
            {gitStatus && (
              <div
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  gitStatus.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {gitStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <span>{gitStatus.message}</span>
                  {gitStatus.repoUrl && (
                    <a
                      href={gitStatus.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1 text-sky-400 hover:underline font-bold"
                    >
                      <span>View GitHub Repository</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              onClick={handlePushGitHub}
              disabled={pushingRepo || !githubToken || !repoName}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 disabled:opacity-50 transition-all"
            >
              {pushingRepo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing Project Files to GitHub...</span>
                </>
              ) : (
                <>
                  <Github className="w-4 h-4" />
                  <span>Upload Project to GitHub (Auto-Cloudflare)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 2: TELEGRAM WEBHOOK SETTER */}
        {activeTab === 'telegram' && (
          <div className="space-y-4 pt-1">
            {/* Primary Bot Token Input */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                  <span>Telegram Bot Token</span>
                </label>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Open @BotFather</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <input
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 block">
                Paste the HTTP API token generated by @BotFather.
              </span>
            </div>

            {/* 1-Click Auto-Configure to Current App Endpoint Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/50 via-slate-950 to-indigo-950/50 border border-sky-800/70 space-y-3 shadow-lg shadow-sky-950/30">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                    Auto-Detected App Endpoint
                  </span>
                  <div className="font-mono text-xs text-slate-200 mt-0.5 break-all select-all bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/telegram` : '/api/webhook/telegram'}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Automatically registers this application’s live URL with Telegram so your bot replies to commands (<code className="text-sky-300">/start</code>, <code className="text-sky-300">/play</code>) with an interactive Mini App launch button!
              </p>

              <button
                onClick={handleSetAutoWebhook}
                disabled={webhookLoading || !botToken.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 active:scale-95 disabled:opacity-50 transition-all"
              >
                {webhookLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Telegram API...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    <span>Auto-Set Webhook to Current App Endpoint</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Feedback Display */}
            {webhookStatus && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  webhookStatus.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {webhookStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold">{webhookStatus.message}</p>
                  {webhookStatus.info && (
                    <div className="text-[11px] font-mono text-slate-400 space-y-0.5 pt-1.5 border-t border-slate-800/60">
                      <div>Active URL: <span className="text-sky-300">{webhookStatus.info.url || '(none)'}</span></div>
                      {webhookStatus.info.pending_update_count !== undefined && (
                        <div>Pending Updates: {webhookStatus.info.pending_update_count}</div>
                      )}
                      {webhookStatus.info.last_error_message && (
                        <div className="text-rose-400">
                          Last Error: {webhookStatus.info.last_error_message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Inspection & Reset Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleGetWebhookInfo}
                disabled={webhookLoading || !botToken.trim()}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-colors"
              >
                <span>Check Webhook Info</span>
              </button>

              <button
                onClick={handleDeleteWebhook}
                disabled={webhookLoading || !botToken.trim()}
                className="py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/30 border border-rose-900/50 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Webhook</span>
              </button>
            </div>

            {/* CLI Management Script Reference */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>CLI Script Management</span>
                <code className="text-[10px] text-sky-400 font-mono">scripts/telegram-webhook.ts</code>
              </div>
              <p className="text-[10px] text-slate-500">You can also manage webhooks from your terminal:</p>
              <div className="font-mono text-[10px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 overflow-x-auto select-all">
                npx tsx scripts/telegram-webhook.ts set {botToken ? '<TOKEN>' : 'YOUR_TOKEN'} {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/telegram` : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
