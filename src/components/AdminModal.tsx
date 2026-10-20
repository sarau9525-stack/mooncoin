import React, { useState, useEffect, useCallback } from 'react';
import { UserGameProfile, PlanetStageId } from '../types/game';
import { PLANET_STAGES } from '../config/gameConfig';
import {
  ShieldAlert,
  Users,
  Coins,
  Sparkles,
  Trash2,
  PlusCircle,
  RotateCcw,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Zap,
  Flame,
  Award,
  UserPlus,
  Sliders,
  DollarSign,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalCosmicEnergy: number;
  totalStardust: number;
  totalTaps: number;
  activeUsers24h: number;
}

interface AdminModalProps {
  onClose: () => void;
  currentUser: UserGameProfile;
  onRefreshCurrentPlayer?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  onClose,
  currentUser,
  onRefreshCurrentPlayer,
}) => {
  const [users, setUsers] = useState<UserGameProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserGameProfile | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'airdrop' | 'create'>('users');

  // Custom coin adjustment state for selected / targeted user
  const [customCoinsInput, setCustomCoinsInput] = useState('100000');
  const [customStardustInput, setCustomStardustInput] = useState('500');
  const [customLevelInput, setCustomLevelInput] = useState('10');

  // Broadcast / Airdrop inputs
  const [broadcastCoins, setBroadcastCoins] = useState('100000');
  const [broadcastStardust, setBroadcastStardust] = useState('100');

  // Create User state
  const [newUsername, setNewUsername] = useState('');
  const [newCoins, setNewCoins] = useState('50000');
  const [newStardust, setNewStardust] = useState('50');
  const [newLevel, setNewLevel] = useState('1');
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
      if (selectedUser) {
        const updated = (data.users || []).find((u: UserGameProfile) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdjustCoins = async (targetUserId: string, delta: number) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cosmicEnergyDelta: delta }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `✅ موفق: تعداد ${delta.toLocaleString()} کوین به کاربر ${data.user.username} اضافه شد! (+${delta.toLocaleString()} MoonCoins)`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      } else {
        setActionFeedback({ success: false, message: data.error || 'Failed to adjust coins' });
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleSetExactCoins = async (targetUserId: string, exactAmount: number) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setCosmicEnergy: exactAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `✅ موجودی سکه کاربر ${data.user.username} دقیقاً روی ${exactAmount.toLocaleString()} تنظیم شد!`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      } else {
        setActionFeedback({ success: false, message: data.error || 'Failed to set coins' });
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleAdjustStardust = async (targetUserId: string, delta: number) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stardustDelta: delta }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `✅ تعداد ${delta.toLocaleString()} استارداست به کاربر ${data.user.username} اضافه شد!`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      } else {
        setActionFeedback({ success: false, message: data.error || 'Failed to adjust stardust' });
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleSetStage = async (targetUserId: string, stage: PlanetStageId) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setStage: stage }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `✅ مرحله سیاره ${data.user.username} به مرحله ${stage} ارتقا یافت!`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleSetLevel = async (targetUserId: string, level: number) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setLevel: level }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `✅ سطح کاربر ${data.user.username} به ${level} تغییر کرد!`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleRefillEnergy = async (targetUserId: string) => {
    try {
      const userObj = users.find((u) => u.id === targetUserId);
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setEnergy: userObj ? userObj.maxEnergy : 1000 }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `⚡ انرژی کاربر ${data.user.username} به صورت ۱۰۰٪ شارژ شد!`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetUsername: string) => {
    const confirmText = `آیا از حذف کامل کاربر "${targetUsername}" اطمینان دارید؟\nاین عملیات غیرقابل بازگشت است و تمام پیشرفت و کوین‌های او پاک می‌شود.\n\nAre you sure you want to permanently delete user "${targetUsername}"?`;
    if (!confirm(confirmText)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `🗑️ کاربر ${targetUsername} با موفقیت از دیتابیس بازی حذف شد. (User deleted)`,
        });
        if (selectedUser?.id === targetUserId) {
          setSelectedUser(null);
        }
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      } else {
        setActionFeedback({ success: false, message: data.error || 'Failed to delete user' });
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleResetProgress = async (targetUserId: string, targetUsername: string) => {
    if (!confirm(`آیا می‌خواهید پیشرفت کاربر "${targetUsername}" ریست شده و به سطح ۱ برگردد؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetProgress: true }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `🔄 پیشرفت کاربر ${targetUsername} به حالت اولیه بازگردانی شد.`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer && targetUserId === currentUser.id) {
          onRefreshCurrentPlayer();
        }
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleBroadcastReward = async () => {
    const coins = parseInt(broadcastCoins, 10) || 0;
    const stardust = parseInt(broadcastStardust, 10) || 0;
    if (coins <= 0 && stardust <= 0) return;

    if (!confirm(`آیا می‌خواهید به تمام ${users.length} کاربر بازی مقدار ${coins.toLocaleString()} کوین و ${stardust} استارداست هدیه دهید؟`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cosmicEnergy: coins, stardust }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `🎁 ایردراپ همگانی با موفقیت برای ${data.rewardedUsersCount} بازیکن ارسال شد!`,
        });
        fetchUsers();
        if (onRefreshCurrentPlayer) onRefreshCurrentPlayer();
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          cosmicEnergy: parseInt(newCoins, 10) || 0,
          stardust: parseInt(newStardust, 10) || 50,
          planetLevel: parseInt(newLevel, 10) || 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          success: true,
          message: `🎉 کاربر جدید با نام "${data.user.username}" با موفقیت ایجاد شد!`,
        });
        setNewUsername('');
        fetchUsers();
        setActiveTab('users');
        setSelectedUser(data.user);
      } else {
        setActionFeedback({ success: false, message: data.error || 'Failed to create user' });
      }
    } catch (err: any) {
      setActionFeedback({ success: false, message: err.message });
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.planetName.toLowerCase().includes(q) ||
      (u.referralCode && u.referralCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/50 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors z-10"
          title="بستن پنل"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Title & Persian Subtitle */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <ShieldAlert className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-100 font-display">
                MOONCOIN Master Administration Panel
              </h2>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 border border-amber-700 px-2 py-0.5 rounded-full">
                👑 پنل مدیریت همه‌کاره
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیریت تمام کاربران، اهدای کوین و استارداست دلخواه، حذف کاربر، تغییر مرحله سیاره و ایردراپ همگانی
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>مدیریت کاربران و کوین‌ها (Users & Coins)</span>
          </button>

          <button
            onClick={() => setActiveTab('airdrop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'airdrop'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>ایردراپ همگانی (Global Airdrop)</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'create'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>ایجاد کاربر جدید (Create User)</span>
          </button>
        </div>

        {/* Global Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-medium">کل کاربران ثبت‌شده</span>
              <span className="text-lg font-black text-slate-100 font-mono tabular-nums">
                {stats.totalUsers} نفر
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-medium">کل کوین در گردش (MoonCoins)</span>
              <span className="text-lg font-black text-amber-400 font-mono tabular-nums">
                {stats.totalCosmicEnergy.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-medium">کل استارداست (Stardust)</span>
              <span className="text-lg font-black text-sky-400 font-mono tabular-nums">
                {stats.totalStardust.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-medium">کل تپ‌های ثبت‌شده</span>
              <span className="text-lg font-black text-emerald-400 font-mono tabular-nums">
                {stats.totalTaps.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center justify-between border ${
              actionFeedback.success
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/60 border-rose-700 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span className="font-medium">{actionFeedback.message}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-xs opacity-70 hover:opacity-100 p-1">
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: USERS & COINS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {/* Search Bar & Refresh */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="جستجوی کاربر بر اساس نام، شناسه (ID) یا کد معرف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-1 text-xs"
                title="بروزرسانی لیست"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">بروزرسانی</span>
              </button>
            </div>

            {/* Custom Coin Grant Box for Selected User or Quick Grant */}
            {selectedUser && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span>عملیات پیشرفته برای: <b className="text-slate-100">{selectedUser.username}</b></span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (موجودی فعلی: 🪙 {selectedUser.cosmicEnergy.toLocaleString()})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    بستن انتخاب ✕
                  </button>
                </div>

                {/* Coin Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* MoonCoins */}
                  <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-amber-300 block">
                      🪙 مقدار کوین دلخواه (MoonCoins)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={customCoinsInput}
                        onChange={(e) => setCustomCoinsInput(e.target.value)}
                        placeholder="مثال: 500000"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => {
                          const val = parseInt(customCoinsInput, 10);
                          if (val) handleAdjustCoins(selectedUser.id, val);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all active:scale-95"
                      >
                        + اضافه کن
                      </button>
                      <button
                        onClick={() => {
                          const val = parseInt(customCoinsInput, 10);
                          if (val >= 0) handleSetExactCoins(selectedUser.id, val);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition-all active:scale-95"
                        title="تنظیم دقیق موجودی روی این عدد"
                      >
                        تنظیم دقیق
                      </button>
                    </div>
                  </div>

                  {/* Stardust */}
                  <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-sky-300 block">
                      💎 مقدار استارداست دلخواه (Stardust)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={customStardustInput}
                        onChange={(e) => setCustomStardustInput(e.target.value)}
                        placeholder="مثال: 100"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={() => {
                          const val = parseInt(customStardustInput, 10);
                          if (val) handleAdjustStardust(selectedUser.id, val);
                        }}
                        className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow transition-all active:scale-95"
                      >
                        + اضافه کن
                      </button>
                    </div>
                  </div>
                </div>

                {/* Level and Stage settings */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-900/40 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-300 font-semibold">مرحله سیاره:</span>
                    <select
                      value={selectedUser.planetStage}
                      onChange={(e) => handleSetStage(selectedUser.id, parseInt(e.target.value, 10) as PlanetStageId)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-purple-300 font-bold"
                    >
                      <option value={1}>مرحله ۱: هسته کیهانی (Cosmic Seed)</option>
                      <option value={2}>مرحله ۲: صخره بلورین (Crystalline)</option>
                      <option value={3}>مرحله ۳: تِرا سرسبز (Verdant Terra)</option>
                      <option value={4}>مرحله ۴: کلونی پیشرفته (Colony Prime)</option>
                      <option value={5}>مرحله ۵: کلان‌شهر ماه (Metropolis)</option>
                      <option value={6}>مرحله ۶: ابرسازه کهکشانی (Megastructure)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      value={customLevelInput}
                      onChange={(e) => setCustomLevelInput(e.target.value)}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono"
                      placeholder="سطح"
                    />
                    <button
                      onClick={() => {
                        const lvl = parseInt(customLevelInput, 10);
                        if (lvl) handleSetLevel(selectedUser.id, lvl);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
                    >
                      تغییر سطح (Level)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users List Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
              <div className="divide-y divide-slate-800/80 bg-slate-950/70">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const isSelf = currentUser.id === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-3 space-y-2.5 transition-colors ${
                        isSelected ? 'bg-amber-950/20 border-l-4 border-amber-500' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      {/* User Header Info Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          onClick={() => setSelectedUser(u)}
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100 truncate hover:text-amber-400">
                                {u.username}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-1.5 rounded">
                                  شما (YOU)
                                </span>
                              )}
                              <span className="text-[10px] text-amber-400 font-mono">
                                Lvl {u.planetLevel} (Stage {u.planetStage})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">
                              ID: {u.id} {u.telegramId ? `· TG: ${u.telegramId}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Balances */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-amber-400 font-mono tabular-nums block">
                            🪙 {u.cosmicEnergy.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-sky-300 font-mono tabular-nums">
                            💎 {u.stardust} Stardust
                          </span>
                        </div>
                      </div>

                      {/* Quick Action Buttons for This User */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-900 text-xs">
                        {/* Quick Give 50k */}
                        <button
                          onClick={() => handleAdjustCoins(u.id, 50000)}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                          title="افزودن ۵۰,۰۰۰ کوین"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+50k کوین</span>
                        </button>

                        {/* Quick Give 1M */}
                        <button
                          onClick={() => handleAdjustCoins(u.id, 1000000)}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                          title="افزودن ۱,۰۰۰,۰۰۰ کوین"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+1M کوین</span>
                        </button>

                        {/* Quick Give 10M */}
                        <button
                          onClick={() => handleAdjustCoins(u.id, 10000000)}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                          title="افزودن ۱۰,۰۰۰,۰۰۰ کوین"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>+10M کوین</span>
                        </button>

                        {/* Give Stardust */}
                        <button
                          onClick={() => handleAdjustStardust(u.id, 100)}
                          className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                          title="افزودن ۱۰۰ استارداست"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>+100 الماس</span>
                        </button>

                        {/* Full Energy Refill */}
                        <button
                          onClick={() => handleRefillEnergy(u.id)}
                          className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                          title="شارژ کامل انرژی"
                        >
                          <Zap className="w-3 h-3" />
                          <span>شارژ انرژی</span>
                        </button>

                        {/* Select for custom edit */}
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 active:scale-95"
                          title="ویرایش دلخواه کوین و لول"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>تنظیم دلخواه</span>
                        </button>

                        {/* Reset Progress */}
                        <button
                          onClick={() => handleResetProgress(u.id, u.username)}
                          className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 text-[11px] flex items-center gap-1 active:scale-95 ml-auto"
                          title="ریست پیشرفت به لول ۱"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>ریست</span>
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-[11px] font-bold flex items-center gap-1 active:scale-95 shadow-sm"
                          title="حذف دائمی کاربر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف کاربر (Delete)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    کاربری با عبارت جستجوی "{searchQuery}" یافت نشد.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GLOBAL AIRDROP */}
        {activeTab === 'airdrop' && (
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-900/60 space-y-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">ارسال کوین و جایزه به تمام بازیکنان (Galaxy-Wide Airdrop)</h3>
                <p className="text-xs text-slate-400">
                  این جایزه فوراً به حساب تمام {users.length} بازیکن ثبت‌شده اضافه خواهد شد.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-amber-300 block">مقدار MoonCoin برای هر بازیکن</label>
                <input
                  type="number"
                  value={broadcastCoins}
                  onChange={(e) => setBroadcastCoins(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  placeholder="مثال: 100000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-sky-300 block">مقدار Stardust برای هر بازیکن</label>
                <input
                  type="number"
                  value={broadcastStardust}
                  onChange={(e) => setBroadcastStardust(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-500"
                  placeholder="مثال: 50"
                />
              </div>
            </div>

            <button
              onClick={handleBroadcastReward}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-slate-950 font-bold text-xs shadow-lg shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>ارسال ایردراپ به تمام بازیکنان ({users.length} نفر)</span>
            </button>
          </div>
        )}

        {/* TAB 3: CREATE NEW USER */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateUser} className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/60 space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">ایجاد کاربر جدید دستی (Create Player)</h3>
                <p className="text-xs text-slate-400">
                  می‌توانید یک کاربر جدید با نام و موجودی اولیه مشخص بسازید.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">نام کاربری (Username)</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="مثال: SuperStar_99"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-amber-300 block">کوین اولیه (MoonCoins)</label>
                <input
                  type="number"
                  value={newCoins}
                  onChange={(e) => setNewCoins(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-sky-300 block">استارداست اولیه (Stardust)</label>
                <input
                  type="number"
                  value={newStardust}
                  onChange={(e) => setNewStardust(e.target.value)}
                  placeholder="50"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-purple-300 block">سطح اولیه (Level)</label>
                <input
                  type="number"
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  placeholder="1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingUser || !newUsername.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{creatingUser ? 'در حال ثبت...' : 'ثبت و ساخت کاربر جدید'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
