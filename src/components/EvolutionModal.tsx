import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlanetStageId, UserGameProfile } from '../types/game';
import { PLANET_STAGES } from '../config/gameConfig';
import { soundManager } from '../services/audio';
import { telegramBridge } from '../services/telegram';
import { Flame, Sparkles, Check, ArrowRight, X } from 'lucide-react';

interface EvolutionModalProps {
  user: UserGameProfile;
  onEvolve: () => void;
  onClose: () => void;
  isEvolving?: boolean;
}

export const EvolutionModal: React.FC<EvolutionModalProps> = ({
  user,
  onEvolve,
  onClose,
  isEvolving = false,
}) => {
  const currentStage = PLANET_STAGES[user.planetStage];
  const nextStageId = (user.planetStage + 1) as PlanetStageId;
  const nextStage = PLANET_STAGES[nextStageId];

  const canEvolve =
    nextStage &&
    user.planetLevel >= nextStage.requiredLevel &&
    user.totalEnergyEarned >= nextStage.requiredTotalEnergy;

  const triggerCelebration = () => {
    soundManager.playFanfare();
    telegramBridge.hapticNotification('success');
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7'],
      });
    } catch {}
    onEvolve();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-2">
            <Flame className="w-8 h-8 text-slate-950 fill-slate-950" />
          </div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
            Planetary Metamorphosis
          </span>
          <h2 className="text-xl font-black text-slate-100 font-display">
            Evolve Your Planet
          </h2>
          <p className="text-xs text-slate-400">
            Expand your civilization to the next cosmic evolutionary tier.
          </p>
        </div>

        {/* Transition Stages Preview */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-500 block uppercase">Current</span>
            <span className="text-sm font-bold text-slate-300 font-display">
              {currentStage.name}
            </span>
            <span className="text-[10px] text-slate-400 block">Stage {currentStage.id}</span>
          </div>

          <ArrowRight className="w-5 h-5 text-amber-400" />

          <div className="text-right">
            <span className="text-[10px] text-amber-500 block uppercase font-bold">Next</span>
            <span className="text-sm font-bold text-amber-300 font-display">
              {nextStage ? nextStage.name : 'Ultimate Stage'}
            </span>
            <span className="text-[10px] text-amber-400/80 block">
              {nextStage ? `Stage ${nextStage.id}` : 'Ascended'}
            </span>
          </div>
        </div>

        {/* Next Stage Features */}
        {nextStage && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Unlocked Metamorphosis Perks
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {nextStage.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-center">
              <span className="text-[11px] text-amber-300 font-medium">
                🎁 Bonus on Evolution: <span className="font-bold">+50 Stardust Crystals</span>
              </span>
            </div>
          </div>
        )}

        {/* Evolution CTA */}
        {nextStage && (
          <button
            onClick={triggerCelebration}
            disabled={!canEvolve || isEvolving}
            className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              canEvolve && !isEvolving
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>
              {isEvolving
                ? 'Evolving...'
                : canEvolve
                ? `Initiate Evolution to Stage ${nextStage.id}`
                : `Requires Lvl ${nextStage.requiredLevel} & ${nextStage.requiredTotalEnergy.toLocaleString()} Energy`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
