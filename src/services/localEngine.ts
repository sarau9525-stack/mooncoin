// Client-side fallback engine for MOONCOIN
// Ensures 100% flawless gameplay offline or on static Cloudflare Pages / GitHub Pages / CDNs

import {
  BuildingId,
  LeaderboardEntry,
  Mission,
  PlanetStageId,
  TapResponse,
  UserGameProfile,
} from '../types/game';
import {
  ALIENS_CONFIG,
  BUILDINGS_CONFIG,
  DAILY_LOGIN_REWARDS,
  PLANET_STAGES,
  calculateBuildingCost,
  calculateBuildingIncomePerHour,
  calculateEnergyCapacityCost,
  calculateLevelFromTotalEnergy,
  calculateTapUpgradeCost,
  determinePlanetStage,
} from '../config/gameConfig';

const LOCAL_STORAGE_KEY = 'mooncoin_local_user_v2';
const MISSIONS_KEY = 'mooncoin_local_missions_v2';

export class LocalGameEngine {
  private user: UserGameProfile | null = null;
  private missions: Mission[] = [];

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
    try {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedUser) {
        this.user = JSON.parse(savedUser);
      }
      const savedMissions = localStorage.getItem(MISSIONS_KEY);
      if (savedMissions) {
        this.missions = JSON.parse(savedMissions);
      }
    } catch {
      // Ignore parse errors
    }
  }

  private save() {
    if (typeof window === 'undefined' || !this.user) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.user));
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(this.missions));
    } catch {
      // Storage quota or private mode fallback
    }
  }

  public getOrCreateUser(username?: string, telegramId?: string | number): { user: UserGameProfile; missions: Mission[] } {
    if (!this.user) {
      const uname = username?.trim() || `CosmoCadet_${Math.floor(1000 + Math.random() * 9000)}`;
      this.user = {
        id: telegramId ? `tg_${telegramId}` : `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: uname,
        telegramId,
        avatarSeed: `seed_${Math.floor(Math.random() * 1000)}`,
        planetName: `${uname.split(' ')[0]}'s World`,
        planetStage: 1,
        planetLevel: 1,
        cosmicEnergy: 50,
        stardust: 15,
        totalEnergyEarned: 50,
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
        tapUpgradeLevel: 1,
        energyCapacityLevel: 1,
        totalTaps: 0,
        dailyLoginStreak: 1,
        lastDailyLoginDate: new Date().toISOString().split('T')[0],
        referralCode: `MOON_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        referredCount: 0,
        referralEarnings: 0,
        createdAt: Date.now(),
        lastActiveTimestamp: Date.now(),
      };
      this.missions = this.createDefaultMissions();
      this.save();
    } else {
      this.syncUser();
    }

    if (!this.missions || this.missions.length === 0) {
      this.missions = this.createDefaultMissions();
      this.save();
    }

    return { user: this.user, missions: this.missions };
  }

  public syncUser(): { offlineEarned: number } {
    if (!this.user) return { offlineEarned: 0 };
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - this.user.lastActiveTimestamp) / 1000));
    const cappedSeconds = Math.min(elapsedSeconds, 28800); // 8h max

    const multipliers = this.calculateMultipliers();
    const effectiveRegen = (this.user.energyRegenPerSec + (this.user.buildings.solar_generator * 0.2)) * multipliers.energyRegen;
    const gained = Math.floor(cappedSeconds * effectiveRegen);
    this.user.energy = Math.min(this.user.maxEnergy, this.user.energy + gained);

    let offlineEarned = 0;
    if (this.user.passiveIncomePerHour > 0 && cappedSeconds > 5) {
      offlineEarned = Math.floor((this.user.passiveIncomePerHour / 3600) * cappedSeconds * multipliers.passiveBoost);
      this.user.cosmicEnergy += offlineEarned;
      this.user.totalEnergyEarned += offlineEarned;
      this.user.planetLevel = calculateLevelFromTotalEnergy(this.user.totalEnergyEarned);
      this.user.planetStage = determinePlanetStage(this.user.planetLevel, this.user.totalEnergyEarned);
    }

    this.user.lastActiveTimestamp = now;
    this.save();
    return { offlineEarned };
  }

  private calculateMultipliers() {
    let energyRegen = 1.0;
    let tapPower = 1.0;
    let passiveBoost = 1.0;
    let globalMultiplier = 1.0;

    if (this.user?.aliens) {
      Object.entries(this.user.aliens).forEach(([id, count]) => {
        if (!count || count <= 0) return;
        const cfg = ALIENS_CONFIG[id as keyof typeof ALIENS_CONFIG];
        if (!cfg) return;
        const effect = cfg.bonusPerUnit * count;
        if (cfg.bonusType === 'energy_regen') energyRegen += effect;
        if (cfg.bonusType === 'tap_power') tapPower += effect;
        if (cfg.bonusType === 'passive_boost') passiveBoost += effect;
        if (cfg.bonusType === 'all_income') globalMultiplier += effect;
      });
    }

    return { energyRegen, tapPower, passiveBoost: passiveBoost * globalMultiplier, globalMultiplier };
  }

  public tap(count: number = 1): TapResponse & { planetLevel: number; planetStage: PlanetStageId } {
    if (!this.user) throw new Error('No local user');
    this.syncUser();

    const actualCount = Math.min(count, 50);
    const multipliers = this.calculateMultipliers();
    const effectiveTapPower = Math.max(1, Math.floor(this.user.tapPower * multipliers.tapPower * multipliers.globalMultiplier));

    const energyNeeded = actualCount;
    const canUse = Math.min(this.user.energy, energyNeeded);
    if (canUse <= 0) {
      return {
        earned: 0,
        energyRemaining: 0,
        cosmicEnergy: this.user.cosmicEnergy,
        stardust: this.user.stardust,
        planetLevel: this.user.planetLevel,
        planetStage: this.user.planetStage,
      };
    }

    this.user.energy -= canUse;
    const earned = canUse * effectiveTapPower;
    this.user.cosmicEnergy += earned;
    this.user.totalEnergyEarned += earned;
    this.user.totalTaps += canUse;

    // Critical stardust drop chance
    let stardustGained = 0;
    if (Math.random() < 0.05 * actualCount) {
      stardustGained = 1;
      this.user.stardust += 1;
    }

    // Check level progression
    const prevLevel = this.user.planetLevel;
    this.user.planetLevel = calculateLevelFromTotalEnergy(this.user.totalEnergyEarned);
    const leveledUp = this.user.planetLevel > prevLevel;
    this.user.planetStage = determinePlanetStage(this.user.planetLevel, this.user.totalEnergyEarned);

    this.updateMissionProgress('tap_100', canUse);
    this.save();

    return {
      earned,
      energyRemaining: this.user.energy,
      cosmicEnergy: this.user.cosmicEnergy,
      stardust: this.user.stardust,
      stardustGained,
      leveledUp,
      newLevel: this.user.planetLevel,
      planetLevel: this.user.planetLevel,
      planetStage: this.user.planetStage,
    };
  }

  public upgradeBuilding(buildingId: BuildingId): { success: boolean; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');
    const cfg = BUILDINGS_CONFIG[buildingId];
    if (!cfg) throw new Error('Invalid building');

    const currentLvl = this.user.buildings[buildingId] || 0;
    const cost = calculateBuildingCost(cfg.baseCost, cfg.costMultiplier, currentLvl);
    if (this.user.cosmicEnergy < cost) throw new Error('Not enough Cosmic Energy');

    this.user.cosmicEnergy -= cost;
    this.user.buildings[buildingId] = currentLvl + 1;

    // Recalculate passive income
    let totalPassive = 0;
    Object.entries(this.user.buildings).forEach(([bId, lvl]) => {
      const bCfg = BUILDINGS_CONFIG[bId as BuildingId];
      if (bCfg && lvl > 0) {
        totalPassive += calculateBuildingIncomePerHour(bCfg.baseIncomePerHour, bCfg.incomeMultiplier, lvl);
      }
    });
    this.user.passiveIncomePerHour = totalPassive;

    this.updateMissionProgress('build_crystal', 1);
    this.save();
    return { success: true, user: this.user };
  }

  public upgradeTap(): { success: boolean; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');
    const cost = calculateTapUpgradeCost(this.user.tapUpgradeLevel);
    if (this.user.cosmicEnergy < cost) throw new Error('Not enough Cosmic Energy');

    this.user.cosmicEnergy -= cost;
    this.user.tapUpgradeLevel += 1;
    this.user.tapPower += 1;
    this.save();
    return { success: true, user: this.user };
  }

  public upgradeEnergy(): { success: boolean; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');
    const cost = calculateEnergyCapacityCost(this.user.energyCapacityLevel);
    if (this.user.cosmicEnergy < cost) throw new Error('Not enough Cosmic Energy');

    this.user.cosmicEnergy -= cost;
    this.user.energyCapacityLevel += 1;
    this.user.maxEnergy += 500;
    this.user.energy = this.user.maxEnergy;
    this.save();
    return { success: true, user: this.user };
  }

  public evolvePlanet(): { success: boolean; newStage: PlanetStageId; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');
    const nextStage = (this.user.planetStage + 1) as PlanetStageId;
    const cfg = PLANET_STAGES[nextStage];
    if (!cfg) throw new Error('Already at maximum evolution stage');

    if (this.user.planetLevel < cfg.requiredLevel || this.user.totalEnergyEarned < cfg.requiredTotalEnergy) {
      throw new Error('Evolution requirements not met');
    }

    this.user.planetStage = nextStage;
    this.user.stardust += 50; // Evolution stardust reward
    this.save();
    return { success: true, newStage: nextStage, user: this.user };
  }

  public summonAlien(): { success: boolean; alien: any; isNew: boolean; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');
    const cost = 20;
    if (this.user.stardust < cost) throw new Error('Not enough Stardust');

    this.user.stardust -= cost;
    const alienKeys = Object.keys(ALIENS_CONFIG);
    const chosenKey = alienKeys[Math.floor(Math.random() * alienKeys.length)];
    const chosenAlien = ALIENS_CONFIG[chosenKey as keyof typeof ALIENS_CONFIG];

    const prevCount = this.user.aliens[chosenKey] || 0;
    this.user.aliens[chosenKey] = prevCount + 1;
    this.save();

    return {
      success: true,
      alien: chosenAlien,
      isNew: prevCount === 0,
      user: this.user,
    };
  }

  public claimDailyReward(): { success: boolean; reward: any; streak: number; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');
    const dayIndex = ((this.user.dailyLoginStreak - 1) % DAILY_LOGIN_REWARDS.length);
    const reward = DAILY_LOGIN_REWARDS[dayIndex];

    this.user.cosmicEnergy += reward.cosmicEnergy;
    this.user.stardust += reward.stardust;
    this.user.dailyLoginStreak += 1;
    this.save();

    return {
      success: true,
      reward,
      streak: this.user.dailyLoginStreak,
      user: this.user,
    };
  }

  public getMissions(): { missions: Mission[] } {
    return { missions: this.missions };
  }

  public claimMission(missionId: string): { success: boolean; rewardEnergy: number; rewardStardust: number; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');
    const mission = this.missions.find((m) => m.id === missionId);
    if (!mission || mission.isClaimed || mission.currentCount < mission.targetCount) {
      throw new Error('Mission not ready to claim');
    }

    mission.isClaimed = true;
    this.user.cosmicEnergy += mission.rewardEnergy;
    this.user.stardust += mission.rewardStardust;
    this.save();

    return {
      success: true,
      rewardEnergy: mission.rewardEnergy,
      rewardStardust: mission.rewardStardust,
      user: this.user,
    };
  }

  public getLeaderboard(): { leaderboard: LeaderboardEntry[] } {
    const defaultLeaderboard: LeaderboardEntry[] = [
      { rank: 1, userId: 'seed-1', username: 'NovaVoyager', planetName: 'Astraea', planetStage: 5, planetLevel: 62, totalEnergy: 4800000, passiveIncomePerHour: 340000 },
      { rank: 2, userId: 'seed-2', username: 'CosmoKitten', planetName: 'Purrseus-IV', planetStage: 4, planetLevel: 44, totalEnergy: 1850000, passiveIncomePerHour: 185000 },
      { rank: 3, userId: 'seed-3', username: 'MoonMaster', planetName: 'Luna Prime', planetStage: 4, planetLevel: 38, totalEnergy: 750000, passiveIncomePerHour: 75000 },
      { rank: 4, userId: 'seed-4', username: 'AstroBunny', planetName: 'Luna Haven', planetStage: 3, planetLevel: 25, totalEnergy: 210000, passiveIncomePerHour: 22000 },
      { rank: 5, userId: 'seed-5', username: 'SolarFlare', planetName: 'Ignis-7', planetStage: 2, planetLevel: 12, totalEnergy: 45000, passiveIncomePerHour: 5400 },
    ];

    if (this.user) {
      const userEntry: LeaderboardEntry = {
        rank: 6,
        userId: this.user.id,
        username: this.user.username,
        planetName: this.user.planetName,
        planetStage: this.user.planetStage,
        planetLevel: this.user.planetLevel,
        totalEnergy: this.user.totalEnergyEarned,
        passiveIncomePerHour: this.user.passiveIncomePerHour,
        isCurrentUser: true,
      };
      return { leaderboard: [...defaultLeaderboard, userEntry].sort((a, b) => b.totalEnergy - a.totalEnergy) };
    }

    return { leaderboard: defaultLeaderboard };
  }

  // Admin adjustments
  public adminAdjustUser(params: {
    cosmicEnergy?: number;
    stardust?: number;
    planetLevel?: number;
    planetStage?: PlanetStageId;
    refillEnergy?: boolean;
    resetProgress?: boolean;
  }): { success: boolean; user: UserGameProfile } {
    if (!this.user) throw new Error('No local user');

    if (params.resetProgress) {
      this.user.cosmicEnergy = 0;
      this.user.totalEnergyEarned = 0;
      this.user.planetLevel = 1;
      this.user.planetStage = 1;
      this.user.energy = this.user.maxEnergy;
      this.save();
      return { success: true, user: this.user };
    }

    if (params.cosmicEnergy !== undefined) {
      this.user.cosmicEnergy = Math.max(0, this.user.cosmicEnergy + params.cosmicEnergy);
      if (params.cosmicEnergy > 0) {
        this.user.totalEnergyEarned += params.cosmicEnergy;
      }
    }
    if (params.stardust !== undefined) {
      this.user.stardust = Math.max(0, this.user.stardust + params.stardust);
    }
    if (params.planetLevel !== undefined) {
      this.user.planetLevel = Math.max(1, params.planetLevel);
    }
    if (params.planetStage !== undefined) {
      this.user.planetStage = params.planetStage;
    }
    if (params.refillEnergy) {
      this.user.energy = this.user.maxEnergy;
    }

    this.save();
    return { success: true, user: this.user };
  }

  private updateMissionProgress(category: string, increment: number) {
    this.missions.forEach((m) => {
      if (m.category === category && !m.isClaimed) {
        m.currentCount = Math.min(m.targetCount, m.currentCount + increment);
      }
    });
    this.save();
  }

  private createDefaultMissions(): Mission[] {
    return [
      { id: 'm_tap_100', title: 'Cosmic Channeler', description: 'Tap your moon 100 times to gather energy.', targetCount: 100, currentCount: 0, rewardEnergy: 500, rewardStardust: 5, isClaimed: false, category: 'tap_100' },
      { id: 'm_mine_1', title: 'First Excavation', description: 'Construct or upgrade a Crystal Mine.', targetCount: 1, currentCount: 0, rewardEnergy: 300, rewardStardust: 3, isClaimed: false, category: 'build_crystal' },
      { id: 'm_reach_lvl5', title: 'Planetary Ascension', description: 'Reach Planet Level 5.', targetCount: 5, currentCount: 1, rewardEnergy: 1500, rewardStardust: 10, isClaimed: false, category: 'reach_level_5' },
    ];
  }
}

export const localGameEngine = new LocalGameEngine();
