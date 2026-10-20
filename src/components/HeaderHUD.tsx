import React from 'react';
import { UserGameProfile } from '../types/game';
import { soundManager } from '../services/audio';
import { telegramBridge } from '../services/telegram';
import { Volume2, VolumeX, Sparkles, Zap, Flame, Settings, Cloud, ShieldAlert } from 'lucide-react';

interface HeaderHUDProps {
  user: UserGameProfile;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenEvolution?: () => void;
  canEvolve?: boolean;
  onOpenDeployment?: () => void;
  onOpenAdmin?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  user,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenEvolution,
  canEvolve,
  onOpenDeployment,
  onOpenAdmin,
}) => {
  const isTelegram = telegramBridge.isTelegramMiniApp();

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-2.5 z-30 sticky top-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Player Identity & MOONCOIN Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 p-[1.5px] shrink-0 shadow-md shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-amber-300 font-display text-xs">
              🌕
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-amber-400 font-display tracking-wider">
                MOONCOIN
              </span>
              <span className="text-slate-600 font-normal">|</span>
              <span className="text-xs font-bold text-slate-100 truncate tracking-tight font-display">
                {user.username}
              </span>
              {isTelegram && (
                <span className="text-[9px] font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/60 px-1.5 py-0.2 rounded shrink-0">
                  TG
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <span>Lvl {user.planetLevel}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{user.planetName}</span>
            </div>
          </div>
        </div>

        {/* Center: Balances */}
        <div className="flex items-center gap-3 shrink-0">
          {/* MoonCoins */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 border border-amber-900/40 rounded-xl shadow-inner">
            <span className="text-sm select-none">🪙</span>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-amber-200 tabular-nums font-mono leading-none">
                {user.cosmicEnergy.toLocaleString()}
              </span>
              <span className="text-[9px] text-amber-400/80 font-medium leading-tight">
                MoonCoins
              </span>
            </div>
          </div>

          {/* Stardust Crystals */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 fill-sky-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-sky-200 tabular-nums font-mono leading-none">
                {user.stardust.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 font-medium leading-tight">
                Stardust
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions & Evolution Indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {canEvolve && (
            <button
              onClick={onOpenEvolution}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-transform"
              title="Planet Evolution Ready!"
            >
              <Flame className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden sm:inline">Evolve</span>
            </button>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 flex items-center justify-center transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 flex items-center justify-center transition-colors"
            title="Game Settings & Info"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>

          {/* GitHub & Cloudflare Deployment Hub Button */}
          {onOpenDeployment && (
            <button
              onClick={onOpenDeployment}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-950 to-indigo-950 hover:from-sky-900 hover:to-indigo-900 border border-sky-800/70 text-sky-400 flex items-center justify-center transition-colors shadow-sm"
              title="GitHub & Cloudflare Deploy Hub"
              aria-label="Cloud Deploy Hub"
            >
              <Cloud className="w-4 h-4" />
            </button>
          )}

          {/* Master Admin Management Panel Button */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 hover:from-amber-500/30 hover:to-orange-500/40 border border-amber-500/60 text-amber-300 font-bold text-xs transition-all shadow-sm active:scale-95"
              title="Master Admin Panel (مدیریت کاربران و کوین)"
              aria-label="Admin Panel"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold">Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
