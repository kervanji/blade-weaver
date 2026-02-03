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
    gems: 0, // العملة الجديدة النادرة

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

    // Characters System
    ownedCharacters: ['default'],
    activeCharacter: 'default',
    characterLevels: {
        'default': 1,
        'berserker': 1,
        'alchemist': 1,
        'king': 1,
        'miner': 1,
        'smith': 1,
        'treasurer': 1,
        'wise': 1,
        'engineer': 1,
        'luck': 1
    },

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
        totalGems: 0,
        bestSwordDamage: 0
    }
};

const Characters = {
    'default': { id: 'default', nameAr: "الحداد المبتدئ", icon: "🧙‍♂️", desc: "بطل متوازن، لا توجد علاوات إضافية.", cost: 0 },
    'berserker': { id: 'berserker', nameAr: "المحارب الهائج", icon: "🧔‍♂️", desc: "زيادة ضرر الهجوم الأساسي.", cost: 5, buffType: 'damage' },
    'alchemist': { id: 'alchemist', nameAr: "الخيميائي", icon: "🧪", desc: "زيادة كمية المواد المكتسبة من الأعداء.", cost: 10, buffType: 'materials' },
    'king': { id: 'king', nameAr: "الملك الذهبي", icon: "🤴", desc: "زيادة الذهب المكتسب من هزيمة الأعداء.", cost: 20, buffType: 'gold' },
    'miner': { id: 'miner', nameAr: "أسطورة المناجم", icon: "⛏️", desc: "زيادة قوة التعدين وفرصة المواد النادرة.", cost: 15, buffType: 'mining' },
    'smith': { id: 'smith', nameAr: "خبير الحدادة", icon: "⚒️", desc: "زيادة نقاط الحدادة المكتسبة عند النقر.", cost: 25, buffType: 'smithing' },
    'treasurer': { id: 'treasurer', nameAr: "صائد الكنوز", icon: "🗺️", desc: "زيادة فرصة الحصول على مواد من فئات نادرة.", cost: 30, buffType: 'rarity' },
    'wise': { id: 'wise', nameAr: "حكيم الأرواح", icon: "🕯️", desc: "زيادة أرواح السيف المكتسبة عند الصعود.", cost: 40, buffType: 'spirit' },
    'engineer': { id: 'engineer', nameAr: "المهندس الآلي", icon: "⚙️", desc: "زيادة قوة النقر التلقائي.", cost: 35, buffType: 'autoclick' },
    'luck': { id: 'luck', nameAr: "سيد الحظ", icon: "🎲", desc: "زيادة فرصة النجاح في صنع السيوف النادرة.", cost: 50, buffType: 'luck' }
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
    hammer: { base: 15, multiplier: 1.4 },
    bellows: { base: 50, multiplier: 1.8 },
    sharpener: { base: 100, multiplier: 1.6 },
    furnace: { base: 200, multiplier: 2.1 },
    pickaxe: { base: 75, multiplier: 1.5 }
};

// =====================================================
// DOM ELEMENTS
// =====================================================
const DOM = {
    // Header
    goldDisplay: document.getElementById('gold-display'),
    gemDisplay: document.getElementById('gem-display'),
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
    let pointsGained = gameState.clickPower * spiritBonus;

    // Smith Character Buff: Extra smithing points
    if (gameState.activeCharacter === 'smith') {
        pointsGained *= getCharacterBuff('smith');
    }

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

    // Adjustment: Use luck character buff
    let luckMultiplier = 1;
    if (gameState.activeCharacter === 'luck') {
        luckMultiplier = getCharacterBuff('luck');
    }

    let cumulative = 0;
    for (const [key, config] of Object.entries(table)) {
        const chance = config.chance * (key !== 'common' ? luckMultiplier : 1);
        cumulative += chance;
        if (roll < cumulative) return key;
    }
    return 'common';
}

// =====================================================
// MINING SYSTEM
// =====================================================
function handleRockClick() {
    let miningPower = gameState.upgrades.pickaxe;

    // Miner Character Buff: Mining power multiplier
    if (gameState.activeCharacter === 'miner') {
        miningPower *= getCharacterBuff('miner');
    }

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

    // Balanced Scaling: Linear early, Exponential later
    const isBoss = gameState.wave % 10 === 0;
    const waveMultiplier = Math.pow(1.1, gameState.wave) * (isBoss ? 4 : 1);
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

    // Berserker Buff: Damage Multiplier
    if (gameState.activeCharacter === 'berserker') {
        damage *= getCharacterBuff('berserker');
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

    // King Buff: Gold Multiplier
    let goldMultiplier = 1;
    if (gameState.activeCharacter === 'king') {
        goldMultiplier = getCharacterBuff('king');
    }

    // Calculate loot
    const goldReward = Math.floor(10 * gameState.wave * (1 + Math.random() * 0.5) * goldMultiplier);
    gameState.gold += goldReward;
    gameState.stats.totalGold += goldReward;

    // Boss Wave Gem Drop (Every 10 waves)
    // Alchemist Buff: Higher gem chance or amount (Optional, but let's stick to 10 characters)
    if (gameState.wave % 10 === 0) {
        if (Math.random() < 0.2) { // 20% chance for a Legend Gem
            gameState.gems += 1;
            gameState.stats.totalGems += 1;
            showFloatingText("+1 💎 حجر أسطوري!", 'gem');
        }
    }

    // Material drops
    const materialDrop = getMaterialDrop();
    if (materialDrop) {
        // Alchemist Buff: Bonus material amount based on level
        if (gameState.activeCharacter === 'alchemist') {
            materialDrop.amount += Math.floor(getCharacterBuff('alchemist'));
        }
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
    let dropChance = 30 + (gameState.wave * 2); // Higher waves = more drops

    // Treasurer Character Buff: Higher material drop chance
    if (gameState.activeCharacter === 'treasurer') {
        dropChance *= getCharacterBuff('treasurer');
    }

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
    let spiritsGained = Math.floor(gameState.wave / 10);

    // Wise Character Buff: Spirit bonus
    if (gameState.activeCharacter === 'wise') {
        spiritsGained = Math.floor(spiritsGained * getCharacterBuff('wise'));
    }

    DOM.gainedSpirits.textContent = spiritsGained;
}

function doPrestige() {
    if (gameState.wave < 50) return;

    // Calculate spirits gained
    let spiritsGained = Math.floor(gameState.wave / 10);

    // Wise Character Buff: Spirit bonus
    if (gameState.activeCharacter === 'wise') {
        spiritsGained = Math.floor(spiritsGained * getCharacterBuff('wise'));
    }

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
window.openChest = function (type) {
    let cost = 0;
    let currency = 'gold';

    if (type === 'wood') cost = 500;
    else if (type === 'steel') cost = 2500;
    else if (type === 'legend') { cost = 5; currency = 'gems'; }

    if (gameState[currency] < cost) {
        alert(`${currency === 'gold' ? '🪙 لا تملك ذهباً كافياً!' : '💎 لا تملك أحجاراً كافية!'}`);
        return;
    }

    gameState[currency] -= cost;

    // Calculate Rewards
    let rewards = [];
    if (type === 'wood') {
        const amt = random(5, 15);
        gameState.materials.iron += amt;
        rewards.push(`${amt} حديد`);
    } else if (type === 'steel') {
        const amt1 = random(10, 20);
        const amt2 = random(5, 10);
        gameState.materials.iron += amt1;
        gameState.materials.steel += amt2;
        rewards.push(`${amt1} حديد`, `${amt2} فولاذ`);
    } else if (type === 'legend') {
        const type = MATERIALS[random(0, MATERIALS.length - 1)];
        const amt = random(10, 30);
        gameState.materials[type] += amt;
        rewards.push(`${amt} ${MATERIAL_NAMES[type]}`);

        // Bonus: High chance for 1 extra gem
        if (Math.random() < 0.3) {
            gameState.gems += 1;
            rewards.push(`1 حجر أسطوري 💎`);
        }
    }

    updateUI();
    saveGame();
    alert(`🎁 فتحت الصندوق وحصلت على:\n${rewards.join('\n')}`);
};

function switchTab(tabName) {
    DOM.menuTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    DOM.tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === tabName + '-panel');
    });

    if (tabName === 'characters') {
        updateCharactersUI();
    }
}

function getCharacterBuff(id) {
    const level = gameState.characterLevels[id] || 1;
    const char = Characters[id];
    if (!char || !char.buffType) return 1;

    switch (char.buffType) {
        case 'damage': return 2 + (level - 1) * 0.5; // Starts x2, +0.5 per level
        case 'materials': return 1 + (level - 1) * 1; // Extra material amount
        case 'gold': return 1.5 + (level - 1) * 0.2; // Starts x1.5, +20% per level
        case 'mining': return 1 + level * 0.5; // Power multiplier
        case 'smithing': return 1 + level * 0.2; // Extra multiplier
        case 'rarity': return 1 + level * 0.1; // Luck multiplier
        case 'spirit': return 1 + level * 0.25; // Prestige bonus
        case 'autoclick': return level * 2; // Extra power
        case 'luck': return 1 + level * 0.05; // Crafting luck
        default: return 1;
    }
}

function updateCharactersUI() {
    const grid = document.getElementById('characters-grid');
    const gemCountDisplay = document.getElementById('chars-gem-count');
    if (!grid) return;

    if (gemCountDisplay) {
        gemCountDisplay.textContent = formatNumber(gameState.gems);
    }

    grid.innerHTML = '';
    Object.entries(Characters).forEach(([id, char]) => {
        const isOwned = gameState.ownedCharacters.includes(id);
        const isActive = gameState.activeCharacter === id;
        const level = gameState.characterLevels[id] || 1;
        const nextLevelCost = level * 10; // Upgrade cost: 10, 20, 30...

        const card = document.createElement('div');
        card.className = `character-card ${isActive ? 'active' : ''} ${isOwned ? 'owned' : ''}`;
        card.innerHTML = `
            <div class="char-icon">${char.icon}</div>
            <div class="char-info">
                <div class="char-name">${char.nameAr} ${isOwned ? `<span class="char-level">Lv.${level}</span>` : ''}</div>
                <div class="char-desc">${char.desc}</div>
                ${isOwned && id !== 'default' ? `<div class="char-buff-val">القوة الحالية: x${getCharacterBuff(id).toFixed(1)}</div>` : ''}
            </div>
            <div class="char-action">
                ${isActive ?
                '<button class="char-btn active-status" disabled>مجهز ✅</button>' :
                isOwned ?
                    `<button class="char-btn equip-btn" onclick="setActiveCharacter('${id}')">تجهيز</button>` :
                    `<button class="char-btn buy-btn" onclick="buyCharacter('${id}')">${char.cost} 💎</button>`
            }
                ${isOwned && id !== 'default' && level < 10 ?
                `<button class="char-btn upgrade-btn" onclick="upgradeCharacter('${id}')">تطوير (${nextLevelCost} 💎)</button>` :
                isOwned && level >= 10 ? '<span class="max-level">أقصى مستوى</span>' : ''
            }
            </div>
        `;
        grid.appendChild(card);
    });
}

window.upgradeCharacter = function (id) {
    const level = gameState.characterLevels[id] || 1;
    const upgradeCost = level * 10;

    if (gameState.gems >= upgradeCost) {
        gameState.gems -= upgradeCost;
        gameState.characterLevels[id] = level + 1;
        updateUI();
        updateCharactersUI();
        saveGame();
        alert(`✨ تم تطوير ${Characters[id].nameAr} إلى المستوى ${level + 1}!`);
    } else {
        alert("💎 لا تملك أحجار أساطير كافية للتطوير!");
    }
};

window.buyCharacter = function (id) {
    const char = Characters[id];
    if (gameState.gems >= char.cost) {
        gameState.gems -= char.cost;
        gameState.ownedCharacters.push(id);
        updateUI();
        updateCharactersUI();
        saveGame();
        alert(`🎉 تم شراء ${char.nameAr} بنجاح!`);
    } else {
        alert("💎 لا تملك أحجار أساطير كافية! اهزم الزعماء (كل 10 موجات) للحصول عليها.");
    }
};

window.setActiveCharacter = function (id) {
    gameState.activeCharacter = id;
    updateUI();
    updateCharactersUI();
    saveGame();
};

// =====================================================
// UI UPDATE FUNCTIONS
// =====================================================
function updateUI() {
    // Header
    DOM.goldDisplay.textContent = formatNumber(gameState.gold);
    if (DOM.gemDisplay) DOM.gemDisplay.textContent = formatNumber(gameState.gems);
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

        // Ensure characterLevels exists
        if (!gameState.characterLevels) {
            gameState.characterLevels = {};
        }

        // Populate missing levels
        Object.keys(Characters).forEach(id => {
            if (!gameState.characterLevels[id]) {
                gameState.characterLevels[id] = 1;
            }
        });

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
            let finalPower = gameState.autoClickPower;

            // Engineer Character Buff: Extra auto-click power
            if (gameState.activeCharacter === 'engineer') {
                finalPower += getCharacterBuff('engineer');
            }

            gameState.smithingPoints += finalPower * spiritBonus;
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
let playerName = null;

function showNameModal() {
    const nameModal = document.getElementById('name-modal');
    const nameInput = document.getElementById('player-name-input');
    const startBtn = document.getElementById('start-game-btn');

    // Check if player exists
    const existingPlayer = LeaderboardSystem.getPlayer();
    if (existingPlayer) {
        playerName = existingPlayer.name;
        nameModal.classList.add('hidden');
        startGameSystems();
        return;
    }

    nameModal.classList.remove('hidden');

    nameInput.addEventListener('input', () => {
        const name = nameInput.value.trim();
        startBtn.disabled = name.length < 2;
    });

    startBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name.length >= 2) {
            nameInput.blur(); // Hide keyboard
            playerName = name;
            LeaderboardSystem.createPlayer(name);
            nameModal.classList.add('hidden');
            startGameSystems();
        }
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startBtn.click();
        }
    });
}

function startGameSystems() {
    // Show tutorial for new players
    TutorialSystem.show(() => {
        console.log('Tutorial completed or skipped');
    });

    // Process potential referral for new player
    const player = LeaderboardSystem.getPlayer();
    if (player) {
        ReferralSystem.processNewPlayerReferral(player.id);
    }

    // Initialize missions
    updateMissionsUI();

    // Initialize leaderboard
    updateLeaderboardUI();

    // Setup Referral UI
    setupReferralUI();

    // Start game loops
    startCombatLoop();
    startAutoClickLoop();

    // Check for referral rewards every minute
    setInterval(() => {
        ReferralSystem.checkRewardsForReferrer();
    }, 60000);

    // Auto-save every 30 seconds
    setInterval(() => {
        saveGame();
        updateLeaderboard();
    }, 30000);

    console.log('⚔️ Blade Weaver initialized!');
}

function updateMissionsUI() {
    const missionsGrid = document.getElementById('missions-grid');
    if (!missionsGrid) return;

    const missions = MissionsSystem.getDailyMissions();
    missionsGrid.innerHTML = '';

    missions.forEach(mission => {
        const progressPercent = Math.min((mission.progress / mission.target) * 100, 100);

        const card = document.createElement('div');
        card.className = 'mission-card' + (mission.completed ? ' completed' : '') + (mission.claimed ? ' claimed' : '');

        card.innerHTML = `
            <div class="mission-icon">${mission.icon}</div>
            <div class="mission-info">
                <div class="mission-name">${mission.nameAr}</div>
                <div class="mission-desc">${mission.descAr}</div>
                <div class="mission-progress">
                    <div class="mission-progress-bar">
                        <div class="mission-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="mission-progress-text">${mission.progress}/${mission.target}</span>
                </div>
            </div>
            <div class="mission-reward">
                <span class="reward-amount">🪙 ${mission.reward}</span>
                ${mission.claimed ?
                '<span class="claimed-badge">✓ تم</span>' :
                mission.completed ?
                    `<button class="claim-btn" data-mission-id="${mission.id}">استلم</button>` :
                    '<button class="claim-btn" disabled>استلم</button>'
            }
            </div>
        `;

        missionsGrid.appendChild(card);
    });

    // Add claim button listeners
    missionsGrid.querySelectorAll('.claim-btn:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const missionId = e.target.dataset.missionId;
            const reward = MissionsSystem.claimReward(missionId);
            if (reward > 0) {
                gameState.gold += reward;
                gameState.stats.totalGold += reward;
                updateUI();
                updateMissionsUI();
                saveGame();
            }
        });
    });
}

async function updateLeaderboard() {
    if (!playerName) return;

    const score = MissionsSystem.calculateScore(gameState);
    await LeaderboardSystem.submitScore(
        playerName,
        score,
        gameState.stats.highestWave,
        gameState.stats.totalSwords
    );
    updateLeaderboardUI();
}

async function updateLeaderboardUI() {
    const leaderboardList = document.getElementById('leaderboard-list');
    const playerNameEl = document.getElementById('leaderboard-player-name');
    const playerScoreEl = document.getElementById('leaderboard-player-score');
    const playerRankEl = document.getElementById('leaderboard-player-rank');

    if (!leaderboardList) return;

    // Show loading if empty
    if (leaderboardList.innerHTML.trim() === '') {
        leaderboardList.innerHTML = '<div class="empty-leaderboard">جاري تحميل لوحة الصدارة...</div>';
    }

    // Update player card locally
    if (playerName) {
        playerNameEl.textContent = playerName;
        const score = MissionsSystem.calculateScore(gameState);
        playerScoreEl.textContent = formatNumber(score);
    }

    // Get top players from Firebase
    const topPlayers = await LeaderboardSystem.getTopPlayers(10);

    if (topPlayers.length === 0) {
        leaderboardList.innerHTML = '<div class="empty-leaderboard">لا توجد نتائج بعد - كن الأول!</div>';
        return;
    }

    leaderboardList.innerHTML = '';

    topPlayers.forEach((entry, index) => {
        const rank = index + 1;
        const isCurrentPlayer = entry.name === playerName;

        let rankClass = '';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';

        const div = document.createElement('div');
        div.className = 'leaderboard-entry' + (isCurrentPlayer ? ' current-player' : '');
        div.innerHTML = `
            <span class="entry-rank ${rankClass}">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}</span>
            <span class="entry-name">${entry.name}</span>
            <span class="entry-score">${formatNumber(entry.score)}</span>
            <span class="entry-wave">🌊 ${entry.wave}</span>
        `;
        leaderboardList.appendChild(div);
    });
}

// Track mission progress
function trackMissionProgress(type, amount = 1, absolute = false) {
    MissionsSystem.updateProgress(type, amount, absolute);
    updateMissionsUI();
}

function initGame() {
    // Check for referral link in URL
    ReferralSystem.checkReferralOnLoad();

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

    // Show name modal or start game
    showNameModal();
}

// Override original functions to track missions

// Track clicks
const originalHandleAnvilClick = handleAnvilClick;
handleAnvilClick = function () {
    originalHandleAnvilClick();
    trackMissionProgress('clicks', 1);
};

// Track enemies defeated
const originalDefeatEnemy = defeatEnemy;
defeatEnemy = function () {
    originalDefeatEnemy();
    trackMissionProgress('enemies', 1);
    trackMissionProgress('wave', gameState.wave, true);
    trackMissionProgress('gold', gameState.stats.totalGold, true);
    updateLeaderboard();
};

// Track swords crafted
const originalCraftSword = craftSword;
craftSword = function () {
    const beforeCount = gameState.stats.totalSwords;
    originalCraftSword();
    if (gameState.stats.totalSwords > beforeCount) {
        trackMissionProgress('swords', 1);
        // Check for rare sword
        if (gameState._tempSword && gameState._tempSword.rarity !== 'common') {
            trackMissionProgress('rare_sword', 1);
        }
        updateLeaderboard();
    }
};

// Track mining
const originalHandleRockClick = handleRockClick;
handleRockClick = function () {
    const beforeMats = Object.values(gameState.materials).reduce((a, b) => a + b, 0);
    originalHandleRockClick();
    const afterMats = Object.values(gameState.materials).reduce((a, b) => a + b, 0);
    if (afterMats > beforeMats) {
        trackMissionProgress('mining', afterMats - beforeMats);
    }
};

// Track prestige
const originalDoPrestige = doPrestige;
doPrestige = function () {
    originalDoPrestige();
    trackMissionProgress('prestige', 1);
    updateLeaderboard();
};

function setupReferralUI() {
    const linkInput = document.getElementById('referral-link-input');
    const copyBtn = document.getElementById('copy-ref-btn');
    const whatsappBtn = document.getElementById('share-whatsapp');
    const telegramBtn = document.getElementById('share-telegram');

    if (linkInput) {
        const link = ReferralSystem.getReferralLink();
        linkInput.value = link || "يجب تحديد اسم أولاً";
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            linkInput.select();
            document.execCommand('copy');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'تم النسخ!';
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        });
    }

    const shareText = "⚔️ انضم إلي في لعبة Blade Weaver! اصنع السيوف الأسطورية واحصل على 500 ذهبة هدية عند البدء من هذا الرابط:";
    const refLink = ReferralSystem.getReferralLink();

    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n" + refLink)}`);
        });
    }

    if (telegramBtn) {
        telegramBtn.addEventListener('click', () => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`);
        });
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);

