import {
  BuildingId,
  LeaderboardEntry,
  Mission,
  PlanetStageId,
  TapResponse,
  UserGameProfile,
} from '../types/game';
import { localGameEngine } from './localEngine';

const STORAGE_KEY_USER_ID = 'mooncoin_user_id';

class ApiClient {
  private currentUserId: string | null = null;
  private isOfflineMode: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    }
  }

  public getUserId(): string | null {
    return this.currentUserId;
  }

  public setUserId(id: string) {
    this.currentUserId = id;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER_ID, id);
    }
  }

  public clearSession() {
    this.currentUserId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER_ID);
    }
  }

  // Safe fetch helper with timeout
  private async safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // Authenticate via Telegram WebApp initData
  public async loginTelegram(initData: string, referrerCode?: string) {
    try {
      const res = await this.safeFetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, referrerCode }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user?.id) {
          this.setUserId(data.user.id);
          this.isOfflineMode = false;
          return data;
        }
      }
    } catch {
      // Fallback below
    }

    // Client-side fallback
    this.isOfflineMode = true;
    const fallback = localGameEngine.getOrCreateUser('TelegramCadet');
    this.setUserId(fallback.user.id);
    return { user: fallback.user, missions: fallback.missions, isNew: false };
  }

  // Authenticate / restore standalone web guest
  public async loginGuest(username?: string, referrerCode?: string) {
    try {
      const existingUserId = this.currentUserId;
      const res = await this.safeFetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, referrerCode, existingUserId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user?.id) {
          this.setUserId(data.user.id);
          this.isOfflineMode = false;
          return data;
        }
      }
    } catch {
      // Fallback below
    }

    // Client-side fallback
    this.isOfflineMode = true;
    const fallback = localGameEngine.getOrCreateUser(username);
    this.setUserId(fallback.user.id);
    return { user: fallback.user, missions: fallback.missions, isNew: false };
  }

  // Fetch current user game profile & missions
  public async getMyProfile(): Promise<{ user: UserGameProfile; missions: Mission[] }> {
    if (!this.currentUserId) {
      const fallback = localGameEngine.getOrCreateUser();
      this.setUserId(fallback.user.id);
      return fallback;
    }

    if (!this.isOfflineMode) {
      try {
        const res = await this.safeFetch(`/api/game/me?userId=${encodeURIComponent(this.currentUserId)}`);
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.getOrCreateUser();
  }

  // Submit taps
  public async tap(count: number = 1): Promise<TapResponse & { planetLevel: number; planetStage: PlanetStageId }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/game/tap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId, count }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.tap(count);
  }

  // Upgrade building
  public async upgradeBuilding(buildingId: BuildingId): Promise<{ success: boolean; user: UserGameProfile }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/game/upgrade/building', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId, buildingId }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.upgradeBuilding(buildingId);
  }

  // Upgrade tap power
  public async upgradeTap(): Promise<{ success: boolean; user: UserGameProfile }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/game/upgrade/tap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.upgradeTap();
  }

  // Upgrade energy capacity
  public async upgradeEnergy(): Promise<{ success: boolean; user: UserGameProfile }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/game/upgrade/energy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.upgradeEnergy();
  }

  // Evolve planet
  public async evolvePlanet(): Promise<{ success: boolean; newStage: PlanetStageId; user: UserGameProfile }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/game/evolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.evolvePlanet();
  }

  // Summon alien companion
  public async summonAlien(): Promise<{ success: boolean; alien: any; isNew: boolean; user: UserGameProfile }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/game/aliens/summon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.summonAlien();
  }

  // Claim daily login reward
  public async claimDailyReward(): Promise<{ success: boolean; reward: any; streak: number; user: UserGameProfile }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/game/daily-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.claimDailyReward();
  }

  // Fetch missions
  public async getMissions(): Promise<{ missions: Mission[] }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch(`/api/missions?userId=${encodeURIComponent(this.currentUserId)}`);
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.getMissions();
  }

  // Claim mission reward
  public async claimMission(missionId: string): Promise<{ success: boolean; rewardEnergy: number; rewardStardust: number; user: UserGameProfile }> {
    if (!this.isOfflineMode && this.currentUserId) {
      try {
        const res = await this.safeFetch('/api/missions/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId, missionId }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {
        this.isOfflineMode = true;
      }
    }

    return localGameEngine.claimMission(missionId);
  }

  // Global leaderboard
  public async getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
    try {
      const res = await this.safeFetch('/api/leaderboard');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return localGameEngine.getLeaderboard();
  }

  // Public profile inspector
  public async getPublicProfile(userId: string): Promise<{ profile: Partial<UserGameProfile> }> {
    try {
      const res = await this.safeFetch(`/api/users/${encodeURIComponent(userId)}/public`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return { profile: { id: userId, username: 'CosmoExplorer', planetLevel: 10, totalEnergyEarned: 25000 } };
  }
}

export const apiClient = new ApiClient();
