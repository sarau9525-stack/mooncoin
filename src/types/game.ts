/**
 * Pocket Planet - Type Definitions
 */

export type PlanetStageId = 1 | 2 | 3 | 4 | 5 | 6;

export interface PlanetStageConfig {
  id: PlanetStageId;
  name: string;
  title: string;
  description: string;
  requiredLevel: number;
  requiredTotalEnergy: number;
  primaryColor: string;
  glowColor: string;
  atmosphereColor: string;
  features: string[];
}

export type BuildingId = 
  | 'crystal_mine'
  | 'solar_generator'
  | 'alien_habitat'
  | 'research_lab'
  | 'spaceport'
  | 'planet_shield'
  | 'galactic_observatory';

export interface BuildingConfig {
  id: BuildingId;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  baseIncomePerHour: number;
  incomeMultiplier: number;
  specialBonusDescription: string;
  unlockedAtStage: PlanetStageId;
  maxLevel: number;
  category: 'production' | 'energy' | 'science' | 'cosmic';
  icon: string;
}

export type AlienRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AlienConfig {
  id: string;
  name: string;
  title: string;
  species: string;
  rarity: AlienRarity;
  description: string;
  bonusType: 'energy_regen' | 'mine_boost' | 'tap_power' | 'passive_boost' | 'global_multiplier';
  baseBonusValue: number; // e.g. 0.10 for +10%
  bonusPerLevel: number;
  color: string;
  accentColor: string;
}

export interface PlayerAlien {
  id: string;
  level: number;
  unlockedAt: number;
  count: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardEnergy: number;
  rewardStardust: number;
  isClaimed: boolean;
  category: 'daily' | 'milestone' | 'social';
}

export interface DailyLoginReward {
  day: number;
  rewardEnergy: number;
  rewardStardust: number;
  hasAlienPod?: boolean;
}

export interface PlanetWorld {
  id: string;
  name: string;
  type: string;
  description: string;
  requiredPlayerLevel: number;
  requiredStardust: number;
  bonusEffect: string;
  isUnlocked: boolean;
  themeColor: string;
}

export interface UserGameProfile {
  id: string;
  username: string;
  telegramId?: string | number;
  avatarSeed: string;
  planetName: string;
  planetStage: PlanetStageId;
  planetLevel: number;
  cosmicEnergy: number;
  stardust: number;
  totalEnergyEarned: number;
  energy: number;
  maxEnergy: number;
  energyRegenPerSec: number;
  tapPower: number;
  passiveIncomePerHour: number;
  buildings: Record<BuildingId, number>;
  aliens: Record<string, PlayerAlien>;
  lastActiveTimestamp: number;
  lastDailyClaimTimestamp: number;
  dailyStreak: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralEarnings: number;
  totalTaps: number;
  createdAt: number;
  currentPlanetId: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  planetName: string;
  planetStage: PlanetStageId;
  planetLevel: number;
  totalEnergyEarned: number;
  passiveIncomePerHour: number;
  avatarSeed: string;
}

export interface TapResponse {
  success: boolean;
  cosmicEnergy: number;
  energy: number;
  energyEarned: number;
  tapPower: number;
  isCrit?: boolean;
  critMultiplier?: number;
}

export interface OfflineEarningsResult {
  accumulatedEnergy: number;
  accumulatedStardust: number;
  elapsedSeconds: number;
  cappedSeconds: number;
}
