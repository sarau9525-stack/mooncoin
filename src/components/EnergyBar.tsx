import React from 'react';
import { UserGameProfile } from '../types/game';
import { calculateEnergyCapacityCost, calculateTapUpgradeCost } from '../config/gameConfig';
import { Zap, ArrowUpCircle, Gauge, BatteryCharging } from 'lucide-react';

interface EnergyBarProps {
  user: UserGameProfile;
  onUpgradeTap: () => void;
  onUpgradeCapacity: () => void;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({ user, onUpgradeTap, onUpgradeCapacity }) => {
  const percent = Math.min(100, Math.max(0, (user.energy / user.maxEnergy) * 100));
  const tapUpgradeCost = calculateTapUpgradeCost(user.tapPower);
  const capUpgradeCost = calculateEnergyCapacityCost(user.maxEnergy);

  const canAffordTap = user.cosmicEnergy >= tapUpgradeCost;
  const canAffordCap = user.cosmicEnergy >= capUpgradeCost;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2">
      {/* Energy Meter Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg shadow-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <div className="flex items-center gap-1.5 text-sky-400">
            <BatteryCharging className="w-4 h-4 animate-pulse" />
            <span className="font-semibold text-slate-200">Energy Reservoir</span>
          </div>
          <div className="text-slate-300 font-mono tabular-nums font-bold">
            {user.energy} <span className="text-slate-500 font-normal">/ {user.maxEnergy}</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="relative w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 transition-all duration-300 shadow-sm shadow-sky-500/50"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Quick Upgrade Pills */}
        <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-800/60 text-center">
          {/* Tap Power */}
          <button
            onClick={onUpgradeTap}
            disabled={!canAffordTap}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all ${
              canAffordTap
                ? 'bg-sky-950/60 hover:bg-sky-900/60 border-sky-700/60 text-sky-200 active:scale-95'
                : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <Zap className="w-3 h-3 text-sky-400" />
              <span>Tap +{user.tapPower}</span>
            </div>
            <span className="text-[10px] font-mono tabular-nums mt-0.5">
              {tapUpgradeCost.toLocaleString()}
            </span>
          </button>

          {/* Max Capacity */}
          <button
            onClick={onUpgradeCapacity}
            disabled={!canAffordCap}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all ${
              canAffordCap
                ? 'bg-indigo-950/60 hover:bg-indigo-900/60 border-indigo-700/60 text-indigo-200 active:scale-95'
                : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <ArrowUpCircle className="w-3 h-3 text-indigo-400" />
              <span>Cap +250</span>
            </div>
            <span className="text-[10px] font-mono tabular-nums mt-0.5">
              {capUpgradeCost.toLocaleString()}
            </span>
          </button>

          {/* Passive Income / Hour */}
          <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>Passive/hr</span>
            </div>
            <span className="text-[10px] font-mono tabular-nums text-emerald-300 font-semibold mt-0.5">
              +{user.passiveIncomePerHour.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
