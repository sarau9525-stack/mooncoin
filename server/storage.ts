import fs from 'fs';
import path from 'path';
import {
  BuildingId,
  LeaderboardEntry,
  Mission,
  PlanetStageId,
  UserGameProfile,
} from '../src/types/game';
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
} from '../src/config/gameConfig';

interface StorageData {
  users: Record<string, UserGameProfile>;
  missions: Record<string, Mission[]>;
  referrals: Record<string, string[]>; // referrerId -> referredUserIds
  lastSaved: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pocket_planet_db.json');

// Mock players to make Galaxy Leaderboard feel alive and competitive
const SEED_GALAXY_PLAYERS: Partial<UserGameProfile>[] = [
  {
    id: 'seed-nova-99',
    username: 'NovaVoyager',
    planetName: 'Astraea',
    planetStage: 5,
    planetLevel: 58,
    totalEnergyEarned: 3840000,
    passiveIncomePerHour: 340000,
    avatarSeed: 'seed_nova',
  },
  {
    id: 'seed-starlord',
    username: 'StarLord_X',
    planetName: 'Xandar Prime',
    planetStage: 5,
    planetLevel: 49,
    totalEnergyEarned: 1950000,
    passiveIncomePerHour: 185000,
    avatarSeed: 'seed_star',
  },
  {
    id: 'seed-celestial',
    username: 'CosmoKitten',
    planetName: 'Purrseus-IV',
    planetStage: 4,
    planetLevel: 36,
    totalEnergyEarned: 640000,
    passiveIncomePerHour: 72000,
    avatarSeed: 'seed_kitten',
  },
  {
    id: 'seed-orion',
    username: 'OrionNebula',
    planetName: 'Helios Sphere',
    planetStage: 4,
    planetLevel: 28,
    totalEnergyEarned: 220000,
    passiveIncomePerHour: 32000,
    avatarSeed: 'seed_orion',
  },
  {
    id: 'seed-quantum',
    username: 'QuantumFlux',
    planetName: 'ChronoTerra',
    planetStage: 3,
    planetLevel: 19,
    totalEnergyEarned: 78000,
    passiveIncomePerHour: 14500,
    avatarSeed: 'seed_quantum',
  },
  {
    id: 'seed-astropaw',
    username: 'AstroBunny',
    planetName: 'Luna Haven',
    planetStage: 3,
    planetLevel: 14,
    totalEnergyEarned: 35000,
    passiveIncomePerHour: 7400,
    avatarSeed: 'seed_bunny',
  },
  {
    id: 'seed-solaris',
    username: 'SolarFlare',
    planetName: 'Ignis-7',
    planetStage: 2,
    planetLevel: 8,
    totalEnergyEarned: 8200,
    passiveIncomePerHour: 1800,
    avatarSeed: 'seed_solar',
  },
];

export class GameStorage {
  private data: StorageData = {
    users: {},
    missions: {},
    referrals: {},
    lastSaved: Date.now(),
  };

  private tapRateLimiter: Record<string, { lastTap: number; tapCountInWindow: number }> = {};

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialGalaxy();
        this.save();
      }
    } catch (err) {
      console.warn('Could not read existing database, initializing fresh storage:', err);
      this.seedInitialGalaxy();
    }
  }

  private seedInitialGalaxy() {
    for (const seed of SEED_GALAXY_PLAYERS) {
      const fullProfile: UserGameProfile = {
        id: seed.id!,
        username: seed.username!,
        planetName: seed.planetName!,
        planetStage: seed.planetStage as PlanetStageId,
        planetLevel: seed.planetLevel!,
        cosmicEnergy: Math.floor(seed.totalEnergyEarned! * 0.15),
        stardust: seed.planetLevel! * 8,
        totalEnergyEarned: seed.totalEnergyEarned!,
        energy: 1000,
        maxEnergy: 1000 + seed.planetLevel! * 50,
        energyRegenPerSec: 1 + Math.floor(seed.planetLevel! / 10),
        tapPower: 1 + Math.floor(seed.planetLevel! / 5),
        passiveIncomePerHour: seed.passiveIncomePerHour!,
        buildings: {
          crystal_mine: Math.min(50, Math.floor(seed.planetLevel! * 0.8)),
          solar_generator: Math.min(40, Math.floor(seed.planetLevel! * 0.6)),
          alien_habitat: Math.min(30, Math.floor(seed.planetLevel! * 0.4)),
          research_lab: Math.min(25, Math.floor(seed.planetLevel! * 0.3)),
          spaceport: Math.min(20, Math.floor(seed.planetLevel! * 0.2)),
          planet_shield: Math.min(15, Math.floor(seed.planetLevel! * 0.15)),
          galactic_observatory: Math.min(10, Math.floor(seed.planetLevel! * 0.1)),
        },
        aliens: {},
        lastActiveTimestamp: Date.now() - 3600000,
        lastDailyClaimTimestamp: Date.now() - 86400000,
        dailyStreak: 3,
        referralCode: seed.username!.slice(0, 6).toUpperCase() + '77',
        referralCount: 4,
        referralEarnings: 10000,
        totalTaps: seed.planetLevel! * 120,
        createdAt: Date.now() - 86400000 * 7,
        currentPlanetId: 'kepler_prime',
        avatarSeed: seed.avatarSeed || 'seed',
      };
      this.data.users[seed.id!] = fullProfile;
    }
  }

  public save() {
    try {
      this.data.lastSaved = Date.now();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  // --- USER AUTHENTICATION & PROFILE CREATION ---

  public getOrCreateUser(params: {
    telegramId?: string | number;
    username?: string;
    avatarSeed?: string;
    isGuest?: boolean;
    referrerCode?: string;
  }): { user: UserGameProfile; isNew: boolean } {
    const idKey = params.telegramId
      ? `tg_${params.telegramId}`
      : `web_${params.username ? params.username.toLowerCase().replace(/[^a-z0-9]/g, '') : 'guest_' + Math.random().toString(36).substring(2, 9)}`;

    // Check if user exists by telegramId or idKey
    let existingUser: UserGameProfile | undefined = this.data.users[idKey];
    if (!existingUser && params.telegramId) {
      existingUser = Object.values(this.data.users).find(
        (u) => String(u.telegramId) === String(params.telegramId)
      );
    }

    if (existingUser) {
      // Sync offline progress
      this.syncUserInternal(existingUser);
      this.save();
      return { user: existingUser, isNew: false };
    }

    // Create new player profile
    const username =
      params.username && params.username.trim()
        ? params.username.trim()
        : `CosmoCadet_${Math.floor(1000 + Math.random() * 9000)}`;

    const referralCode = `PKT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newUser: UserGameProfile = {
      id: idKey,
      username,
      telegramId: params.telegramId,
      avatarSeed: params.avatarSeed || `seed_${Math.floor(Math.random() * 1000)}`,
      planetName: `${username.split(' ')[0]}'s World`,
      planetStage: 1,
      planetLevel: 1,
      cosmicEnergy: 0,
      stardust: 10, // Starter bonus crystals
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
      referralCode,
      referralCount: 0,
      referralEarnings: 0,
      totalTaps: 0,
      createdAt: Date.now(),
      currentPlanetId: 'kepler_prime',
    };

    this.data.users[idKey] = newUser;
    this.initMissionsForUser(idKey);

    // Process referral if supplied and not self-referral
    if (params.referrerCode) {
      this.processReferralAttribution(params.referrerCode, idKey);
    }

    this.save();
    return { user: newUser, isNew: true };
  }

  public getUser(userId: string): UserGameProfile | null {
    const user = this.data.users[userId];
    if (!user) return null;
    this.syncUserInternal(user);
    return user;
  }

  // --- PROGRESSION & SYNC LOGIC ---

  private syncUserInternal(user: UserGameProfile): { offlineEarned: number; elapsedSeconds: number } {
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - user.lastActiveTimestamp) / 1000));
    
    // Cap offline calculation to 8 hours (28,800 seconds) to prevent infinite accumulation
    const cappedSeconds = Math.min(elapsedSeconds, 28800);

    // Calculate alien multipliers
    const multipliers = this.calculateAlienMultipliers(user);

    // Regenerate Energy
    const effectiveRegen = (user.energyRegenPerSec + (user.buildings.solar_generator * 0.2)) * multipliers.energyRegen;
    const energyGained = Math.floor(cappedSeconds * effectiveRegen);
    user.energy = Math.min(user.maxEnergy, user.energy + energyGained);

    // Calculate passive Cosmic Energy income
    let offlineEarned = 0;
    if (user.passiveIncomePerHour > 0 && cappedSeconds > 5) {
      const ratePerSec = user.passiveIncomePerHour / 3600;
      offlineEarned = Math.floor(ratePerSec * cappedSeconds);
      user.cosmicEnergy += offlineEarned;
      user.totalEnergyEarned += offlineEarned;
      user.planetLevel = calculateLevelFromTotalEnergy(user.totalEnergyEarned);
      user.planetStage = determinePlanetStage(user.planetLevel, user.totalEnergyEarned);
    }

    user.lastActiveTimestamp = now;
    return { offlineEarned, elapsedSeconds: cappedSeconds };
  }

  public calculateAlienMultipliers(user: UserGameProfile) {
    let energyRegen = 1.0;
    let mineBoost = 1.0;
    let tapPower = 1.0;
    let passiveBoost = 1.0;
    let globalMultiplier = 1.0;

    for (const [alienId, alienData] of Object.entries(user.aliens || {})) {
      const cfg = ALIENS_CONFIG[alienId];
      if (!cfg) continue;
      const bonus = cfg.baseBonusValue + (alienData.level - 1) * cfg.bonusPerLevel;
      if (cfg.bonusType === 'energy_regen') energyRegen += bonus;
      if (cfg.bonusType === 'mine_boost') mineBoost += bonus;
      if (cfg.bonusType === 'tap_power') tapPower += bonus;
      if (cfg.bonusType === 'passive_boost') passiveBoost += bonus;
      if (cfg.bonusType === 'global_multiplier') globalMultiplier += bonus;
    }

    return {
      energyRegen,
      mineBoost,
      tapPower,
      passiveBoost,
      globalMultiplier,
    };
  }

  public recalculatePassiveIncome(user: UserGameProfile) {
    let basePerHour = 0;
    const multipliers = this.calculateAlienMultipliers(user);

    for (const [bId, level] of Object.entries(user.buildings) as [BuildingId, number][]) {
      let income = calculateBuildingIncomePerHour(bId, level);
      if (bId === 'crystal_mine') {
        income = Math.floor(income * multipliers.mineBoost);
      }
      basePerHour += income;
    }

    basePerHour = Math.floor(basePerHour * multipliers.passiveBoost * multipliers.globalMultiplier);
    user.passiveIncomePerHour = basePerHour;
  }

  // --- TAP ACTION VALIDATION ---

  public processTap(userId: string, count: number = 1): {
    success: boolean;
    error?: string;
    cosmicEnergy: number;
    energy: number;
    earned: number;
    tapPower: number;
    isCrit: boolean;
    critMultiplier: number;
    planetLevel: number;
    planetStage: PlanetStageId;
  } {
    const user = this.data.users[userId];
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        cosmicEnergy: 0,
        energy: 0,
        earned: 0,
        tapPower: 1,
        isCrit: false,
        critMultiplier: 1,
        planetLevel: 1,
        planetStage: 1,
      };
    }

    // Enforce rate limiting: max 25 taps/sec
    const now = Date.now();
    const limiter = this.tapRateLimiter[userId] || { lastTap: now, tapCountInWindow: 0 };
    if (now - limiter.lastTap < 1000) {
      limiter.tapCountInWindow += count;
      if (limiter.tapCountInWindow > 30) {
        return {
          success: false,
          error: 'Tap rate exceeded cosmic flux threshold',
          cosmicEnergy: user.cosmicEnergy,
          energy: user.energy,
          earned: 0,
          tapPower: user.tapPower,
          isCrit: false,
          critMultiplier: 1,
          planetLevel: user.planetLevel,
          planetStage: user.planetStage,
        };
      }
    } else {
      limiter.lastTap = now;
      limiter.tapCountInWindow = count;
    }
    this.tapRateLimiter[userId] = limiter;

    // Sync energy regen before checking tap energy
    this.syncUserInternal(user);

    const safeCount = Math.min(Math.max(1, count), 10);
    const requiredEnergy = safeCount;

    if (user.energy < requiredEnergy) {
      return {
        success: false,
        error: 'Insufficient cosmic energy capacity. Please recharge.',
        cosmicEnergy: user.cosmicEnergy,
        energy: user.energy,
        earned: 0,
        tapPower: user.tapPower,
        isCrit: false,
        critMultiplier: 1,
        planetLevel: user.planetLevel,
        planetStage: user.planetStage,
      };
    }

    // Deduct energy
    user.energy -= requiredEnergy;

    // Calculate tap power and critical hit
    const multipliers = this.calculateAlienMultipliers(user);
    const effectiveTapPower = Math.max(1, Math.floor(user.tapPower * multipliers.tapPower * multipliers.globalMultiplier));

    // Base crit chance: 5%, +5% if galactic observatory unlocked
    const critChance = 0.05 + (user.buildings.galactic_observatory > 0 ? 0.05 : 0);
    const isCrit = Math.random() < critChance;
    const critMultiplier = isCrit ? 3 : 1;

    const earned = safeCount * effectiveTapPower * critMultiplier;

    user.cosmicEnergy += earned;
    user.totalEnergyEarned += earned;
    user.totalTaps += safeCount;

    // Check level & stage progression
    user.planetLevel = calculateLevelFromTotalEnergy(user.totalEnergyEarned);
    user.planetStage = determinePlanetStage(user.planetLevel, user.totalEnergyEarned);

    // Update mission progress
    this.updateMissionProgress(userId, 'tap', safeCount);
    this.updateMissionProgress(userId, 'collect_energy', earned);

    this.save();

    return {
      success: true,
      cosmicEnergy: user.cosmicEnergy,
      energy: user.energy,
      earned,
      tapPower: effectiveTapPower,
      isCrit,
      critMultiplier,
      planetLevel: user.planetLevel,
      planetStage: user.planetStage,
    };
  }

  // --- UPGRADE PURCHASES ---

  public purchaseBuilding(userId: string, buildingId: BuildingId): {
    success: boolean;
    error?: string;
    user?: UserGameProfile;
  } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found' };

    const config = BUILDINGS_CONFIG[buildingId];
    if (!config) return { success: false, error: 'Invalid building' };

    const currentLevel = user.buildings[buildingId] || 0;
    if (currentLevel >= config.maxLevel) {
      return { success: false, error: 'Building is already at maximum level' };
    }

    if (user.planetStage < config.unlockedAtStage) {
      return { success: false, error: `Requires Planet Stage ${config.unlockedAtStage} to construct` };
    }

    const cost = calculateBuildingCost(buildingId, currentLevel);
    if (user.cosmicEnergy < cost) {
      return { success: false, error: `Requires ${cost.toLocaleString()} Cosmic Energy` };
    }

    // Atomic purchase
    user.cosmicEnergy -= cost;
    user.buildings[buildingId] = currentLevel + 1;

    // Recalculate passive income
    this.recalculatePassiveIncome(user);

    // Track mission
    this.updateMissionProgress(userId, 'upgrade_building', 1);

    this.save();
    return { success: true, user };
  }

  public upgradeTapPower(userId: string): { success: boolean; error?: string; user?: UserGameProfile } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found' };

    const cost = calculateTapUpgradeCost(user.tapPower);
    if (user.cosmicEnergy < cost) {
      return { success: false, error: `Requires ${cost.toLocaleString()} Cosmic Energy` };
    }

    user.cosmicEnergy -= cost;
    user.tapPower += 1;
    this.save();
    return { success: true, user };
  }

  public upgradeEnergyCapacity(userId: string): { success: boolean; error?: string; user?: UserGameProfile } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found' };

    const cost = calculateEnergyCapacityCost(user.maxEnergy);
    if (user.cosmicEnergy < cost) {
      return { success: false, error: `Requires ${cost.toLocaleString()} Cosmic Energy` };
    }

    user.cosmicEnergy -= cost;
    user.maxEnergy += 250;
    user.energy = user.maxEnergy; // Fully recharge on upgrade
    this.save();
    return { success: true, user };
  }

  // --- ALIEN COMPANION SUMMONING ---

  public summonAlien(userId: string): {
    success: boolean;
    error?: string;
    alien?: typeof ALIENS_CONFIG[keyof typeof ALIENS_CONFIG];
    isNew?: boolean;
    user?: UserGameProfile;
  } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found' };

    const SUMMON_STARDUST_COST = 20;
    if (user.stardust < SUMMON_STARDUST_COST) {
      return { success: false, error: `Requires ${SUMMON_STARDUST_COST} Stardust crystals to summon an alien pod` };
    }

    user.stardust -= SUMMON_STARDUST_COST;

    // Transparent probability distribution
    // Common: 50%, Uncommon: 30%, Rare: 13%, Epic: 5%, Legendary: 2%
    const rand = Math.random() * 100;
    let selectedId = 'solar_sprite';
    if (rand < 2) {
      selectedId = 'gravity_slug';
    } else if (rand < 7) {
      selectedId = 'nebula_fox';
    } else if (rand < 20) {
      selectedId = 'quantum_owl';
    } else if (rand < 50) {
      selectedId = 'crystal_mole';
    } else {
      selectedId = 'solar_sprite';
    }

    const alienCfg = ALIENS_CONFIG[selectedId];
    const isNew = !user.aliens[selectedId];

    if (isNew) {
      user.aliens[selectedId] = {
        id: selectedId,
        level: 1,
        unlockedAt: Date.now(),
        count: 1,
      };
    } else {
      user.aliens[selectedId].level += 1;
      user.aliens[selectedId].count += 1;
    }

    this.recalculatePassiveIncome(user);
    this.updateMissionProgress(userId, 'discover_alien', 1);

    this.save();
    return { success: true, alien: alienCfg, isNew, user };
  }

  // --- DAILY LOGIN REWARDS ---

  public claimDailyReward(userId: string): {
    success: boolean;
    error?: string;
    reward?: typeof DAILY_LOGIN_REWARDS[0];
    streak?: number;
    user?: UserGameProfile;
  } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found' };

    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const MIN_CLAIM_INTERVAL = 18 * 60 * 60 * 1000; // Allow claiming every 18 hours

    if (user.lastDailyClaimTimestamp && now - user.lastDailyClaimTimestamp < MIN_CLAIM_INTERVAL) {
      const waitHours = Math.ceil((MIN_CLAIM_INTERVAL - (now - user.lastDailyClaimTimestamp)) / (60 * 60 * 1000));
      return { success: false, error: `Daily reward is on cooldown. Next reward available in ${waitHours}h.` };
    }

    // Check if streak broke (> 48h since last claim)
    if (user.lastDailyClaimTimestamp && now - user.lastDailyClaimTimestamp > ONE_DAY_MS * 2) {
      user.dailyStreak = 0;
    }

    user.dailyStreak = (user.dailyStreak % 7) + 1;
    const rewardIndex = user.dailyStreak - 1;
    const reward = DAILY_LOGIN_REWARDS[rewardIndex];

    user.cosmicEnergy += reward.rewardEnergy;
    user.stardust += reward.rewardStardust;
    user.lastDailyClaimTimestamp = now;

    // Bonus alien pod on day 5 and 7
    if (reward.hasAlienPod) {
      this.summonAlienBonusPod(user);
    }

    this.save();
    return { success: true, reward, streak: user.dailyStreak, user };
  }

  private summonAlienBonusPod(user: UserGameProfile) {
    const keys = Object.keys(ALIENS_CONFIG);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    if (!user.aliens[randomKey]) {
      user.aliens[randomKey] = { id: randomKey, level: 1, unlockedAt: Date.now(), count: 1 };
    } else {
      user.aliens[randomKey].level += 1;
      user.aliens[randomKey].count += 1;
    }
    this.recalculatePassiveIncome(user);
  }

  // --- MISSIONS SYSTEM ---

  private initMissionsForUser(userId: string) {
    const missions: Mission[] = [
      {
        id: 'tap_50',
        title: 'Cosmic Radiance',
        description: 'Tap your planet 50 times to generate raw starlight',
        targetCount: 50,
        currentCount: 0,
        rewardEnergy: 500,
        rewardStardust: 5,
        isClaimed: false,
        category: 'daily',
      },
      {
        id: 'tap_200',
        title: 'Stellar Harmonizer',
        description: 'Tap your planet 200 times during active play',
        targetCount: 200,
        currentCount: 0,
        rewardEnergy: 2500,
        rewardStardust: 15,
        isClaimed: false,
        category: 'daily',
      },
      {
        id: 'upgrade_building_3',
        title: 'Architect of Worlds',
        description: 'Construct or upgrade 3 planetary buildings',
        targetCount: 3,
        currentCount: 0,
        rewardEnergy: 1500,
        rewardStardust: 10,
        isClaimed: false,
        category: 'daily',
      },
      {
        id: 'collect_10k',
        title: 'Cosmic Harvester',
        description: 'Accumulate 10,000 total Cosmic Energy',
        targetCount: 10000,
        currentCount: 0,
        rewardEnergy: 3000,
        rewardStardust: 20,
        isClaimed: false,
        category: 'milestone',
      },
      {
        id: 'reach_stage_2',
        title: 'Prismatic Awakening',
        description: 'Evolve your planet to Stage II: Prismatic Core',
        targetCount: 1,
        currentCount: 0,
        rewardEnergy: 5000,
        rewardStardust: 35,
        isClaimed: false,
        category: 'milestone',
      },
      {
        id: 'discover_companion',
        title: 'First Contact',
        description: 'Summon an Alien Companion into your ecosystem',
        targetCount: 1,
        currentCount: 0,
        rewardEnergy: 4000,
        rewardStardust: 25,
        isClaimed: false,
        category: 'milestone',
      },
    ];

    this.data.missions[userId] = missions;
  }

  public updateMissionProgress(userId: string, action: 'tap' | 'upgrade_building' | 'collect_energy' | 'discover_alien', amount: number) {
    const list = this.data.missions[userId];
    if (!list) return;

    for (const m of list) {
      if (m.isClaimed) continue;
      if (action === 'tap' && (m.id === 'tap_50' || m.id === 'tap_200')) {
        m.currentCount = Math.min(m.targetCount, m.currentCount + amount);
      } else if (action === 'upgrade_building' && m.id === 'upgrade_building_3') {
        m.currentCount = Math.min(m.targetCount, m.currentCount + amount);
      } else if (action === 'collect_energy' && m.id === 'collect_10k') {
        m.currentCount = Math.min(m.targetCount, m.currentCount + amount);
      } else if (action === 'discover_alien' && m.id === 'discover_companion') {
        m.currentCount = Math.min(m.targetCount, m.currentCount + amount);
      }
    }
  }

  public getMissions(userId: string): Mission[] {
    if (!this.data.missions[userId]) {
      this.initMissionsForUser(userId);
    }
    const user = this.data.users[userId];
    if (user) {
      const stageMission = this.data.missions[userId].find((m) => m.id === 'reach_stage_2');
      if (stageMission && user.planetStage >= 2) {
        stageMission.currentCount = 1;
      }
    }
    return this.data.missions[userId] || [];
  }

  public claimMissionReward(userId: string, missionId: string): {
    success: boolean;
    error?: string;
    rewardEnergy?: number;
    rewardStardust?: number;
    user?: UserGameProfile;
  } {
    const list = this.data.missions[userId];
    const user = this.data.users[userId];
    if (!list || !user) return { success: false, error: 'User or missions not found' };

    const mission = list.find((m) => m.id === missionId);
    if (!mission) return { success: false, error: 'Mission not found' };
    if (mission.isClaimed) return { success: false, error: 'Mission already claimed' };
    if (mission.currentCount < mission.targetCount) {
      return { success: false, error: 'Mission requirements not yet completed' };
    }

    mission.isClaimed = true;
    user.cosmicEnergy += mission.rewardEnergy;
    user.stardust += mission.rewardStardust;

    this.save();
    return {
      success: true,
      rewardEnergy: mission.rewardEnergy,
      rewardStardust: mission.rewardStardust,
      user,
    };
  }

  // --- REFERRAL SYSTEM ---

  private processReferralAttribution(referrerCode: string, newUserId: string) {
    const referrer = Object.values(this.data.users).find(
      (u) => u.referralCode === referrerCode && u.id !== newUserId
    );
    if (!referrer) return;

    if (!this.data.referrals[referrer.id]) {
      this.data.referrals[referrer.id] = [];
    }

    if (!this.data.referrals[referrer.id].includes(newUserId)) {
      this.data.referrals[referrer.id].push(newUserId);
      referrer.referralCount += 1;
      referrer.referralEarnings += 3000;
      referrer.cosmicEnergy += 3000;
      referrer.stardust += 20;

      // Also give bonus to the newcomer!
      const newcomer = this.data.users[newUserId];
      if (newcomer) {
        newcomer.referredBy = referrer.username;
        newcomer.cosmicEnergy += 1000;
        newcomer.stardust += 15;
      }
    }
  }

  // --- PLANET STAGE EVOLUTION ---

  public evolvePlanetStage(userId: string): {
    success: boolean;
    error?: string;
    newStage?: PlanetStageId;
    user?: UserGameProfile;
  } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found' };

    const nextStageId = (user.planetStage + 1) as PlanetStageId;
    if (nextStageId > 6) {
      return { success: false, error: 'Planet is already at ultimate Stage VI' };
    }

    const nextConfig = PLANET_STAGES[nextStageId];
    if (!nextConfig) return { success: false, error: 'Invalid next stage' };

    if (user.planetLevel < nextConfig.requiredLevel || user.totalEnergyEarned < nextConfig.requiredTotalEnergy) {
      return {
        success: false,
        error: `Requires Planet Level ${nextConfig.requiredLevel} and ${nextConfig.requiredTotalEnergy.toLocaleString()} total energy`,
      };
    }

    user.planetStage = nextStageId;
    user.stardust += 50; // Evolution milestone reward!
    user.cosmicEnergy += 10000;

    this.save();
    return { success: true, newStage: nextStageId, user };
  }

  // --- LEADERBOARD & PUBLIC PROFILES ---

  public getLeaderboard(): LeaderboardEntry[] {
    const allUsers = Object.values(this.data.users);
    const sorted = [...allUsers].sort((a, b) => b.totalEnergyEarned - a.totalEnergyEarned);

    return sorted.slice(0, 50).map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      username: u.username,
      planetName: u.planetName,
      planetStage: u.planetStage,
      planetLevel: u.planetLevel,
      totalEnergyEarned: u.totalEnergyEarned,
      passiveIncomePerHour: u.passiveIncomePerHour,
      avatarSeed: u.avatarSeed,
    }));
  }

  public getPublicProfile(userId: string): Partial<UserGameProfile> | null {
    const user = this.data.users[userId];
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      planetName: user.planetName,
      planetStage: user.planetStage,
      planetLevel: user.planetLevel,
      totalEnergyEarned: user.totalEnergyEarned,
      passiveIncomePerHour: user.passiveIncomePerHour,
      buildings: user.buildings,
      aliens: user.aliens,
      totalTaps: user.totalTaps,
      currentPlanetId: user.currentPlanetId,
      avatarSeed: user.avatarSeed,
    };
  }

  // --- ADMIN MANAGEMENT SYSTEM ---

  public getAllUsersAdmin(): {
    users: UserGameProfile[];
    stats: {
      totalUsers: number;
      totalCosmicEnergy: number;
      totalStardust: number;
      totalTaps: number;
      activeUsers24h: number;
    };
  } {
    const users = Object.values(this.data.users);
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const stats = {
      totalUsers: users.length,
      totalCosmicEnergy: users.reduce((sum, u) => sum + (u.cosmicEnergy || 0), 0),
      totalStardust: users.reduce((sum, u) => sum + (u.stardust || 0), 0),
      totalTaps: users.reduce((sum, u) => sum + (u.totalTaps || 0), 0),
      activeUsers24h: users.filter((u) => u.lastActiveTimestamp > oneDayAgo).length,
    };

    const sorted = [...users].sort((a, b) => (b.totalEnergyEarned || 0) - (a.totalEnergyEarned || 0));
    return { users: sorted, stats };
  }

  public adminAdjustUser(
    userId: string,
    adjustments: {
      cosmicEnergyDelta?: number;
      stardustDelta?: number;
      setCosmicEnergy?: number;
      setStardust?: number;
      energyDelta?: number;
      setEnergy?: number;
      setLevel?: number;
      setStage?: PlanetStageId;
      resetProgress?: boolean;
    }
  ): { success: boolean; user?: UserGameProfile; error?: string } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found' };

    if (adjustments.resetProgress) {
      user.cosmicEnergy = 0;
      user.stardust = 10;
      user.totalEnergyEarned = 0;
      user.planetLevel = 1;
      user.planetStage = 1;
      user.totalTaps = 0;
      user.energy = user.maxEnergy;
      user.buildings = {
        crystal_mine: 0,
        solar_generator: 0,
        alien_habitat: 0,
        research_lab: 0,
        spaceport: 0,
        planet_shield: 0,
        galactic_observatory: 0,
      };
      this.recalculatePassiveIncome(user);
      this.save();
      return { success: true, user };
    }

    if (typeof adjustments.setCosmicEnergy === 'number') {
      user.cosmicEnergy = Math.max(0, adjustments.setCosmicEnergy);
      user.totalEnergyEarned = Math.max(user.totalEnergyEarned, user.cosmicEnergy);
    } else if (typeof adjustments.cosmicEnergyDelta === 'number') {
      user.cosmicEnergy = Math.max(0, user.cosmicEnergy + adjustments.cosmicEnergyDelta);
      if (adjustments.cosmicEnergyDelta > 0) {
        user.totalEnergyEarned += adjustments.cosmicEnergyDelta;
      }
    }

    if (typeof adjustments.setStardust === 'number') {
      user.stardust = Math.max(0, adjustments.setStardust);
    } else if (typeof adjustments.stardustDelta === 'number') {
      user.stardust = Math.max(0, user.stardust + adjustments.stardustDelta);
    }

    if (typeof adjustments.setEnergy === 'number') {
      user.energy = Math.max(0, Math.min(user.maxEnergy, adjustments.setEnergy));
    } else if (typeof adjustments.energyDelta === 'number') {
      user.energy = Math.max(0, Math.min(user.maxEnergy, user.energy + adjustments.energyDelta));
    }

    if (typeof adjustments.setLevel === 'number') {
      user.planetLevel = Math.max(1, adjustments.setLevel);
    }

    if (typeof adjustments.setStage === 'number' && adjustments.setStage >= 1 && adjustments.setStage <= 6) {
      user.planetStage = adjustments.setStage as PlanetStageId;
    }

    this.recalculatePassiveIncome(user);
    this.save();
    return { success: true, user };
  }

  public adminDeleteUser(userId: string): { success: boolean; error?: string } {
    if (!this.data.users[userId]) {
      return { success: false, error: 'User not found' };
    }

    delete this.data.users[userId];
    delete this.data.missions[userId];
    delete this.data.referrals[userId];

    for (const refList of Object.values(this.data.referrals)) {
      const idx = refList.indexOf(userId);
      if (idx !== -1) refList.splice(idx, 1);
    }

    this.save();
    return { success: true };
  }

  public adminBroadcastReward(params: {
    cosmicEnergy?: number;
    stardust?: number;
  }): { success: boolean; rewardedUsersCount: number } {
    const users = Object.values(this.data.users);
    const energy = params.cosmicEnergy || 0;
    const stardust = params.stardust || 0;

    for (const u of users) {
      if (energy > 0) {
        u.cosmicEnergy += energy;
        u.totalEnergyEarned += energy;
      }
      if (stardust > 0) {
        u.stardust += stardust;
      }
    }

    this.save();
    return { success: true, rewardedUsersCount: users.length };
  }

  public adminCreateUser(params: {
    username: string;
    cosmicEnergy?: number;
    stardust?: number;
    planetLevel?: number;
  }): { success: boolean; user?: UserGameProfile; error?: string } {
    if (!params.username || !params.username.trim()) {
      return { success: false, error: 'Username is required' };
    }
    const cleanUsername = params.username.trim();
    const idKey = `web_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const referralCode = `MOON_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const level = Math.max(1, params.planetLevel || 1);
    const stage = (level >= 50 ? 5 : level >= 25 ? 4 : level >= 15 ? 3 : level >= 5 ? 2 : 1) as PlanetStageId;

    const newUser: UserGameProfile = {
      id: idKey,
      username: cleanUsername,
      avatarSeed: `seed_${Math.floor(Math.random() * 1000)}`,
      planetName: `${cleanUsername.split(' ')[0]}'s Moon`,
      planetStage: stage,
      planetLevel: level,
      cosmicEnergy: Math.max(0, params.cosmicEnergy || 0),
      stardust: Math.max(0, params.stardust !== undefined ? params.stardust : 50),
      totalEnergyEarned: Math.max(0, params.cosmicEnergy || 0),
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
      referralCode,
      referralCount: 0,
      referralEarnings: 0,
      totalTaps: 0,
      createdAt: Date.now(),
      currentPlanetId: 'kepler_prime',
    };

    this.recalculatePassiveIncome(newUser);
    this.data.users[idKey] = newUser;
    this.save();
    return { success: true, user: newUser };
  }
}

export const gameStorage = new GameStorage();
