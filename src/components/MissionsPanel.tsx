import React from 'react';
import { Mission, UserGameProfile } from '../types/game';
import { DAILY_LOGIN_REWARDS } from '../config/gameConfig';
import { CheckCircle2, Zap, Sparkles, Calendar, Gift, Clock } from 'lucide-react';

interface MissionsPanelProps {
  user: UserGameProfile;
  missions: Mission[];
  onClaimMission: (missionId: string) => void;
  onClaimDailyReward: () => void;
  canClaimDailyReward?: boolean;
}

export const MissionsPanel: React.FC<MissionsPanelProps> = ({
  user,
  missions,
  onClaimMission,
  onClaimDailyReward,
  canClaimDailyReward = true,
}) => {
  const dailyMissions = missions.filter((m) => m.category === 'daily');
  const milestoneMissions = missions.filter((m) => m.category === 'milestone');

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-5 pb-24">
      {/* 7-Day Login Calendar Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-display">Starlight Login Calendar</h2>
              <p className="text-[11px] text-slate-400">
                Log in daily to claim escalating Cosmic Energy and Stardust rewards.
              </p>
            </div>
          </div>

          <button
            onClick={onClaimDailyReward}
            disabled={!canClaimDailyReward}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              canClaimDailyReward
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{canClaimDailyReward ? 'Claim Daily' : 'Claimed'}</span>
          </button>
        </div>

        {/* 7-Day Progress Track */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {DAILY_LOGIN_REWARDS.map((rw) => {
            const isCompleted = user.dailyStreak >= rw.day;
            const isToday = user.dailyStreak + 1 === rw.day && canClaimDailyReward;

            return (
              <div
                key={rw.day}
                className={`p-2 rounded-xl border flex flex-col items-center justify-between transition-all ${
                  isCompleted
                    ? 'bg-indigo-950/40 border-indigo-700/50 text-indigo-300'
                    : isToday
                    ? 'bg-amber-950/50 border-amber-500 text-amber-200 animate-pulse'
                    : 'bg-slate-950/50 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-bold block mb-1">D{rw.day}</span>
                <span className="text-xs mb-1">
                  {rw.hasAlienPod ? '🛸' : rw.rewardStardust > 20 ? '💎' : '⚡'}
                </span>
                <span className="text-[9px] font-mono tabular-nums leading-none">
                  +{rw.rewardStardust}✦
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Quests Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Daily Missions (Resets Daily)
        </h3>
        <div className="space-y-2">
          {dailyMissions.map((m) => {
            const isDone = m.currentCount >= m.targetCount;
            const percent = Math.min(100, Math.round((m.currentCount / m.targetCount) * 100));

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-200 font-display truncate">
                      {m.title}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {m.currentCount.toLocaleString()} / {m.targetCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {m.description}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Rewards preview */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
                    <span className="text-sky-300 font-semibold">+{m.rewardEnergy.toLocaleString()} Energy</span>
                    <span className="text-amber-300 font-semibold">+{m.rewardStardust} Stardust</span>
                  </div>
                </div>

                {/* Claim Button */}
                <div className="shrink-0">
                  <button
                    onClick={() => onClaimMission(m.id)}
                    disabled={!isDone || m.isClaimed}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      m.isClaimed
                        ? 'bg-slate-800/40 text-emerald-400 border border-emerald-900/40 cursor-default'
                        : isDone
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                        : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {m.isClaimed ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Claimed</span>
                      </span>
                    ) : (
                      'Claim'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progression Milestones Section */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Civilization Milestones
        </h3>
        <div className="space-y-2">
          {milestoneMissions.map((m) => {
            const isDone = m.currentCount >= m.targetCount;
            const percent = Math.min(100, Math.round((m.currentCount / m.targetCount) * 100));

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-200 font-display truncate">
                      {m.title}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {m.currentCount.toLocaleString()} / {m.targetCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {m.description}
                  </p>

                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
                    <span className="text-sky-300 font-semibold">+{m.rewardEnergy.toLocaleString()} Energy</span>
                    <span className="text-amber-300 font-semibold">+{m.rewardStardust} Stardust</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => onClaimMission(m.id)}
                    disabled={!isDone || m.isClaimed}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      m.isClaimed
                        ? 'bg-slate-800/40 text-emerald-400 border border-emerald-900/40 cursor-default'
                        : isDone
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                        : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {m.isClaimed ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Claimed</span>
                      </span>
                    ) : (
                      'Claim'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
