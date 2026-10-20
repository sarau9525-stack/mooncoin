import React from 'react';
import { UserGameProfile } from '../types/game';
import { PLANET_WORLDS } from '../config/gameConfig';
import { Globe, Compass, Lock, CheckCircle, Sparkles, Zap } from 'lucide-react';

interface DiscoverPlanetsProps {
  user: UserGameProfile;
  onSelectPlanet: (worldId: string) => void;
}

export const DiscoverPlanets: React.FC<DiscoverPlanetsProps> = ({ user, onSelectPlanet }) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-display">Galaxy Discovery & Colonization</h2>
        <p className="text-xs text-slate-400 mt-1">
          Scout the cosmic frontier with your Spaceport and establish deep-space colonies on exotic planetary biomes.
        </p>
      </div>

      <div className="space-y-3">
        {PLANET_WORLDS.map((world) => {
          const isUnlocked = user.planetLevel >= world.requiredPlayerLevel;
          const isCurrent = user.currentPlanetId === world.id;

          return (
            <div
              key={world.id}
              className={`p-4 rounded-3xl border transition-all relative overflow-hidden ${
                isUnlocked
                  ? 'bg-slate-900/90 border-slate-800 shadow-md shadow-black/20'
                  : 'bg-slate-950/60 border-slate-800/40 opacity-70'
              }`}
            >
              {/* Planetary Biome Color Accent Bar */}
              <div
                className="absolute top-0 left-0 bottom-0 w-1.5"
                style={{ backgroundColor: world.themeColor }}
              />

              <div className="flex items-start justify-between gap-3 pl-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100 font-display truncate">
                      {world.name}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                      {world.type}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-sky-400 bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded-full">
                        ACTIVE HOME
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {world.description}
                  </p>

                  {/* World Environmental Perk */}
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-emerald-400 font-semibold font-mono">
                      Perk: {world.bonusEffect}
                    </span>
                  </div>

                  {/* Level Lock Status */}
                  {!isUnlocked && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400 font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Requires Planet Level {world.requiredPlayerLevel} & Spaceport</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="shrink-0 flex items-center">
                  {isCurrent ? (
                    <div className="px-3 py-1.5 rounded-xl bg-sky-950/40 border border-sky-800/50 text-xs font-bold text-sky-300 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>In Orbit</span>
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => onSelectPlanet(world.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                    >
                      Establish Orbit
                    </button>
                  ) : (
                    <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3" />
                      <span>Lvl {world.requiredPlayerLevel}</span>
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
