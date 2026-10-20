import React from 'react';
import { Globe, Pickaxe, Sparkles, Compass, CheckSquare, Trophy } from 'lucide-react';

export type TabId = 'planet' | 'upgrades' | 'aliens' | 'discover' | 'missions' | 'galaxy';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  unclaimedMissionsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unclaimedMissionsCount = 0,
}) => {
  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'planet', label: 'Planet', icon: Globe },
    { id: 'upgrades', label: 'Upgrades', icon: Pickaxe },
    { id: 'aliens', label: 'Aliens', icon: Sparkles },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'missions', label: 'Missions', icon: CheckSquare },
    { id: 'galaxy', label: 'Galaxy', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-2xl mx-auto grid grid-cols-6 h-16 items-center px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComp = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] h-full transition-all ${
                isActive ? 'text-sky-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <IconComp className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {tab.id === 'missions' && unclaimedMissionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-950" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 leading-none">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
