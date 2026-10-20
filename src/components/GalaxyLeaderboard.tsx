import React, { useState } from 'react';
import { LeaderboardEntry, UserGameProfile } from '../types/game';
import { telegramBridge } from '../services/telegram';
import { Trophy, Share2, Copy, Check, Users, ExternalLink, Sparkles, Zap, Eye, X } from 'lucide-react';
import { apiClient } from '../services/api';

interface GalaxyLeaderboardProps {
  user: UserGameProfile;
  leaderboard: LeaderboardEntry[];
  onRefreshLeaderboard?: () => void;
}

export const GalaxyLeaderboard: React.FC<GalaxyLeaderboardProps> = ({
  user,
  leaderboard,
  onRefreshLeaderboard,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'referrals'>('leaderboard');
  const [copied, setCopied] = useState(false);
  const [inspectProfile, setInspectProfile] = useState<Partial<UserGameProfile> | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Generate Referral URL (Web + Telegram deep link)
  const isTelegram = telegramBridge.isTelegramMiniApp();
  const webReferralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${user.referralCode}`
    : `https://pocketplanet.app?ref=${user.referralCode}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(webReferralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaTelegram = () => {
    telegramBridge.shareReferral(user.referralCode);
  };

  const handleInspect = async (userId: string) => {
    try {
      setLoadingProfile(true);
      const data = await apiClient.getPublicProfile(userId);
      setInspectProfile(data.profile);
    } catch (err) {
      console.error('Error fetching public profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Subnav Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Galaxy Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'referrals'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Alliance Referrals
        </button>
      </div>

      {activeTab === 'leaderboard' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Rank & Civilization</span>
            <span>Total Harvest</span>
          </div>

          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === user.id;

              return (
                <div
                  key={entry.userId}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrentUser
                      ? 'bg-sky-950/60 border-sky-600/70 shadow-md shadow-sky-900/30'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                        entry.rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/40'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-amber-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {entry.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-100 font-display truncate">
                          {entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-sky-400 font-bold bg-sky-950 px-1.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Lvl {entry.planetLevel}</span>
                        <span>·</span>
                        <span className="truncate">{entry.planetName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-200 font-mono tabular-nums block">
                        {entry.totalEnergyEarned.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono tabular-nums">
                        +{entry.passiveIncomePerHour.toLocaleString()}/h
                      </span>
                    </div>

                    <button
                      onClick={() => handleInspect(entry.userId)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Inspect Planet"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Alliance Referrals Section */
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/60 shadow-xl shadow-black/40">
            <h3 className="text-lg font-bold text-slate-100 font-display">Galactic Alliance Network</h3>
            <p className="text-xs text-slate-300 mt-1">
              Invite your friends to establish colonies in Pocket Planet. Both of you receive bonus Cosmic Energy and Stardust crystals upon qualification!
            </p>

            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Invited Explorers</span>
                <span className="text-xl font-black text-sky-400 font-mono tabular-nums">
                  {user.referralCount}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Alliance Earnings</span>
                <span className="text-xl font-black text-amber-400 font-mono tabular-nums">
                  +{user.referralEarnings.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Referral Link & Share Buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-xs font-mono text-slate-300 truncate flex-1 pl-2">
                  {webReferralUrl}
                </span>
                <button
                  onClick={copyReferral}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                onClick={shareViaTelegram}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4 fill-slate-950" />
                <span>Share via Telegram Deep Link</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5 text-slate-300">
            <h4 className="font-bold text-slate-100 font-display">Alliance Rules & Rewards:</h4>
            <p>• Earn 3,000 Cosmic Energy + 20 Stardust for every new player who joins via your code.</p>
            <p>• Your invited friend immediately receives a 1,000 Cosmic Energy + 15 Stardust starter package.</p>
            <p>• Anti-cheat algorithms prevent self-referrals and automated duplicate account attribution.</p>
          </div>
        </div>
      )}

      {/* Public Planet Inspector Modal */}
      {inspectProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setInspectProfile(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-slate-950 text-xl font-display">
                {inspectProfile.username?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  {inspectProfile.username}
                </h3>
                <span className="text-xs text-sky-400 font-medium">
                  {inspectProfile.planetName} · Level {inspectProfile.planetLevel} (Stage {inspectProfile.planetStage})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Total Harvested</span>
                <span className="font-bold font-mono text-slate-100 text-sm">
                  {inspectProfile.totalEnergyEarned?.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Passive Income</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  +{inspectProfile.passiveIncomePerHour?.toLocaleString()}/hr
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Active Facilities
              </h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {Object.entries(inspectProfile.buildings || {}).map(([bId, lvl]) => (
                  <div key={bId} className="flex justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
                    <span className="text-slate-400 capitalize">{bId.replace('_', ' ')}</span>
                    <span className="font-bold font-mono text-sky-300">Lvl {lvl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
