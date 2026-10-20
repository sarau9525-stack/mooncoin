import React, { useState } from 'react';
import { AlienRarity, UserGameProfile } from '../types/game';
import { ALIENS_CONFIG } from '../config/gameConfig';
import { Sparkles, HelpCircle, Flame, ShieldAlert, Award } from 'lucide-react';

interface AlienCollectionProps {
  user: UserGameProfile;
  onSummonAlien: () => void;
  isSummoning?: boolean;
}

const RARITY_BADGES: Record<AlienRarity, { label: string; bg: string; text: string; border: string }> = {
  common: { label: 'Common', bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-700' },
  uncommon: { label: 'Uncommon', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-800' },
  rare: { label: 'Rare', bg: 'bg-sky-950/80', text: 'text-sky-300', border: 'border-sky-800' },
  epic: { label: 'Epic', bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-800' },
  legendary: { label: 'Legendary', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700' },
};

export const AlienCollection: React.FC<AlienCollectionProps> = ({
  user,
  onSummonAlien,
  isSummoning = false,
}) => {
  const [showOdds, setShowOdds] = useState(false);
  const aliensList = Object.values(ALIENS_CONFIG);
  const canAffordSummon = user.stardust >= 20;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Header & Summon Pod Banner */}
      <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/60 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-700/40 text-[11px] font-semibold text-indigo-300 mb-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Bio-Resonance Pod</span>
            </div>
            <h2 className="text-xl font-black text-slate-100 font-display">Alien Companions</h2>
            <p className="text-xs text-slate-300 max-w-md mt-1">
              Summon unique alien species to empower your civilization with permanent passive and active multipliers.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={onSummonAlien}
              disabled={!canAffordSummon || isSummoning}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                canAffordSummon && !isSummoning
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-70'
              }`}
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{isSummoning ? 'Summoning...' : 'Summon Pod (20 Stardust)'}</span>
            </button>

            <button
              onClick={() => setShowOdds(!showOdds)}
              className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors self-end"
            >
              <HelpCircle className="w-3 h-3" />
              <span>View Transparent Drop Rates</span>
            </button>
          </div>
        </div>

        {/* Drop Rates Accordion */}
        {showOdds && (
          <div className="mt-4 pt-3 border-t border-indigo-900/40 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Common</span>
              <span className="font-bold text-slate-200">50%</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-900/60">
              <span className="block text-[10px] text-emerald-400">Uncommon</span>
              <span className="font-bold text-emerald-200">30%</span>
            </div>
            <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-900/60">
              <span className="block text-[10px] text-sky-400">Rare</span>
              <span className="font-bold text-sky-200">13%</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-900/60">
              <span className="block text-[10px] text-purple-400">Epic</span>
              <span className="font-bold text-purple-200">5%</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-900/60 col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-amber-400">Legendary</span>
              <span className="font-bold text-amber-200">2%</span>
            </div>
          </div>
        )}
      </div>

      {/* Companions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {aliensList.map((alien) => {
          const owned = user.aliens[alien.id];
          const isOwned = Boolean(owned);
          const level = owned?.level || 0;
          const currentBonus = isOwned
            ? Math.round((alien.baseBonusValue + (level - 1) * alien.bonusPerLevel) * 100)
            : Math.round(alien.baseBonusValue * 100);
          const rarityCfg = RARITY_BADGES[alien.rarity];

          return (
            <div
              key={alien.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isOwned
                  ? 'bg-slate-900/90 border-slate-800 shadow-md shadow-black/20'
                  : 'bg-slate-950/60 border-slate-800/40 opacity-55 grayscale'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Visual Avatar / Alien Portrait */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border relative shadow-inner"
                  style={{
                    backgroundColor: `${alien.color}15`,
                    borderColor: `${alien.color}50`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full blur-[6px] absolute opacity-60"
                    style={{ backgroundColor: alien.color }}
                  />
                  <span className="text-2xl relative select-none">
                    {alien.id === 'solar_sprite' && '✨'}
                    {alien.id === 'crystal_mole' && '💎'}
                    {alien.id === 'quantum_owl' && '🦉'}
                    {alien.id === 'nebula_fox' && '🦊'}
                    {alien.id === 'gravity_slug' && '🐌'}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-slate-100 font-display truncate">
                      {alien.name}
                    </h3>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${rarityCfg.bg} ${rarityCfg.text} ${rarityCfg.border}`}
                    >
                      {rarityCfg.label}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 block font-medium">
                    {alien.species} · {alien.title}
                  </span>

                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                    {alien.description}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold font-mono">
                      +{currentBonus}% Effect
                    </span>
                    {isOwned ? (
                      <span className="text-sky-300 font-bold font-mono text-[11px]">
                        Lvl {level} ({owned.count}x)
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Undiscovered</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
