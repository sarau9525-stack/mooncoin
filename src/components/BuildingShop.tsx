import React from 'react';
import { BuildingId, UserGameProfile } from '../types/game';
import { BUILDINGS_CONFIG, calculateBuildingCost, calculateBuildingIncomePerHour, PLANET_STAGES } from '../config/gameConfig';
import { Gem, Sun, Sprout, FlaskConical, Rocket, Shield, Telescope, Lock, Zap } from 'lucide-react';

interface BuildingShopProps {
  user: UserGameProfile;
  onUpgradeBuilding: (buildingId: BuildingId) => void;
}

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  Gem,
  Sun,
  Sprout,
  FlaskConical,
  Rocket,
  Shield,
  Telescope,
};

export const BuildingShop: React.FC<BuildingShopProps> = ({ user, onUpgradeBuilding }) => {
  const buildingList = Object.values(BUILDINGS_CONFIG);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-3 pb-24">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-display">Planetary Infrastructure</h2>
          <p className="text-xs text-slate-400">
            Construct facilities to automate energy harvest and shape your civilization.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Total Passive Flow</span>
          <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
            +{user.passiveIncomePerHour.toLocaleString()} /hr
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {buildingList.map((b) => {
          const currentLevel = user.buildings[b.id] || 0;
          const isMax = currentLevel >= b.maxLevel;
          const cost = calculateBuildingCost(b.id, currentLevel);
          const currentIncome = calculateBuildingIncomePerHour(b.id, currentLevel);
          const nextIncome = calculateBuildingIncomePerHour(b.id, currentLevel + 1);
          const incomeDelta = nextIncome - currentIncome;
          const isUnlocked = user.planetStage >= b.unlockedAtStage;
          const canAfford = user.cosmicEnergy >= cost && !isMax && isUnlocked;
          const IconComp = ICONS[b.icon] || Gem;
          const requiredStage = PLANET_STAGES[b.unlockedAtStage];

          return (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isUnlocked
                  ? 'bg-slate-900/90 border-slate-800 shadow-md shadow-black/20'
                  : 'bg-slate-950/60 border-slate-800/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Icon & Building Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-sky-400'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    {isUnlocked ? <IconComp className="w-5 h-5" /> : <Lock className="w-5 h-5 text-slate-600" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-200 font-display truncate">
                        {b.name}
                      </h3>
                      {isUnlocked && (
                        <span className="text-[11px] font-bold text-sky-400 font-mono tabular-nums">
                          Lvl {currentLevel}
                          {b.maxLevel && <span className="text-slate-500 font-normal">/{b.maxLevel}</span>}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {b.description}
                    </p>

                    {/* Stats & Perks */}
                    {isUnlocked ? (
                      <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                        <span className="text-emerald-400 font-semibold font-mono tabular-nums">
                          +{currentIncome.toLocaleString()} /hr
                        </span>
                        {!isMax && (
                          <span className="text-slate-500 font-mono tabular-nums">
                            (+{incomeDelta.toLocaleString()} next)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-500/90 font-medium mt-1 inline-block">
                        Unlocks at {requiredStage.name} (Stage {b.unlockedAtStage})
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Upgrade Button */}
                <div className="shrink-0 flex items-center">
                  {isUnlocked ? (
                    <button
                      onClick={() => onUpgradeBuilding(b.id)}
                      disabled={!canAfford}
                      className={`min-w-[96px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                        isMax
                          ? 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-default'
                          : canAfford
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 shadow-md shadow-sky-500/20 active:scale-95'
                          : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {isMax ? (
                        <span>MAX</span>
                      ) : (
                        <>
                          <span className="text-[10px] tracking-wide uppercase opacity-80">
                            {currentLevel === 0 ? 'Build' : 'Upgrade'}
                          </span>
                          <div className="flex items-center gap-0.5 mt-0.5 font-mono tabular-nums">
                            <Zap className="w-3 h-3 fill-slate-950" />
                            <span>{cost.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
