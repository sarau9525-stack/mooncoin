import { BuildingConfig, BuildingId, PlanetStageConfig, PlanetStageId, AlienConfig, DailyLoginReward, PlanetWorld } from '../types/game';

// Configuration for Planet Evolution Stages (1 to 6)
export const PLANET_STAGES: Record<PlanetStageId, PlanetStageConfig> = {
  1: {
    id: 1,
    name: 'Cosmic Seed',
    title: 'Stage I: Barren Asteroid',
    description: 'A primitive space rock floating peacefully in the deep cosmic void. Tap to channel cosmic starlight.',
    requiredLevel: 1,
    requiredTotalEnergy: 0,
    primaryColor: '#64748b',
    glowColor: '#38bdf8',
    atmosphereColor: 'rgba(56, 189, 248, 0.15)',
    features: ['Starlight crater', 'Floating stardust particles', 'Cosmic core'],
  },
  2: {
    id: 2,
    name: 'Crystalline Rock',
    title: 'Stage II: Prismatic Core',
    description: 'Rich mineral veins emerge across the crust. Rare Stardust crystals begin crystallizing in deep fissures.',
    requiredLevel: 5,
    requiredTotalEnergy: 2500,
    primaryColor: '#0ea5e9',
    glowColor: '#06b6d4',
    atmosphereColor: 'rgba(14, 165, 233, 0.25)',
    features: ['Luminescent crystal clusters', 'Mineral glow fissures', 'Atmospheric veil'],
  },
  3: {
    id: 3,
    name: 'Verdant Terra',
    title: 'Stage III: Living Biosphere',
    description: 'A dense atmosphere develops. Bioluminescent moss and alien flora flourish in vibrant emerald patches.',
    requiredLevel: 12,
    requiredTotalEnergy: 25000,
    primaryColor: '#10b981',
    glowColor: '#34d399',
    atmosphereColor: 'rgba(16, 185, 129, 0.3)',
    features: ['Bioluminescent canopy', 'Flowing liquid veins', 'Pioneer research domes'],
  },
  4: {
    id: 4,
    name: 'Colony Prime',
    title: 'Stage IV: Technological Haven',
    description: 'The first orbital spaceport opens. Interstellar colonies link continents via glowing energy transport conduits.',
    requiredLevel: 25,
    requiredTotalEnergy: 150000,
    primaryColor: '#8b5cf6',
    glowColor: '#a855f7',
    atmosphereColor: 'rgba(139, 92, 246, 0.35)',
    features: ['Orbital ring stations', 'High-altitude transit beams', 'Alien habitat enclaves'],
  },
  5: {
    id: 5,
    name: 'Starlight Metropolis',
    title: 'Stage V: Planetary Megacity',
    description: 'A thriving planetary civilization. Towering crystal spires harvest stellar rays, guarded by an energy aegis.',
    requiredLevel: 45,
    requiredTotalEnergy: 1000000,
    primaryColor: '#f59e0b',
    glowColor: '#fbbf24',
    atmosphereColor: 'rgba(245, 158, 11, 0.4)',
    features: ['Planetary energy shield', 'Deep space launch arrays', 'Stellar research citadels'],
  },
  6: {
    id: 6,
    name: 'Galactic Megastructure',
    title: 'Stage VI: Ascended Cradle',
    description: 'The planet harnesses Dyson-level cosmic energy. Glowing megastructures orbit in harmonized geometric perfection.',
    requiredLevel: 75,
    requiredTotalEnergy: 10000000,
    primaryColor: '#ec4899',
    glowColor: '#f43f5e',
    atmosphereColor: 'rgba(236, 72, 153, 0.45)',
    features: ['Orbital Dyson rings', 'Sub-space warp gate', 'Infinite cosmic conduit'],
  },
};

// Configuration for all 7 Buildings
export const BUILDINGS_CONFIG: Record<BuildingId, BuildingConfig> = {
  crystal_mine: {
    id: 'crystal_mine',
    name: 'Crystal Mine',
    description: 'Excavates primal crystal geodes deep beneath the mantle, generating steady Cosmic Energy.',
    baseCost: 20,
    costMultiplier: 1.15,
    baseIncomePerHour: 60,
    incomeMultiplier: 1.12,
    specialBonusDescription: '+60 Energy/hr base output',
    unlockedAtStage: 1,
    maxLevel: 100,
    category: 'production',
    icon: 'Gem',
  },
  solar_generator: {
    id: 'solar_generator',
    name: 'Solar Generator',
    description: 'Captures solar wind and cosmic radiation, providing passive power and boosting energy regen.',
    baseCost: 150,
    costMultiplier: 1.18,
    baseIncomePerHour: 240,
    incomeMultiplier: 1.14,
    specialBonusDescription: '+240 Energy/hr & boosts regen rate',
    unlockedAtStage: 1,
    maxLevel: 80,
    category: 'energy',
    icon: 'Sun',
  },
  alien_habitat: {
    id: 'alien_habitat',
    name: 'Alien Habitat',
    description: 'A climate-controlled biodome where rare alien companions can nest and empower your civilization.',
    baseCost: 800,
    costMultiplier: 1.20,
    baseIncomePerHour: 900,
    incomeMultiplier: 1.15,
    specialBonusDescription: '+900 Energy/hr & expands alien capacity',
    unlockedAtStage: 2,
    maxLevel: 60,
    category: 'science',
    icon: 'Sprout',
  },
  research_lab: {
    id: 'research_lab',
    name: 'Research Laboratory',
    description: 'Analyzes alien technology and cosmic anomalies to dramatically enhance manual tap efficiency.',
    baseCost: 3500,
    costMultiplier: 1.22,
    baseIncomePerHour: 3200,
    incomeMultiplier: 1.16,
    specialBonusDescription: '+3,200 Energy/hr & boosts tap power',
    unlockedAtStage: 2,
    maxLevel: 50,
    category: 'science',
    icon: 'FlaskConical',
  },
  spaceport: {
    id: 'spaceport',
    name: 'Spaceport Launchpad',
    description: 'A launch terminal for interstellar freighters, enabling planetary expeditions and trade routes.',
    baseCost: 18000,
    costMultiplier: 1.25,
    baseIncomePerHour: 14000,
    incomeMultiplier: 1.18,
    specialBonusDescription: '+14,000 Energy/hr & unlocks deep space expeditions',
    unlockedAtStage: 3,
    maxLevel: 40,
    category: 'cosmic',
    icon: 'Rocket',
  },
  planet_shield: {
    id: 'planet_shield',
    name: 'Aegis Planet Shield',
    description: 'A shimmering magnetic barrier shielding the colony from cosmic storms and preserving energy reserves.',
    baseCost: 85000,
    costMultiplier: 1.28,
    baseIncomePerHour: 55000,
    incomeMultiplier: 1.20,
    specialBonusDescription: '+55,000 Energy/hr & visual magnetic shield',
    unlockedAtStage: 4,
    maxLevel: 30,
    category: 'cosmic',
    icon: 'Shield',
  },
  galactic_observatory: {
    id: 'galactic_observatory',
    name: 'Galactic Observatory',
    description: 'Deep-space supertelescope peering into the origin of galaxies, yielding immense cosmic insight.',
    baseCost: 400000,
    costMultiplier: 1.30,
    baseIncomePerHour: 220000,
    incomeMultiplier: 1.22,
    specialBonusDescription: '+220,000 Energy/hr & critical tap chance',
    unlockedAtStage: 5,
    maxLevel: 25,
    category: 'cosmic',
    icon: 'Telescope',
  },
};

// 5 Collectible Alien Companions
export const ALIENS_CONFIG: Record<string, AlienConfig> = {
  solar_sprite: {
    id: 'solar_sprite',
    name: 'Solar Sprite',
    title: 'Light Dancer',
    species: 'Lumina Sylph',
    rarity: 'common',
    description: 'A playful being composed of condensed solar photons. Accelerates planetary energy recovery.',
    bonusType: 'energy_regen',
    baseBonusValue: 0.15, // +15% energy regen
    bonusPerLevel: 0.05,
    color: '#fbbf24',
    accentColor: '#f59e0b',
  },
  crystal_mole: {
    id: 'crystal_mole',
    name: 'Crystal Mole',
    title: 'Lithic Burrower',
    species: 'Silica Talpa',
    rarity: 'uncommon',
    description: 'Burrows through gemstone tunnels, unearthing rich Stardust geodes and enhancing mines.',
    bonusType: 'mine_boost',
    baseBonusValue: 0.20, // +20% mine output
    bonusPerLevel: 0.08,
    color: '#38bdf8',
    accentColor: '#0284c7',
  },
  quantum_owl: {
    id: 'quantum_owl',
    name: 'Quantum Owl',
    title: 'Observer of Realities',
    species: 'Chrono Strig',
    rarity: 'rare',
    description: 'Exists simultaneously in three timelines. Significantly enhances tap resonance and research.',
    bonusType: 'tap_power',
    baseBonusValue: 0.25, // +25% tap power
    bonusPerLevel: 0.10,
    color: '#a855f7',
    accentColor: '#7e22ce',
  },
  nebula_fox: {
    id: 'nebula_fox',
    name: 'Nebula Fox',
    title: 'Stardust Prowler',
    species: 'Astra Vulpes',
    rarity: 'epic',
    description: 'Leaves a trail of swirling cosmic dust. Massively amplifies idle colony revenue across all sectors.',
    bonusType: 'passive_boost',
    baseBonusValue: 0.35, // +35% passive income
    bonusPerLevel: 0.12,
    color: '#f43f5e',
    accentColor: '#e11d48',
  },
  gravity_slug: {
    id: 'gravity_slug',
    name: 'Gravity Slug',
    title: 'Singularity Sovereign',
    species: 'Baro Gastropod',
    rarity: 'legendary',
    description: 'Carries a micro-black hole in its shell. Warps space-time to multiply total planetary energy output.',
    bonusType: 'global_multiplier',
    baseBonusValue: 0.50, // +50% global multiplier
    bonusPerLevel: 0.15,
    color: '#10b981',
    accentColor: '#059669',
  },
};

// 7-Day Login Rewards
export const DAILY_LOGIN_REWARDS: DailyLoginReward[] = [
  { day: 1, rewardEnergy: 500, rewardStardust: 5 },
  { day: 2, rewardEnergy: 1500, rewardStardust: 10 },
  { day: 3, rewardEnergy: 4000, rewardStardust: 20 },
  { day: 4, rewardEnergy: 10000, rewardStardust: 35 },
  { day: 5, rewardEnergy: 25000, rewardStardust: 50, hasAlienPod: true },
  { day: 6, rewardEnergy: 60000, rewardStardust: 80 },
  { day: 7, rewardEnergy: 150000, rewardStardust: 150, hasAlienPod: true },
];

// Exploration Planets in the Galaxy
export const PLANET_WORLDS: PlanetWorld[] = [
  {
    id: 'kepler_prime',
    name: 'Kepler-Prime',
    type: 'Verdant World',
    description: 'Your tranquil home planet. Abundant with liquid reservoirs, mineral spires, and welcoming atmosphere.',
    requiredPlayerLevel: 1,
    requiredStardust: 0,
    bonusEffect: '1.0x Base Cosmic Flow',
    isUnlocked: true,
    themeColor: '#38bdf8',
  },
  {
    id: 'crystal_moon',
    name: 'Lunaria Prism',
    type: 'Crystal Moon',
    description: 'A low-gravity satellite encrusted in pure resonate quartz that refracts stellar radiation.',
    requiredPlayerLevel: 15,
    requiredStardust: 50,
    bonusEffect: '+25% Crystal Mine Production & +10% Crit Chance',
    isUnlocked: false,
    themeColor: '#a855f7',
  },
  {
    id: 'promethea_prime',
    name: 'Promethea',
    type: 'Volcanic World',
    description: 'A geothermally supercharged world with molten obsidian oceans and intense thermal convection.',
    requiredPlayerLevel: 30,
    requiredStardust: 150,
    bonusEffect: '+40% Energy Regeneration Rate',
    isUnlocked: false,
    themeColor: '#f97316',
  },
  {
    id: 'glacius_cryo',
    name: 'Glacius',
    type: 'Frozen World',
    description: 'An ancient ice shell preserving prehistoric alien artifacts and super-cooled quantum circuits.',
    requiredPlayerLevel: 50,
    requiredStardust: 350,
    bonusEffect: '+50% Tap Power Multiplier',
    isUnlocked: false,
    themeColor: '#06b6d4',
  },
  {
    id: 'xylar_ruins',
    name: 'Xylar-IV',
    type: 'Ancient Ruins',
    description: 'Megastructure remnants left by a Type-III cosmic civilization with infinite energy conduits.',
    requiredPlayerLevel: 70,
    requiredStardust: 800,
    bonusEffect: '+100% Global Idle Energy Production',
    isUnlocked: false,
    themeColor: '#ec4899',
  },
];

// Calculation helper functions
export function calculateBuildingCost(buildingId: BuildingId, currentLevel: number): number {
  const config = BUILDINGS_CONFIG[buildingId];
  if (!config) return 0;
  return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
}

export function calculateBuildingIncomePerHour(buildingId: BuildingId, currentLevel: number): number {
  const config = BUILDINGS_CONFIG[buildingId];
  if (!config || currentLevel <= 0) return 0;
  return Math.floor(config.baseIncomePerHour * currentLevel * Math.pow(config.incomeMultiplier, currentLevel - 1));
}

export function calculateTapUpgradeCost(currentTapPower: number): number {
  return Math.floor(100 * Math.pow(1.35, currentTapPower - 1));
}

export function calculateEnergyCapacityCost(currentCapacity: number): number {
  const tier = Math.floor((currentCapacity - 1000) / 250);
  return Math.floor(150 * Math.pow(1.28, tier));
}

export function calculateLevelFromTotalEnergy(totalEnergy: number): number {
  // Balanced formula: Level 1 at 0, Level 5 at 2.5k, Level 15 at 40k, Level 25 at 150k
  if (totalEnergy <= 0) return 1;
  const level = Math.floor(Math.pow(totalEnergy / 100, 0.38)) + 1;
  return Math.max(1, level);
}

export function determinePlanetStage(planetLevel: number, totalEnergy: number): PlanetStageId {
  if (planetLevel >= 75 && totalEnergy >= 10000000) return 6;
  if (planetLevel >= 45 && totalEnergy >= 1000000) return 5;
  if (planetLevel >= 25 && totalEnergy >= 150000) return 4;
  if (planetLevel >= 12 && totalEnergy >= 25000) return 3;
  if (planetLevel >= 5 && totalEnergy >= 2500) return 2;
  return 1;
}
