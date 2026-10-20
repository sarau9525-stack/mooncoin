import React, { useEffect, useState, useCallback, useRef } from 'react';
import { UserGameProfile, Mission, LeaderboardEntry, PlanetStageId } from './types/game';
import { apiClient } from './services/api';
import { telegramBridge } from './services/telegram';
import { soundManager } from './services/audio';
import { HeaderHUD } from './components/HeaderHUD';
import { PlanetCanvas } from './components/PlanetCanvas';
import { EnergyBar } from './components/EnergyBar';
import { BuildingShop } from './components/BuildingShop';
import { AlienCollection } from './components/AlienCollection';
import { DiscoverPlanets } from './components/DiscoverPlanets';
import { MissionsPanel } from './components/MissionsPanel';
import { GalaxyLeaderboard } from './components/GalaxyLeaderboard';
import { OfflineIncomeModal } from './components/OfflineIncomeModal';
import { EvolutionModal } from './components/EvolutionModal';
import { SettingsModal } from './components/SettingsModal';
import { DeploymentModal } from './components/DeploymentModal';
import { AdminModal } from './components/AdminModal';
import { Navigation, TabId } from './components/Navigation';
import { PLANET_STAGES } from './config/gameConfig';
import { Loader2, RefreshCw } from 'lucide-react';

const CACHE_KEY = 'pocket_planet_local_cache';

// Default starter profile in case of total network timeout
function createDefaultProfile(): UserGameProfile {
  return {
    id: `web_offline_${Math.random().toString(36).substring(2, 8)}`,
    username: 'StarExplorer',
    planetName: "Explorer's World",
    planetStage: 1,
    planetLevel: 1,
    cosmicEnergy: 0,
    stardust: 15,
    totalEnergyEarned: 0,
    energy: 1000,
    maxEnergy: 1000,
    energyRegenPerSec: 1,
    tapPower: 1,
    passiveIncomePerHour: 0,
    buildings: {
      crystal_mine: 0,
      solar_generator: 0,
      alien_habitat: 0,
      research_lab: 0,
      spaceport: 0,
      planet_shield: 0,
      galactic_observatory: 0,
    },
    aliens: {},
    lastActiveTimestamp: Date.now(),
    lastDailyClaimTimestamp: 0,
    dailyStreak: 0,
    referralCode: `PKT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    referralCount: 0,
    referralEarnings: 0,
    totalTaps: 0,
    createdAt: Date.now(),
    currentPlanetId: 'kepler_prime',
    avatarSeed: 'seed_init',
  };
}

export default function App() {
  const [user, setUser] = useState<UserGameProfile | null>(() => {
    // Immediate synchronous load from localStorage cache for zero-delay startup!
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [missions, setMissions] = useState<Mission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('planet');
  const [loading, setLoading] = useState(!user);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [initError, setInitError] = useState<string | null>(null);

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showDeployment, setShowDeployment] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [offlineEarnings, setOfflineEarnings] = useState<{ amount: number; seconds: number } | null>(null);
  const [isSummoning, setIsSummoning] = useState(false);

  // Tap batching ref to combine rapid taps cleanly
  const pendingTapsRef = useRef<number>(0);
  const tapTimeoutRef = useRef<any>(null);

  // Save profile to local cache on changes
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(user));
      } catch {}
    }
  }, [user]);

  // Robust & Resilient Game Initializer with automatic fallbacks
  const initGame = useCallback(async () => {
    setLoading(true);
    setInitError(null);

    // Timeout safety: if server doesn't respond within 2.5s, fall back cleanly
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout - switching to offline mode')), 2500)
    );

    try {
      let referrerCode: string | undefined;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        referrerCode = params.get('ref') || params.get('tgWebAppStartParam') || undefined;
      }

      const authWork = async () => {
        let authResult;
        if (telegramBridge.isTelegramMiniApp()) {
          const initData = telegramBridge.getInitData();
          const startParam = telegramBridge.getStartParam() || referrerCode;
          try {
            authResult = await apiClient.loginTelegram(initData, startParam);
          } catch (tgErr) {
            console.warn('Telegram auth fallback to guest:', tgErr);
            authResult = await apiClient.loginGuest(undefined, referrerCode);
          }
        } else {
          authResult = await apiClient.loginGuest(undefined, referrerCode);
        }

        const profileData = await apiClient.getMyProfile();
        return profileData;
      };

      const result = (await Promise.race([authWork(), timeoutPromise])) as {
        user: UserGameProfile;
        missions: Mission[];
      };

      setUser(result.user);
      setMissions(result.missions);

      // Check offline earnings
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - result.user.lastActiveTimestamp) / 1000);
      if (elapsedSeconds > 30 && result.user.passiveIncomePerHour > 0) {
        const earned = Math.floor(
          (result.user.passiveIncomePerHour / 3600) * Math.min(elapsedSeconds, 28800)
        );
        if (earned > 10) {
          setOfflineEarnings({ amount: earned, seconds: elapsedSeconds });
        }
      }

      // Fetch leaderboard in background
      apiClient.getLeaderboard().then((lb) => setLeaderboard(lb.leaderboard)).catch(() => {});
    } catch (err: any) {
      console.warn('Server initialization fallback:', err.message);
      // Fallback: If we have no user, create starter offline profile immediately
      setUser((prev) => prev || createDefaultProfile());
      setInitError('Running in resilient offline mode');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Live Energy Regeneration Ticker (Smooth 1s loop)
  useEffect(() => {
    const interval = setInterval(() => {
      setUser((prev) => {
        if (!prev) return null;
        if (prev.energy >= prev.maxEnergy) return prev;

        const solarLvl = prev.buildings.solar_generator || 0;
        const regenBonus = 1 + solarLvl * 0.2;
        const newEnergy = Math.min(
          prev.maxEnergy,
          prev.energy + Math.ceil(prev.energyRegenPerSec * regenBonus)
        );

        if (newEnergy === prev.energy) return prev;
        return { ...prev, energy: newEnergy };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Periodic server sync every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible' && apiClient.getUserId()) {
        try {
          const profileData = await apiClient.getMyProfile();
          setUser(profileData.user);
          setMissions(profileData.missions);
        } catch {}
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Tap handler
  const handleTap = useCallback((_e: any, count: number = 1) => {
    setUser((prev) => {
      if (!prev || prev.energy < count) return prev;
      const earned = count * prev.tapPower;
      return {
        ...prev,
        energy: prev.energy - count,
        cosmicEnergy: prev.cosmicEnergy + earned,
        totalEnergyEarned: prev.totalEnergyEarned + earned,
        totalTaps: prev.totalTaps + count,
      };
    });

    pendingTapsRef.current += count;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(async () => {
      const tapsToFlush = pendingTapsRef.current;
      pendingTapsRef.current = 0;
      if (tapsToFlush <= 0) return;

      try {
        const res = await apiClient.tap(tapsToFlush);
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            cosmicEnergy: res.cosmicEnergy,
            energy: res.energy,
            planetLevel: res.planetLevel,
            planetStage: res.planetStage,
          };
        });
      } catch (err: any) {
        // Safe offline tap fallback: keep local balance
      }
    }, 150);
  }, []);

  // Purchase Building Upgrade
  const handleUpgradeBuilding = async (buildingId: any) => {
    try {
      soundManager.playUpgrade();
      telegramBridge.hapticTap('medium');
      const res = await apiClient.upgradeBuilding(buildingId);
      setUser(res.user);
    } catch (err: any) {
      alert(err.message || 'Upgrade failed');
    }
  };

  // Upgrade Tap Power
  const handleUpgradeTap = async () => {
    try {
      soundManager.playUpgrade();
      telegramBridge.hapticTap('medium');
      const res = await apiClient.upgradeTap();
      setUser(res.user);
    } catch (err: any) {
      alert(err.message || 'Tap upgrade failed');
    }
  };

  // Upgrade Energy Capacity
  const handleUpgradeCapacity = async () => {
    try {
      soundManager.playUpgrade();
      telegramBridge.hapticTap('medium');
      const res = await apiClient.upgradeEnergy();
      setUser(res.user);
    } catch (err: any) {
      alert(err.message || 'Capacity upgrade failed');
    }
  };

  // Evolve Planet Stage
  const handleEvolve = async () => {
    try {
      const res = await apiClient.evolvePlanet();
      setUser(res.user);
      setShowEvolution(false);
    } catch (err: any) {
      alert(err.message || 'Evolution failed');
    }
  };

  // Summon Alien Companion
  const handleSummonAlien = async () => {
    try {
      setIsSummoning(true);
      soundManager.playSummon();
      telegramBridge.hapticNotification('success');
      const res = await apiClient.summonAlien();
      setUser(res.user);
    } catch (err: any) {
      alert(err.message || 'Summon failed');
    } finally {
      setIsSummoning(false);
    }
  };

  // Claim Daily Login Reward
  const handleClaimDailyReward = async () => {
    try {
      soundManager.playFanfare();
      telegramBridge.hapticNotification('success');
      const res = await apiClient.claimDailyReward();
      setUser(res.user);
    } catch (err: any) {
      alert(err.message || 'Could not claim daily reward');
    }
  };

  // Claim Mission Reward
  const handleClaimMission = async (missionId: string) => {
    try {
      soundManager.playUpgrade();
      telegramBridge.hapticNotification('success');
      const res = await apiClient.claimMission(missionId);
      setUser(res.user);
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, isClaimed: true } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Claim mission failed');
    }
  };

  // Switch Planet World
  const handleSelectPlanetWorld = (worldId: string) => {
    setUser((prev) => (prev ? { ...prev, currentPlanetId: worldId } : null));
    soundManager.playUpgrade();
    telegramBridge.hapticTap('medium');
    setActiveTab('planet');
  };

  // Reset Session
  const handleResetAccount = async () => {
    if (confirm('Are you sure you want to reset your expedition? All planet progress will be restarted.')) {
      apiClient.clearSession();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CACHE_KEY);
      }
      window.location.reload();
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Fallback Loading Screen with Manual Refresh
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center text-slate-200 p-4">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
        <h1 className="text-xl font-bold font-display tracking-wide text-amber-300">MOONCOIN 🌕</h1>
        <p className="text-xs text-slate-400 mt-1 mb-4">Channelling cosmic starlight...</p>
        <button
          onClick={initGame}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  if (!user) return null;

  const nextStageId = (user.planetStage + 1) as PlanetStageId;
  const nextStageCfg = (PLANET_STAGES as Record<number, any>)[nextStageId];
  const canEvolve =
    Boolean(nextStageCfg) &&
    user.planetLevel >= nextStageCfg.requiredLevel &&
    user.totalEnergyEarned >= nextStageCfg.requiredTotalEnergy;

  const unclaimedMissionsCount = missions.filter(
    (m) => !m.isClaimed && m.currentCount >= m.targetCount
  ).length;

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header HUD */}
      <HeaderHUD
        user={user}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenSettings={() => setShowSettings(true)}
        onOpenEvolution={() => setShowEvolution(true)}
        onOpenDeployment={() => setShowDeployment(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        canEvolve={canEvolve}
      />

      {/* Main Game Content (Fluid, Natural Vertical Scrolling) */}
      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col pb-28">
        {activeTab === 'planet' && (
          <div className="flex flex-col items-center justify-start w-full py-2 space-y-3">
            {/* Centerpiece Interactive Planet */}
            <div className="w-full flex items-center justify-center">
              <PlanetCanvas user={user} onTap={handleTap} />
            </div>

            {/* Energy Reservoir & Quick Upgrades */}
            <div className="w-full max-w-md">
              <EnergyBar
                user={user}
                onUpgradeTap={handleUpgradeTap}
                onUpgradeCapacity={handleUpgradeCapacity}
              />
            </div>
          </div>
        )}

        {activeTab === 'upgrades' && (
          <BuildingShop user={user} onUpgradeBuilding={handleUpgradeBuilding} />
        )}

        {activeTab === 'aliens' && (
          <AlienCollection
            user={user}
            onSummonAlien={handleSummonAlien}
            isSummoning={isSummoning}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverPlanets user={user} onSelectPlanet={handleSelectPlanetWorld} />
        )}

        {activeTab === 'missions' && (
          <MissionsPanel
            user={user}
            missions={missions}
            onClaimMission={handleClaimMission}
            onClaimDailyReward={handleClaimDailyReward}
          />
        )}

        {activeTab === 'galaxy' && (
          <GalaxyLeaderboard
            user={user}
            leaderboard={leaderboard}
            onRefreshLeaderboard={() =>
              apiClient.getLeaderboard().then((lb) => setLeaderboard(lb.leaderboard))
            }
          />
        )}
      </main>

      {/* Bottom Ergonomic Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        unclaimedMissionsCount={unclaimedMissionsCount}
      />

      {/* Offline Idle Income Modal */}
      {offlineEarnings && (
        <OfflineIncomeModal
          amount={offlineEarnings.amount}
          elapsedSeconds={offlineEarnings.seconds}
          onClaim={() => {
            soundManager.playUpgrade();
            telegramBridge.hapticNotification('success');
            setOfflineEarnings(null);
          }}
        />
      )}

      {/* Planet Evolution Celebration Modal */}
      {showEvolution && (
        <EvolutionModal
          user={user}
          onEvolve={handleEvolve}
          onClose={() => setShowEvolution(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          user={user}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onClose={() => setShowSettings(false)}
          onResetAccount={handleResetAccount}
          onOpenDeployment={() => setShowDeployment(true)}
          onOpenAdmin={() => setShowAdmin(true)}
        />
      )}

      {/* Cloudflare & GitHub Deployment Hub + Webhook Modal */}
      {showDeployment && (
        <DeploymentModal onClose={() => setShowDeployment(false)} />
      )}

      {/* Master Admin Management Modal */}
      {showAdmin && user && (
        <AdminModal
          currentUser={user}
          onClose={() => setShowAdmin(false)}
          onRefreshCurrentPlayer={initGame}
        />
      )}
    </div>
  );
}
