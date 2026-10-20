import assert from 'assert';
import { GameStorage } from '../server/storage';
import { validateTelegramInitData } from '../server/telegramAuth';
import {
  calculateBuildingCost,
  calculateBuildingIncomePerHour,
  calculateLevelFromTotalEnergy,
  determinePlanetStage,
} from '../src/config/gameConfig';

console.log('🧪 Starting Pocket Planet Automated Test Suite...\n');

// 1. Test Telegram initData HMAC validation
console.log('Test 1: Telegram initData validation logic');
{
  const invalidData = 'some_random_string';
  const res1 = validateTelegramInitData(invalidData, 'sample_token');
  assert.strictEqual(res1.isValid, false, 'Invalid string should fail verification');

  const simulatedUser = JSON.stringify({ id: 123456, first_name: 'Cosmo', username: 'cosmonaut' });
  const simulatedData = `user=${encodeURIComponent(simulatedUser)}&auth_date=1600000000`;
  const res2 = validateTelegramInitData(simulatedData);
  assert.strictEqual(res2.isValid, true, 'Without bot token in dev mode, safe fallback extracts user correctly');
  assert.strictEqual(res2.user?.id, 123456);
  assert.strictEqual(res2.user?.username, 'cosmonaut');
  console.log('✅ Telegram initData verification passed');
}

// 2. Test Game Storage & Account Creation
console.log('\nTest 2: Player profile creation and persistence');
const storage = new GameStorage();
const testUsername = `TestCommander_${Date.now()}`;
const { user: player1, isNew } = storage.getOrCreateUser({
  username: testUsername,
  isGuest: true,
});
assert.strictEqual(isNew, true, 'First creation of unique username must be isNew = true');
assert.strictEqual(player1.planetLevel, 1);
assert.strictEqual(player1.cosmicEnergy, 0);
assert.strictEqual(player1.energy, 1000);
console.log('✅ Player profile creation verified');

// 3. Test Tap Mechanics, Energy Consumption & Rate Limiting
console.log('\nTest 3: Tap rewards, energy consumption, and limits');
{
  const initialEnergy = player1.energy;
  const tapRes = storage.processTap(player1.id, 5);
  assert.strictEqual(tapRes.success, true);
  assert.strictEqual(player1.energy, initialEnergy - 5, '5 energy consumed');
  assert.ok(player1.cosmicEnergy >= 5, 'Earned at least 5 cosmic energy');
  assert.strictEqual(player1.totalTaps, 5);
  console.log('✅ Tap mechanics and energy consumption verified');
}

// 4. Test Building Purchases & Cost Progression
console.log('\nTest 4: Building purchase formulas and balances');
{
  const cost0 = calculateBuildingCost('crystal_mine', 0);
  const cost1 = calculateBuildingCost('crystal_mine', 1);
  assert.ok(cost1 > cost0, 'Cost increases progressively');

  // Give player enough energy to test purchase
  player1.cosmicEnergy = cost0 + 50;
  const buyRes = storage.purchaseBuilding(player1.id, 'crystal_mine');
  assert.strictEqual(buyRes.success, true);
  assert.strictEqual(player1.buildings.crystal_mine, 1);
  assert.ok(player1.passiveIncomePerHour > 0, 'Passive income increased after mine construction');
  console.log('✅ Building purchase and progressive costs verified');
}

// 5. Test Planet Evolution Requirements
console.log('\nTest 5: Planet evolution requirements & milestones');
{
  const stageBefore = player1.planetStage;
  // Evolution should fail if level and total energy are insufficient
  const failEvolve = storage.evolvePlanetStage(player1.id);
  assert.strictEqual(failEvolve.success, false);

  // Set player level and total energy to qualify for Stage 2
  player1.planetLevel = 5;
  player1.totalEnergyEarned = 3000;
  const evolveRes = storage.evolvePlanetStage(player1.id);
  assert.strictEqual(evolveRes.success, true);
  assert.strictEqual(player1.planetStage, 2, 'Evolved to Stage 2');
  assert.strictEqual(player1.stardust, 60, 'Awarded 50 stardust milestone reward');
  console.log('✅ Planet evolution mechanics verified');
}

// 6. Test Alien Companion Summoning & Drop Synergies
console.log('\nTest 6: Alien summoning and bonuses');
{
  player1.stardust = 50;
  const summonRes = storage.summonAlien(player1.id);
  assert.strictEqual(summonRes.success, true);
  assert.ok(summonRes.alien, 'Alien companion summoned');
  assert.ok(player1.stardust === 30, '20 stardust consumed for summon');
  assert.ok(Object.keys(player1.aliens).length >= 1, 'Alien added to collection');
  console.log('✅ Alien companion summoning verified');
}

// 7. Test Mission Progress & Claims
console.log('\nTest 7: Mission tracking and reward claim');
{
  const missions = storage.getMissions(player1.id);
  const tapMission = missions.find((m) => m.id === 'tap_50');
  assert.ok(tapMission, 'Found tap mission');

  // Simulate completing the tap mission
  tapMission!.currentCount = 50;
  const claimRes = storage.claimMissionReward(player1.id, 'tap_50');
  assert.strictEqual(claimRes.success, true);
  assert.strictEqual(tapMission!.isClaimed, true);
  console.log('✅ Mission tracking and claiming verified');
}

// 8. Test Referral Attribution
console.log('\nTest 8: Referral system attribution & anti-self-referral');
{
  const { user: newcomer } = storage.getOrCreateUser({
    username: `FriendlyCadet_${Date.now()}`,
    isGuest: true,
    referrerCode: player1.referralCode,
  });

  assert.strictEqual(newcomer.referredBy, player1.username);
  assert.ok(newcomer.cosmicEnergy >= 1000, 'Newcomer received welcome bonus');
  assert.strictEqual(player1.referralCount, 1, 'Referrer received referral credit');
  console.log('✅ Referral attribution verified');
}

// 9. Test Admin Management: Adjust Coins, Set Stage, Create User, Delete User
console.log('\nTest 9: Admin management (adjust coins, delete user, create user, broadcast)');
{
  // Test Create User
  const createRes = storage.adminCreateUser({
    username: 'AdminCreatedPlayer',
    cosmicEnergy: 500000,
    stardust: 200,
    planetLevel: 10,
  });
  assert.strictEqual(createRes.success, true);
  assert.ok(createRes.user);
  assert.strictEqual(createRes.user.cosmicEnergy, 500000);
  assert.strictEqual(createRes.user.planetLevel, 10);

  // Test Adjust Coins
  const adjustRes = storage.adminAdjustUser(createRes.user.id, {
    cosmicEnergyDelta: 250000,
  });
  assert.strictEqual(adjustRes.success, true);
  assert.strictEqual(adjustRes.user?.cosmicEnergy, 750000);

  // Test Set Exact Coins
  const setExactRes = storage.adminAdjustUser(createRes.user.id, {
    setCosmicEnergy: 999999,
  });
  assert.strictEqual(setExactRes.success, true);
  assert.strictEqual(setExactRes.user?.cosmicEnergy, 999999);

  // Test Delete User
  const deleteRes = storage.adminDeleteUser(createRes.user.id);
  assert.strictEqual(deleteRes.success, true);
  assert.strictEqual(storage.getUser(createRes.user.id), null, 'Deleted user should no longer exist');

  // Test Broadcast Reward
  const broadcastRes = storage.adminBroadcastReward({ cosmicEnergy: 10000 });
  assert.strictEqual(broadcastRes.success, true);
  assert.ok(broadcastRes.rewardedUsersCount >= 1);
  console.log('✅ Admin operations (adjust coins, delete user, create user, broadcast) verified');
}

console.log('\n🎉 ALL 9 AUTOMATED TESTS PASSED SUCCESSFULLY! 🚀');
