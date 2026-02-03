/**
 * BLADE WEAVER: The Eternal Smith
 * Core Game Logic
 */

// =====================================================
// GAME STATE
// =====================================================
const gameState = {
    // Resources
    gold: 0,
    smithingPoints: 0,

    // Click power
    clickPower: 1,
    autoClickPower: 0,

    // Upgrades
    upgrades: {
        hammer: 1,      // Click power
        bellows: 0,     // Auto-click per second
        sharpener: 0,   // % damage bonus
        furnace: 0,     // % rare chance bonus
        pickaxe: 1      // Mining power
    },

    // Materials
    materials: {
        iron: 0,
        steel: 0,
        obsidian: 0,
        dragonBone: 0,
        starMetal: 0
    },

    // Swords
    inventory: [],
    equippedSword: null,

    // Combat
    wave: 1,
    currentEnemy: null,

    // Prestige
    swordSpirit: 0,

    // Statistics
    stats: {
        totalClicks: 0,
        totalSwords: 0,
        totalEnemies: 0,
        highestWave: 1,
        totalGold: 0,
        bestSwordDamage: 0
    }
};

// =====================================================
// GAME CONSTANTS
// =====================================================
const CRAFT_COST = 100;
const SAVE_KEY = 'bladeWeaver_save';

const RARITY = {
    common: { name: 'عادي', nameEn: 'common', color: '#9ca3af', chance: 60, multiplier: 1 },
    rare: { name: 'نادر', nameEn: 'rare', color: '#3b82f6', chance: 25, multiplier: 1.5 },
    epic: { name: 'ملحمي', nameEn: 'epic', color: '#a855f7', chance: 10, multiplier: 2.5 },
    legendary: { name: 'أسطوري', nameEn: 'legendary', color: '#f59e0b', chance: 4, multiplier: 4 },
    mythic: { name: 'خرافي', nameEn: 'mythic', color: '#ef4444', chance: 1, multiplier: 7 }
};

const LUCK_RARITY = {
    common: { chance: 85 },
    rare: { chance: 10 },
    epic: { chance: 3.5 },
    legendary: { chance: 1.2 },
    mythic: { chance: 0.3 }
};

const MATERIALS = ['iron', 'steel', 'obsidian', 'dragonBone', 'starMetal'];
const MATERIAL_NAMES = {
    iron: 'حديد',
    steel: 'فولاذ',
    obsidian: 'سبج',
    dragonBone: 'عظم تنين',
    starMetal: 'معدن نجمي'
};

// Material tiers for crafting - each tier requires materials and gives bonuses
const MATERIAL_TIERS = {
    basic: {
        name: 'أساسي',
        materials: {},
        damageBonus: 1,
        speedBonus: 1,
        critBonus: 0,
        sellMultiplier: 1
    },
    iron: {
        name: 'حديدي',
        materials: { iron: 5 },
        damageBonus: 1.3,
        speedBonus: 1,
        critBonus: 2,
        sellMultiplier: 1.5
    },
    steel: {
        name: 'فولاذي',
        materials: { iron: 3, steel: 5 },
        damageBonus: 1.6,
        speedBonus: 1.1,
        critBonus: 5,
        sellMultiplier: 2
    },
    obsidian: {
        name: 'سبجي',
        materials: { steel: 3, obsidian: 5 },
        damageBonus: 2,
        speedBonus: 1.2,
        critBonus: 8,
        sellMultiplier: 3
    },
    dragon: {
        name: 'تنيني',
        materials: { obsidian: 3, dragonBone: 5 },
        damageBonus: 2.5,
        speedBonus: 1.3,
        critBonus: 12,
        sellMultiplier: 5
    },
    star: {
        name: 'نجمي',
        materials: { dragonBone: 3, starMetal: 5 },
        damageBonus: 3.5,
        speedBonus: 1.5,
        critBonus: 20,
        sellMultiplier: 10
    }
};

// Selected crafting tier
let selectedCraftTier = 'basic';

const SWORD_PREFIXES = ['سيف', 'نصل', 'حسام', 'صارم', 'قاطع'];
const SWORD_SUFFIXES = ['النار', 'الظلام', 'البرق', 'القدر', 'الفجر', 'الليل', 'الموت'];

const ENEMIES = [
    { name: 'غول', sprite: '👹', baseHp: 50 },
    { name: 'عفريت', sprite: '👺', baseHp: 80 },
    { name: 'شيطان', sprite: '😈', baseHp: 120 },
    { name: 'تنين صغير', sprite: '🐲', baseHp: 200 },
    { name: 'ملك الظلام', sprite: '👿', baseHp: 500 }
];

const UPGRADE_COSTS = {
    hammer: { base: 15, multiplier: 1.5 },
    bellows: { base: 50, multiplier: 2 },
    sharpener: { base: 100, multiplier: 1.8 },
    furnace: { base: 200, multiplier: 2.2 },
    pickaxe: { base: 75, multiplier: 1.6 }
};

// =====================================================
// DOM ELEMENTS
// =====================================================
const DOM = {
    // Header
    goldDisplay: document.getElementById('gold-display'),
    spiritDisplay: document.getElementById('spirit-display'),

    // Smithing
    anvil: document.getElementById('anvil'),
    hammerStrike: document.getElementById('hammer-strike'),
    clickFeedback: document.getElementById('click-feedback'),
    sparks: document.getElementById('sparks'),
    smithingPoints: document.getElementById('smithing-points'),
    clickPower: document.getElementById('click-power'),
    progressFill: document.getElementById('progress-fill'),
    progressPercent: document.getElementById('progress-percent'),
    craftBtn: document.getElementById('craft-btn'),
    luckCraftBtn: document.getElementById('luck-craft-btn'),

    // Mining
    miningRock: document.getElementById('mining-rock'),
    pickaxeAnim: document.getElementById('pickaxe-anim'),
    miningFeedback: document.getElementById('mining-feedback'),
    miningPowerDisplay: document.getElementById('mining-power-display'),

    // Equipped sword
    noSword: document.getElementById('no-sword'),
    swordInfo: document.getElementById('sword-info'),
    equippedName: document.getElementById('equipped-name'),
    equippedDamage: document.getElementById('equipped-damage'),
    equippedSpeed: document.getElementById('equipped-speed'),
    equippedCrit: document.getElementById('equipped-crit'),

    // Battle
    waveNumber: document.getElementById('wave-number'),
    warrior: document.getElementById('warrior'),
    enemy: document.getElementById('enemy'),
    enemySprite: document.getElementById('enemy-sprite'),
    enemyName: document.getElementById('enemy-name'),
    enemyHpFill: document.getElementById('enemy-hp-fill'),
    enemyHp: document.getElementById('enemy-hp'),
    enemyMaxHp: document.getElementById('enemy-max-hp'),
    battleEffects: document.getElementById('battle-effects'),
    lootItems: document.getElementById('loot-items'),

    // Materials
    ironCount: document.getElementById('iron-count'),
    steelCount: document.getElementById('steel-count'),
    obsidianCount: document.getElementById('obsidian-count'),
    dragonboneCount: document.getElementById('dragonbone-count'),
    starmetalCount: document.getElementById('starmetal-count'),

    // Menu tabs
    menuTabs: document.querySelectorAll('.menu-tab'),
    tabPanels: document.querySelectorAll('.tab-panel'),

    // Shop upgrades
    hammerLevel: document.getElementById('hammer-level'),
    hammerCost: document.getElementById('hammer-cost'),
    hammerBtn: document.getElementById('hammer-btn'),
    bellowsLevel: document.getElementById('bellows-level'),
    bellowsCost: document.getElementById('bellows-cost'),
    bellowsBtn: document.getElementById('bellows-btn'),
    sharpenerLevel: document.getElementById('sharpener-level'),
    sharpenerCost: document.getElementById('sharpener-cost'),
    sharpenerBtn: document.getElementById('sharpener-btn'),
    furnaceLevel: document.getElementById('furnace-level'),
    furnaceCost: document.getElementById('furnace-cost'),
    furnaceBtn: document.getElementById('furnace-btn'),
    pickaxeLevel: document.getElementById('pickaxe-level'),
    pickaxeCost: document.getElementById('pickaxe-cost'),
    pickaxeBtn: document.getElementById('pickaxe-btn'),

    // Inventory
    inventoryGrid: document.getElementById('inventory-grid'),

    // Stats
    totalClicks: document.getElementById('total-clicks'),
    totalSwords: document.getElementById('total-swords'),
    totalEnemies: document.getElementById('total-enemies'),
    highestWave: document.getElementById('highest-wave'),
    totalGold: document.getElementById('total-gold'),
    bestSword: document.getElementById('best-sword'),

    // Prestige
    prestigeTab: document.getElementById('prestige-tab'),
    currentSpirits: document.getElementById('current-spirits'),
    gainedSpirits: document.getElementById('gained-spirits'),
    prestigeBtn: document.getElementById('prestige-btn'),

    // Modal
    craftModal: document.getElementById('craft-modal'),
    newSword: document.getElementById('new-sword'),
    modalRarity: document.getElementById('modal-rarity'),
    modalSwordName: document.getElementById('modal-sword-name'),
    modalDamage: document.getElementById('modal-damage'),
    modalSpeed: document.getElementById('modal-speed'),
    modalCrit: document.getElementById('modal-crit'),
    equipNewBtn: document.getElementById('equip-new-btn'),
    keepBtn: document.getElementById('keep-btn')
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function getUpgradeCost(type) {
    const config = UPGRADE_COSTS[type];
    return Math.floor(config.base * Math.pow(config.multiplier, gameState.upgrades[type]));
}

// =====================================================
// SMITHING SYSTEM
// =====================================================
function handleAnvilClick() {
    // Calculate points gained
    const spiritBonus = 1 + gameState.swordSpirit;
    const pointsGained = gameState.clickPower * spiritBonus;

    gameState.smithingPoints += pointsGained;
    gameState.stats.totalClicks++;

    // Visual feedback
    showClickFeedback(pointsGained);
    showHammerStrike();
    createSparks();

    updateUI();
}

function showClickFeedback(points) {
    DOM.clickFeedback.textContent = '+' + formatNumber(points);
    DOM.clickFeedback.classList.remove('show');
    void DOM.clickFeedback.offsetWidth; // Trigger reflow
    DOM.clickFeedback.classList.add('show');
}

function showHammerStrike() {
    DOM.hammerStrike.classList.remove('strike');
    void DOM.hammerStrike.offsetWidth;
    DOM.hammerStrike.classList.add('strike');
}

function createSparks() {
    const sparkCount = 5 + Math.random() * 5;
    for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        spark.style.setProperty('--x', Math.cos(angle) * distance + 'px');
        spark.style.setProperty('--y', Math.sin(angle) * distance + 'px');
        spark.style.left = '50%';
        spark.style.top = '50%';
        DOM.sparks.appendChild(spark);

        setTimeout(() => spark.remove(), 500);
    }
}

// =====================================================
// CRAFTING SYSTEM
// =====================================================
function canCraft(tier = selectedCraftTier) {
    if (gameState.smithingPoints < CRAFT_COST) return false;

    const tierConfig = MATERIAL_TIERS[tier];
    for (const [material, amount] of Object.entries(tierConfig.materials)) {
        if ((gameState.materials[material] || 0) < amount) return false;
    }
    return true;
}

function craftSword() {
    if (!canCraft(selectedCraftTier)) return;

    const tierConfig = MATERIAL_TIERS[selectedCraftTier];

    // Consume smithing points
    gameState.smithingPoints -= CRAFT_COST;

    // Consume materials
    for (const [material, amount] of Object.entries(tierConfig.materials)) {
        gameState.materials[material] -= amount;
    }

    // Determine rarity
    const rarity = determineRarity();
    const rarityConfig = RARITY[rarity];

    // Calculate base stats with all bonuses
    const spiritBonus = 1 + gameState.swordSpirit;
    const sharpenerBonus = 1 + (gameState.upgrades.sharpener * 0.1);
    const materialDamageBonus = tierConfig.damageBonus;
    const materialCritBonus = tierConfig.critBonus;
    const materialSpeedBonus = tierConfig.speedBonus;

    const baseDamage = random(5, 15) * rarityConfig.multiplier * spiritBonus * sharpenerBonus * materialDamageBonus;
    const baseSpeed = randomFloat(0.8, 1.5) * materialSpeedBonus;
    const baseCrit = random(5, 15) + materialCritBonus + (rarity === 'mythic' ? 20 : rarity === 'legendary' ? 10 : 0);

    const sword = {
        id: Date.now(),
        name: generateSwordName(rarity, selectedCraftTier),
        rarity: rarity,
        tier: selectedCraftTier,
        damage: Math.floor(baseDamage),
        attackSpeed: parseFloat(baseSpeed.toFixed(2)),
        critChance: Math.min(baseCrit, 80), // Cap at 80%
        sellValue: Math.floor(baseDamage * 2 * tierConfig.sellMultiplier)
    };

    gameState.stats.totalSwords++;
    if (sword.damage > gameState.stats.bestSwordDamage) {
        gameState.stats.bestSwordDamage = sword.damage;
    }

    // Show sword modal
    showNewSwordModal(sword);

    updateUI();
    saveGame();
}

function determineRarity() {
    const furnaceBonus = gameState.upgrades.furnace * 5; // +5% rare chance per level
    let roll = Math.random() * 100;

    // Adjust roll for furnace bonus (shifts distribution toward rare)
    roll = Math.max(0, roll - furnaceBonus);

    let cumulative = 0;
    for (const [key, config] of Object.entries(RARITY)) {
        cumulative += config.chance;
        if (roll < cumulative) return key;
    }
    return 'common';
}

function generateSwordName(rarity, tier = 'basic') {
    const prefix = SWORD_PREFIXES[random(0, SWORD_PREFIXES.length - 1)];
    const tierConfig = MATERIAL_TIERS[tier];

    if (rarity === 'common') {
        return prefix + ' ' + tierConfig.name;
    }
    const suffix = SWORD_SUFFIXES[random(0, SWORD_SUFFIXES.length - 1)];
    return prefix + ' ' + suffix + ' (' + tierConfig.name + ')';
}

// Sell sword function
function sellSword(swordId) {
    const swordIndex = gameState.inventory.findIndex(s => s.id === swordId);
    if (swordIndex === -1) return;

    const sword = gameState.inventory[swordIndex];

    // Cannot sell equipped sword
    if (gameState.equippedSword && gameState.equippedSword.id === swordId) {
        return;
    }

    // Calculate sell value
    const sellValue = sword.sellValue || Math.floor(sword.damage * 2);
    gameState.gold += sellValue;
    gameState.stats.totalGold += sellValue;

    // Remove from inventory
    gameState.inventory.splice(swordIndex, 1);

    updateInventoryUI();
    updateUI();
    saveGame();
}

// Sell all non-equipped swords
function sellAllSwords() {
    const equippedId = gameState.equippedSword ? gameState.equippedSword.id : null;
    let totalValue = 0;

    gameState.inventory = gameState.inventory.filter(sword => {
        if (sword.id === equippedId) return true;
        totalValue += sword.sellValue || Math.floor(sword.damage * 2);
        return false;
    });

    gameState.gold += totalValue;
    gameState.stats.totalGold += totalValue;

    updateInventoryUI();
    updateUI();
    saveGame();
}

// Select crafting tier
function selectCraftTier(tier) {
    selectedCraftTier = tier;
    updateCraftingUI();
}

function craftLuckSword() {
    const cost = 150;
    if (gameState.smithingPoints < cost) return;

    gameState.smithingPoints -= cost;

    // Determine rarity using LUCK_RARITY tables (lower chance)
    const rarity = determineRarity(true);
    const rarityConfig = RARITY[rarity];

    const spiritBonus = 1 + gameState.swordSpirit;
    const sharpenerBonus = 1 + (gameState.upgrades.sharpener * 0.1);

    const baseDamage = random(3, 12) * rarityConfig.multiplier * spiritBonus * sharpenerBonus;
    const baseSpeed = randomFloat(0.7, 1.3);
    const baseCrit = random(2, 10) + (rarity === 'mythic' ? 15 : rarity === 'legendary' ? 8 : 0);

    const sword = {
        id: Date.now(),
        name: generateSwordName(rarity, 'basic') + ' (حظ)',
        rarity: rarity,
        tier: 'basic',
        damage: Math.floor(baseDamage),
        attackSpeed: parseFloat(baseSpeed.toFixed(2)),
        critChance: Math.min(baseCrit, 75),
        sellValue: Math.floor(baseDamage * 1.5)
    };

    gameState.stats.totalSwords++;
    showNewSwordModal(sword);
    updateUI();
    saveGame();
}

function determineRarity(isLuckCraft = false) {
    const table = isLuckCraft ? LUCK_RARITY : RARITY;
    const furnaceBonus = isLuckCraft ? 0 : (gameState.upgrades.furnace * 5);
    let roll = Math.random() * 100;

    roll = Math.max(0, roll - furnaceBonus);

    let cumulative = 0;
    for (const [key, config] of Object.entries(table)) {
        cumulative += config.chance;
        if (roll < cumulative) return key;
    }
    return 'common';
}

// =====================================================
// MINING SYSTEM
// =====================================================
function handleRockClick() {
    const miningPower = gameState.upgrades.pickaxe;
    const spiritBonus = 1 + gameState.swordSpirit;
    const pointsGained = Math.floor(miningPower * 2 * spiritBonus);

    gameState.smithingPoints += pointsGained;

    // Small chance for materials
    let droppedMat = null;
    if (Math.random() < 0.1 + (miningPower * 0.01)) {
        const matIndex = Math.min(Math.floor(gameState.wave / 15), MATERIALS.length - 1);
        const type = MATERIALS[random(0, matIndex)];
        const amount = 1;
        gameState.materials[type] += amount;
        droppedMat = { type, amount };
    }

    // Visuals
    showMiningFeedback(pointsGained, droppedMat);
    animateMining();
    updateUI();
}

function animateMining() {
    DOM.miningRock.classList.remove('shake');
    DOM.pickaxeAnim.classList.remove('swing');
    void DOM.miningRock.offsetWidth;
    DOM.miningRock.classList.add('shake');
    DOM.pickaxeAnim.classList.add('swing');
}

function showMiningFeedback(points, material) {
    const feedback = document.createElement('div');
    feedback.className = 'click-feedback show';
    feedback.style.left = (50 + random(-20, 20)) + '%';
    feedback.style.top = (50 + random(-20, 20)) + '%';

    let text = `+${points}`;
    if (material) {
        text += `\n✨${MATERIAL_NAMES[material.type]}`;
    }
    feedback.innerText = text;

    DOM.miningFeedback.appendChild(feedback);
    setTimeout(() => feedback.remove(), 800);
}

function showNewSwordModal(sword) {
    const rarityConfig = RARITY[sword.rarity];

    DOM.newSword.className = 'new-sword ' + rarityConfig.nameEn;
    DOM.modalRarity.textContent = rarityConfig.name;
    DOM.modalSwordName.textContent = sword.name;
    DOM.modalDamage.textContent = sword.damage;
    DOM.modalSpeed.textContent = sword.attackSpeed.toFixed(2);
    DOM.modalCrit.textContent = sword.critChance + '%';

    // Store sword reference for button handlers
    DOM.craftModal.dataset.swordId = sword.id;
    gameState._tempSword = sword;

    DOM.craftModal.classList.remove('hidden');
}

function equipSword(sword) {
    gameState.equippedSword = sword;
    updateEquippedSwordUI();
}

function addToInventory(sword) {
    if (gameState.inventory.length >= 20) {
        // Remove lowest damage sword if inventory is full
        gameState.inventory.sort((a, b) => a.damage - b.damage);
        gameState.inventory.shift();
    }
    gameState.inventory.push(sword);
    updateInventoryUI();
}

function closeModal() {
    DOM.craftModal.classList.add('hidden');
    gameState._tempSword = null;
}

// =====================================================
// COMBAT SYSTEM
// =====================================================
function spawnEnemy() {
    const enemyIndex = Math.min(Math.floor(gameState.wave / 10), ENEMIES.length - 1);
    const baseEnemy = ENEMIES[enemyIndex];

    const waveMultiplier = 1 + (gameState.wave * 0.2);
    const hp = Math.floor(baseEnemy.baseHp * waveMultiplier);

    gameState.currentEnemy = {
        name: baseEnemy.name,
        sprite: baseEnemy.sprite,
        hp: hp,
        maxHp: hp
    };

    updateEnemyUI();
}

function attackEnemy() {
    if (!gameState.currentEnemy) return;

    // Default stats if no sword is equipped
    let damage = 1;
    let critChance = 5;
    let isCrit = false;

    if (gameState.equippedSword) {
        damage = gameState.equippedSword.damage;
        critChance = gameState.equippedSword.critChance;
    }

    // Critical hit check
    if (Math.random() * 100 < critChance) {
        damage = Math.floor(damage * 2);
        isCrit = true;
    }

    // Apply damage
    gameState.currentEnemy.hp -= damage;

    // Show damage number
    showDamageNumber(damage, isCrit);

    // Animate warrior attack
    DOM.warrior.querySelector('.character-sprite').style.animation = 'none';
    void DOM.warrior.offsetWidth;
    DOM.warrior.querySelector('.character-sprite').style.animation = 'attack-swing 0.3s ease, idle-bounce 2s infinite 0.3s';

    // Check if enemy is dead
    if (gameState.currentEnemy.hp <= 0) {
        defeatEnemy();
    }

    updateEnemyUI();
}

function showDamageNumber(damage, isCrit) {
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-number' + (isCrit ? ' crit' : '');
    damageEl.textContent = (isCrit ? '💥 ' : '') + formatNumber(damage);
    damageEl.style.left = (50 + random(-20, 20)) + '%';
    damageEl.style.top = '40%';
    DOM.battleEffects.appendChild(damageEl);

    setTimeout(() => damageEl.remove(), 1000);
}

function defeatEnemy() {
    gameState.stats.totalEnemies++;

    // Calculate loot
    const goldReward = Math.floor(10 * gameState.wave * (1 + Math.random() * 0.5));
    gameState.gold += goldReward;
    gameState.stats.totalGold += goldReward;

    // Material drops
    const materialDrop = getMaterialDrop();
    if (materialDrop) {
        gameState.materials[materialDrop.type] += materialDrop.amount;
    }

    // Show loot
    showLoot(goldReward, materialDrop);

    // Next wave
    gameState.wave++;
    if (gameState.wave > gameState.stats.highestWave) {
        gameState.stats.highestWave = gameState.wave;
    }

    // Check prestige availability
    updatePrestigeAvailability();

    // Spawn next enemy
    setTimeout(() => spawnEnemy(), 500);

    updateUI();
    saveGame();
}

function getMaterialDrop() {
    const dropChance = 30 + (gameState.wave * 2); // Higher waves = more drops
    if (Math.random() * 100 > dropChance) return null;

    // Determine material type based on wave
    let materialIndex = 0;
    if (gameState.wave >= 50) materialIndex = random(0, 4);
    else if (gameState.wave >= 30) materialIndex = random(0, 3);
    else if (gameState.wave >= 15) materialIndex = random(0, 2);
    else if (gameState.wave >= 5) materialIndex = random(0, 1);

    const type = MATERIALS[materialIndex];
    return { type, amount: random(1, 3) };
}

function showLoot(gold, material) {
    DOM.lootItems.innerHTML = '';

    const goldEl = document.createElement('div');
    goldEl.className = 'loot-item';
    goldEl.textContent = '🪙 +' + formatNumber(gold);
    DOM.lootItems.appendChild(goldEl);

    if (material) {
        const matEl = document.createElement('div');
        matEl.className = 'loot-item';
        matEl.textContent = `+${material.amount} ${MATERIAL_NAMES[material.type]}`;
        DOM.lootItems.appendChild(matEl);
    }

    // Clear loot after delay
    setTimeout(() => {
        DOM.lootItems.innerHTML = '';
    }, 2000);
}

// =====================================================
// UPGRADE SYSTEM
// =====================================================
function buyUpgrade(type) {
    const cost = getUpgradeCost(type);
    if (gameState.gold < cost) return;

    gameState.gold -= cost;
    gameState.upgrades[type]++;

    // Apply upgrade effects
    switch (type) {
        case 'hammer':
            gameState.clickPower = gameState.upgrades.hammer;
            break;
        case 'bellows':
            gameState.autoClickPower = gameState.upgrades.bellows;
            break;
    }

    updateUI();
    saveGame();
}

// =====================================================
// PRESTIGE SYSTEM
// =====================================================
function updatePrestigeAvailability() {
    const canPrestige = gameState.wave >= 50;
    DOM.prestigeTab.classList.toggle('available', canPrestige);
    DOM.prestigeBtn.disabled = !canPrestige;

    // Calculate potential spirits gained
    const spiritsGained = Math.floor(gameState.wave / 10);
    DOM.gainedSpirits.textContent = spiritsGained;
}

function doPrestige() {
    if (gameState.wave < 50) return;

    // Calculate spirits gained
    const spiritsGained = Math.floor(gameState.wave / 10);
    gameState.swordSpirit += spiritsGained;

    // Reset progress but keep spirits
    gameState.gold = 0;
    gameState.smithingPoints = 0;
    gameState.clickPower = 1;
    gameState.autoClickPower = 0;
    gameState.gold = 0;
    gameState.smithingPoints = 0;
    gameState.clickPower = 1;
    gameState.autoClickPower = 0;
    gameState.upgrades = { hammer: 1, bellows: 0, sharpener: 0, furnace: 0, pickaxe: 1 };
    gameState.materials = { iron: 0, steel: 0, obsidian: 0, dragonBone: 0, starMetal: 0 };
    gameState.inventory = [];
    gameState.equippedSword = null;
    gameState.wave = 1;
    gameState.currentEnemy = null;

    // Respawn enemy
    spawnEnemy();

    updateUI();
    saveGame();

    // Visual feedback
    alert('🌟 تم الصعود! حصلت على ' + spiritsGained + ' روح سيف!');
}

// =====================================================
// TAB SYSTEM
// =====================================================
function switchTab(tabName) {
    DOM.menuTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    DOM.tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === tabName + '-panel');
    });
}

// =====================================================
// UI UPDATE FUNCTIONS
// =====================================================
function updateUI() {
    // Header
    DOM.goldDisplay.textContent = formatNumber(gameState.gold);
    DOM.spiritDisplay.textContent = formatNumber(gameState.swordSpirit);

    // Smithing
    DOM.smithingPoints.textContent = formatNumber(gameState.smithingPoints);
    DOM.clickPower.textContent = formatNumber(gameState.clickPower);

    // Progress bar
    const progress = Math.min(gameState.smithingPoints / CRAFT_COST * 100, 100);
    DOM.progressFill.style.width = progress + '%';
    DOM.progressPercent.textContent = Math.floor(progress) + '%';

    // Craft button
    DOM.craftBtn.disabled = !canCraft();

    // Wave
    DOM.waveNumber.textContent = gameState.wave;

    // Materials
    DOM.ironCount.textContent = gameState.materials.iron;
    DOM.steelCount.textContent = gameState.materials.steel;
    DOM.obsidianCount.textContent = gameState.materials.obsidian;
    DOM.dragonboneCount.textContent = gameState.materials.dragonBone;
    DOM.starmetalCount.textContent = gameState.materials.starMetal;

    // Upgrades
    updateUpgradeUI();

    // Stats
    updateStatsUI();

    // Prestige
    DOM.currentSpirits.textContent = gameState.swordSpirit;
    updatePrestigeAvailability();

    // Mining
    if (DOM.miningPowerDisplay) {
        DOM.miningPowerDisplay.textContent = gameState.upgrades.pickaxe;
    }

    // Luck Craft Button
    if (DOM.luckCraftBtn) {
        DOM.luckCraftBtn.disabled = gameState.smithingPoints < 150;
    }
}

function updateUpgradeUI() {
    const upgrades = ['hammer', 'bellows', 'sharpener', 'furnace'];

    upgrades.forEach(type => {
        const level = gameState.upgrades[type];
        const cost = getUpgradeCost(type);
        const canAfford = gameState.gold >= cost;

        DOM[type + 'Level'].textContent = level;
        DOM[type + 'Cost'].textContent = formatNumber(cost);
        DOM[type + 'Btn'].disabled = !canAfford;
    });

    // Pickaxe upgrade special case as it's added later
    if (DOM.pickaxeBtn) {
        const cost = getUpgradeCost('pickaxe');
        DOM.pickaxeLevel.textContent = gameState.upgrades.pickaxe;
        DOM.pickaxeCost.textContent = formatNumber(cost);
        DOM.pickaxeBtn.disabled = gameState.gold < cost;
    }
}

function updateEquippedSwordUI() {
    if (gameState.equippedSword) {
        DOM.noSword.style.display = 'none';
        DOM.swordInfo.classList.remove('hidden');

        const sword = gameState.equippedSword;
        const rarityConfig = RARITY[sword.rarity];

        DOM.equippedName.textContent = sword.name;
        DOM.equippedName.style.color = rarityConfig.color;
        DOM.equippedDamage.textContent = sword.damage;
        DOM.equippedSpeed.textContent = sword.attackSpeed.toFixed(2);
        DOM.equippedCrit.textContent = sword.critChance + '%';
    } else {
        DOM.noSword.style.display = 'block';
        DOM.swordInfo.classList.add('hidden');
    }
}

function updateEnemyUI() {
    if (gameState.currentEnemy) {
        const enemy = gameState.currentEnemy;
        DOM.enemySprite.textContent = enemy.sprite;
        DOM.enemyName.textContent = enemy.name;
        DOM.enemyHp.textContent = formatNumber(Math.max(0, enemy.hp));
        DOM.enemyMaxHp.textContent = formatNumber(enemy.maxHp);
        DOM.enemyHpFill.style.width = Math.max(0, enemy.hp / enemy.maxHp * 100) + '%';
    }
}

function updateInventoryUI() {
    if (gameState.inventory.length === 0) {
        DOM.inventoryGrid.innerHTML = '<div class="empty-inventory">لا توجد سيوف - اصنع سيفك الأول!</div>';
        return;
    }

    DOM.inventoryGrid.innerHTML = '';

    // Add sell all button if there are non-equipped swords
    const equippedId = gameState.equippedSword ? gameState.equippedSword.id : null;
    const sellableSwords = gameState.inventory.filter(s => s.id !== equippedId);

    if (sellableSwords.length > 0) {
        const totalValue = sellableSwords.reduce((sum, s) => sum + (s.sellValue || Math.floor(s.damage * 2)), 0);
        const sellAllBtn = document.createElement('button');
        sellAllBtn.className = 'sell-all-btn';
        sellAllBtn.innerHTML = `💰 بيع الكل (${sellableSwords.length} سيوف) - ${formatNumber(totalValue)} ذهب`;
        sellAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('هل تريد بيع جميع السيوف غير المجهزة؟')) {
                sellAllSwords();
            }
        });
        DOM.inventoryGrid.appendChild(sellAllBtn);
    }

    // Sort by damage descending
    const sortedInventory = [...gameState.inventory].sort((a, b) => b.damage - a.damage);

    sortedInventory.forEach(sword => {
        const rarityConfig = RARITY[sword.rarity];
        const isEquipped = gameState.equippedSword && gameState.equippedSword.id === sword.id;
        const sellValue = sword.sellValue || Math.floor(sword.damage * 2);

        const card = document.createElement('div');
        card.className = 'sword-card ' + rarityConfig.nameEn;
        card.innerHTML = `
            <div class="rarity-badge">${rarityConfig.name}</div>
            <div class="sword-icon">🗡️</div>
            <div class="sword-name">${sword.name}</div>
            <div class="sword-stats">
                ⚔️${sword.damage} ⚡${sword.attackSpeed} 💥${sword.critChance}%
            </div>
            ${isEquipped ? '<div class="equip-indicator">مجهز</div>' :
                `<div class="sword-actions">
                    <button class="equip-btn-small">تجهيز</button>
                    <button class="sell-btn-small">بيع 🪙${formatNumber(sellValue)}</button>
                </div>`
            }
        `;

        if (!isEquipped) {
            card.querySelector('.equip-btn-small').addEventListener('click', (e) => {
                e.stopPropagation();
                equipSword(sword);
                updateInventoryUI();
                updateEquippedSwordUI();
            });
            card.querySelector('.sell-btn-small').addEventListener('click', (e) => {
                e.stopPropagation();
                sellSword(sword.id);
            });
        }

        DOM.inventoryGrid.appendChild(card);
    });
}

// Update crafting UI to show material tier options
function updateCraftingUI() {
    const craftTiersEl = document.getElementById('craft-tiers');
    if (!craftTiersEl) return;

    craftTiersEl.innerHTML = '';

    Object.entries(MATERIAL_TIERS).forEach(([key, tier]) => {
        const canAfford = canCraft(key);
        const tierBtn = document.createElement('button');
        tierBtn.className = 'tier-btn' + (key === selectedCraftTier ? ' active' : '') + (canAfford ? '' : ' disabled');

        let materialsText = 'مجاني';
        if (Object.keys(tier.materials).length > 0) {
            materialsText = Object.entries(tier.materials)
                .map(([m, amt]) => `${MATERIAL_NAMES[m]}: ${amt}`)
                .join(' | ');
        }

        tierBtn.innerHTML = `
            <span class="tier-name">${tier.name}</span>
            <span class="tier-bonus">⚔️×${tier.damageBonus} ⚡×${tier.speedBonus} 💥+${tier.critBonus}%</span>
            <span class="tier-materials">${materialsText}</span>
        `;

        tierBtn.addEventListener('click', () => {
            selectCraftTier(key);
        });

        craftTiersEl.appendChild(tierBtn);
    });

    // Update craft button state
    DOM.craftBtn.disabled = !canCraft(selectedCraftTier);
}

function updateStatsUI() {
    DOM.totalClicks.textContent = formatNumber(gameState.stats.totalClicks);
    DOM.totalSwords.textContent = formatNumber(gameState.stats.totalSwords);
    DOM.totalEnemies.textContent = formatNumber(gameState.stats.totalEnemies);
    DOM.highestWave.textContent = formatNumber(gameState.stats.highestWave);
    DOM.totalGold.textContent = formatNumber(gameState.stats.totalGold);
    DOM.bestSword.textContent = gameState.stats.bestSwordDamage > 0 ?
        '⚔️' + formatNumber(gameState.stats.bestSwordDamage) : '-';
}

// =====================================================
// SAVE/LOAD SYSTEM
// =====================================================
function saveGame() {
    const saveData = {
        ...gameState,
        _tempSword: undefined // Don't save temp data
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(gameState, data);

        // Recalculate derived values
        gameState.clickPower = gameState.upgrades.hammer || 1;
        gameState.autoClickPower = gameState.upgrades.bellows || 0;

        // Ensure new fields exist
        if (gameState.upgrades.pickaxe === undefined) gameState.upgrades.pickaxe = 1;
    }
}

// =====================================================
// GAME LOOPS
// =====================================================
let combatInterval = null;
let autoClickInterval = null;

function startCombatLoop() {
    combatInterval = setInterval(() => {
        if (gameState.currentEnemy) {
            attackEnemy();
        }
    }, 1000);
}

function startAutoClickLoop() {
    autoClickInterval = setInterval(() => {
        if (gameState.autoClickPower > 0) {
            const spiritBonus = 1 + gameState.swordSpirit;
            gameState.smithingPoints += gameState.autoClickPower * spiritBonus;
            updateUI();
        }
    }, 1000);
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function setupEventListeners() {
    // Anvil click
    DOM.anvil.addEventListener('click', handleAnvilClick);

    // Craft button
    DOM.craftBtn.addEventListener('click', craftSword);

    // Modal buttons
    DOM.equipNewBtn.addEventListener('click', () => {
        if (gameState._tempSword) {
            equipSword(gameState._tempSword);
            addToInventory(gameState._tempSword);
            updateEquippedSwordUI();
        }
        closeModal();
    });

    DOM.keepBtn.addEventListener('click', () => {
        if (gameState._tempSword) {
            addToInventory(gameState._tempSword);
        }
        closeModal();
    });

    // Close modal on background click
    DOM.craftModal.addEventListener('click', (e) => {
        if (e.target === DOM.craftModal) {
            if (gameState._tempSword) {
                addToInventory(gameState._tempSword);
            }
            closeModal();
        }
    });

    // Tab switching
    DOM.menuTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Upgrade buttons
    DOM.hammerBtn.addEventListener('click', () => buyUpgrade('hammer'));
    DOM.bellowsBtn.addEventListener('click', () => buyUpgrade('bellows'));
    DOM.sharpenerBtn.addEventListener('click', () => buyUpgrade('sharpener'));
    DOM.furnaceBtn.addEventListener('click', () => buyUpgrade('furnace'));
    DOM.pickaxeBtn.addEventListener('click', () => buyUpgrade('pickaxe'));

    // Mining Rock
    DOM.miningRock.addEventListener('click', handleRockClick);

    // Luck Craft
    DOM.luckCraftBtn.addEventListener('click', craftLuckSword);

    // Prestige button
    DOM.prestigeBtn.addEventListener('click', doPrestige);

    // Keyboard shortcut for clicking
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !DOM.craftModal.classList.contains('hidden') === false) {
            handleAnvilClick();
        }
    });
}

// =====================================================
// INITIALIZATION
// =====================================================
function initGame() {
    // Load saved game
    loadGame();

    // Setup event listeners
    setupEventListeners();

    // Spawn initial enemy
    if (!gameState.currentEnemy) {
        spawnEnemy();
    } else {
        updateEnemyUI();
    }

    // Update UI
    updateUI();
    updateEquippedSwordUI();
    updateInventoryUI();
    updateCraftingUI();

    // Start game loops
    startCombatLoop();
    startAutoClickLoop();

    // Auto-save every 30 seconds
    setInterval(saveGame, 30000);

    console.log('⚔️ Blade Weaver initialized!');
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
