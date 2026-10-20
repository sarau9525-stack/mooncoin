import React, { useState } from 'react';
import { UserGameProfile } from '../types/game';
import { telegramBridge } from '../services/telegram';
import { soundManager } from '../services/audio';
import { Volume2, VolumeX, Bot, Smartphone, RotateCcw, X, Info, Check, ShieldCheck, Cloud, Radio } from 'lucide-react';

interface SettingsModalProps {
  user: UserGameProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
  onResetAccount: () => void;
  onOpenDeployment: () => void;
  onOpenAdmin?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  isMuted,
  onToggleMute,
  onClose,
  onResetAccount,
  onOpenDeployment,
  onOpenAdmin,
}) => {
  const isTelegram = telegramBridge.isTelegramMiniApp();
  const [showBotGuide, setShowBotGuide] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-100 font-display">Command Center & Settings</h2>
          <p className="text-xs text-slate-400">Configure gameplay audio, Telegram links, and account status.</p>
        </div>

        {/* Audio Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
            <div>
              <span className="text-xs font-bold text-slate-200 block">Synthesizer Audio</span>
              <span className="text-[11px] text-slate-400">Web Audio API procedural sound feedback</span>
            </div>
          </div>
          <button
            onClick={onToggleMute}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              isMuted ? 'bg-slate-800 text-slate-400' : 'bg-sky-500 text-slate-950'
            }`}
          >
            {isMuted ? 'Muted' : 'Enabled'}
          </button>
        </div>

        {/* Platform Status */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">Runtime Platform</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isTelegram
                  ? 'bg-sky-950 text-sky-300 border-sky-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
              }`}
            >
              {isTelegram ? 'Telegram Mini App' : 'Standalone Web Client'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>Commander ID:</span>
              <span className="font-mono text-slate-300">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Referral Code:</span>
              <span className="font-mono text-amber-300 font-bold">{user.referralCode}</span>
            </div>
          </div>
        </div>

        {/* Telegram Bot Setup Guide Accordion */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <button
            onClick={() => setShowBotGuide(!showBotGuide)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Telegram Bot Setup Guide</span>
            </div>
            <span className="text-xs text-indigo-400">{showBotGuide ? 'Hide' : 'View'}</span>
          </button>

          {showBotGuide && (
            <div className="text-[11px] text-slate-300 space-y-2 pt-2 border-t border-slate-800/80">
              <p>To run MOONCOIN inside your Telegram channel or bot:</p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-400 font-mono text-[10px]">
                <li>Open <b className="text-sky-300">@BotFather</b> in Telegram and type <code className="text-amber-300">/newbot</code></li>
                <li>Set bot username e.g. <code className="text-amber-300">MoonCoinAppBot</code></li>
                <li>Type <code className="text-amber-300">/newapp</code> in BotFather and select your bot</li>
                <li>Enter the app title & description ("MOONCOIN")</li>
                <li>Set WebApp URL to this app's production URL</li>
                <li>Set short name (e.g. <code className="text-amber-300">app</code>)</li>
                <li>Launch via <code className="text-sky-300">https://t.me/YourBot/app</code></li>
              </ol>
            </div>
          )}
        </div>

        {/* Master Admin Management Panel */}
        {onOpenAdmin && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 to-orange-950/60 border border-amber-600/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-100">پنل مدیریت کل (Master Admin Panel)</span>
              </div>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-700/60">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              مدیریت و حذف تمام کاربران، اضافه کردن کوین و استارداست دلخواه، تغییر سطح و ایردراپ همگانی.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all mt-1"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ورود به پنل مدیریت بازی (Open Admin Panel)</span>
            </button>
          </div>
        )}

        {/* Automated Deployment & Webhook Hub */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-100">Auto-Deploy & Webhook Hub</span>
            </div>
            <span className="text-[10px] text-sky-300 font-bold bg-sky-900/60 px-2 py-0.5 rounded-full border border-sky-700/60">
              DevOps
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Automated GitHub sync for Cloudflare Pages and Telegram Bot webhook configuration with token.
          </p>
          <button
            onClick={() => {
              onClose();
              onOpenDeployment();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all mt-1"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Open GitHub & Cloudflare Deployment Hub</span>
          </button>
        </div>

        {/* Account Reset */}
        <div className="pt-2">
          <button
            onClick={onResetAccount}
            className="w-full py-2.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh Expedition (Reset Data)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
