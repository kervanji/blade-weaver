/**
 * BLADE WEAVER: The Eternal Smith
 * Core Game Logic
 */

// =====================================================
// GAME STATE
// =====================================================
var gameState = {
    // Resources
    gold: 0,
    smithingPoints: 0,
    gems: 0, // العملة الجديدة النادرة
    arenaCoins: 0, // عملات الساحة
    arenaRankPoints: 0, // نقاط تصنيف الساحة
    allianceId: null, // معرف التحالف

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

    // Equipment slots
    equipment: {
        head: null,
        body: null,
        weapon: null
    },
    inventory: [],

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
    hp: 100,
    maxHp: 100,
    defense: 0,

    // Prestige
    swordSpirit: 0,
    pityCounter: 0,

    // Statistics
    stats: {
        totalClicks: 0,
        totalSwords: 0,
        totalEnemies: 0,
        highestWave: 1,
        totalGold: 0,
        totalGems: 0,
        bestSwordDamage: 0
    },
    claimedRewards: [],
    lastAdRewardTime: 0,
    lastFreeUpgradeTime: 0,
    lastMegaAdChestTime: 0,
    settings: {
        notificationsEnabled: false,
        autoSellCommon: false
    }
};

const Characters = {
    'default': { id: 'default', nameAr: "الحداد المبتدئ", icon: "🧙‍♂️", desc: "بطل متوازن، لا توجد علاوات إضافية.", cost: 0, class: 'warrior', allowedTypes: ['sword', 'heavy_plate', 'helm'] },
    'berserker': { id: 'berserker', nameAr: "المحارب الهائج", icon: "🧔‍♂️", desc: "زيادة ضرر الهجوم الأساسي.", cost: 5, buffType: 'damage', class: 'warrior', allowedTypes: ['sword', 'heavy_plate', 'helm'] },
    'alchemist': { id: 'alchemist', nameAr: "الخيميائي", icon: "🧪", desc: "زيادة كمية المواد المكتسبة من الأعداء.", cost: 10, buffType: 'materials', class: 'mage', allowedTypes: ['staff', 'robe', 'circlet'] },
    'king': { id: 'king', nameAr: "الملك الذهبي", icon: "🤴", desc: "زيادة الذهب المكتسب من هزيمة الأعداء.", cost: 20, buffType: 'gold', class: 'warrior', allowedTypes: ['sword', 'heavy_plate', 'helm'] },
    'miner': { id: 'miner', nameAr: "أسطورة المناجم", icon: "⛏️", desc: "زيادة قوة التعدين وفرصة المواد النادرة.", cost: 15, buffType: 'mining', class: 'warrior', allowedTypes: ['sword', 'heavy_plate', 'helm'] },
    'smith': { id: 'smith', nameAr: "خبير الحدادة", icon: "⚒️", desc: "زيادة نقاط الحدادة المكتسبة عند النقر.", cost: 25, buffType: 'smithing', class: 'warrior', allowedTypes: ['sword', 'heavy_plate', 'helm'] },
    'treasurer': { id: 'treasurer', nameAr: "صائد الكنوز", icon: "🗺️", desc: "زيادة فرصة الحصول على مواد من فئات نادرة.", cost: 30, buffType: 'rarity', class: 'archer', allowedTypes: ['bow', 'leather_armor', 'hood'] },
    'wise': { id: 'wise', nameAr: "حكيم الأرواح", icon: "🕯️", desc: "زيادة أرواح السيف المكتسبة عند الصعود.", cost: 40, buffType: 'spirit', class: 'mage', allowedTypes: ['staff', 'robe', 'circlet'] },
    'engineer': { id: 'engineer', nameAr: "المهندس الآلي", icon: "⚙️", desc: "زيادة قوة النقر التلقائي.", cost: 35, buffType: 'autoclick', class: 'warrior', allowedTypes: ['sword', 'heavy_plate', 'helm'] },
    'luck': { id: 'luck', nameAr: "سيد الحظ", icon: "🎲", desc: "زيادة فرصة النجاح في صنع السيوف النادرة.", cost: 50, buffType: 'luck', class: 'archer', allowedTypes: ['bow', 'leather_armor', 'hood'] }
};

// =====================================================
// GLOBAL CONSTANTS
// =====================================================
const SAVE_KEY = 'bladeWeaver_save';
const TICK_RATE = 1000;
const CRAFT_COSTS = {
    basic: 100,
    iron: 150,
    steel: 220,
    obsidian: 320,
    dragon: 450,
    star: 600
};
window.DISABLE_IN_GAME_NOTIFICATIONS = true;

const ITEM_TYPES = {
    weapon: {
        warrior: { type: 'sword', name: 'سيف', icon: '⚔️' },
        mage: { type: 'staff', name: 'عصا', icon: '🪄' },
        archer: { type: 'bow', name: 'قوس', icon: '🏹' }
    },
    body: {
        warrior: { type: 'heavy_plate', name: 'درع ثقيل', icon: '🛡️' },
        mage: { type: 'robe', name: 'رداء سحري', icon: '🥋' },
        archer: { type: 'leather_armor', name: 'درع جلدي', icon: '👕' }
    },
    head: {
        warrior: { type: 'helm', name: 'خوذة معدنية', icon: '🪖' },
        mage: { type: 'circlet', name: 'تاج سحري', icon: '👑' },
        archer: { type: 'hood', name: 'قلنسوة', icon: '👤' }
    }
};

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

const MATERIAL_TIERS = {
    basic: { name: 'أساسي', materials: {}, damageBonus: 1, speedBonus: 1, critBonus: 0, sellMultiplier: 1 },
    iron: { name: 'حديد', materials: { iron: 5 }, damageBonus: 1.3, speedBonus: 1, critBonus: 2, sellMultiplier: 1.5 },
    steel: { name: 'فولاذي', materials: { iron: 3, steel: 5 }, damageBonus: 1.6, speedBonus: 1.1, critBonus: 5, sellMultiplier: 2 },
    obsidian: { name: 'سبجي', materials: { steel: 3, obsidian: 5 }, damageBonus: 2, speedBonus: 1.2, critBonus: 8, sellMultiplier: 3 },
    dragon: { name: 'تنيني', materials: { obsidian: 3, dragonBone: 5 }, damageBonus: 2.5, speedBonus: 1.3, critBonus: 12, sellMultiplier: 5 },
    star: { name: 'نجمي', materials: { dragonBone: 3, starMetal: 5 }, damageBonus: 3.5, speedBonus: 1.5, critBonus: 20, sellMultiplier: 10 }
};

const MATERIALS = ['iron', 'steel', 'obsidian', 'dragonBone', 'starMetal'];
const MATERIAL_NAMES = {
    iron: 'حديد',
    steel: 'فولاذ',
    obsidian: 'سبج',
    dragonBone: 'عظم تنين',
    starMetal: 'معدن نجمي'
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
    sharpener: { base: 75, multiplier: 1.6 }, // Reduced from 100
    furnace: { base: 150, multiplier: 2.1 },  // Reduced from 200
    pickaxe: { base: 75, multiplier: 1.5 }
};

// =====================================================
// DOM ELEMENTS
// =====================================================
let DOM = {};

function initDOM() {
    DOM = {
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
        luckCraftBtn: document.getElementById('luck-btn'),

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
        waveNumber: document.getElementById('current-wave'),
        warrior: document.getElementById('warrior'),
        enemy: document.getElementById('enemy'),
        enemySprite: document.getElementById('enemy-sprite'),
        enemyName: document.getElementById('enemy-name'),
        enemyHpFill: document.getElementById('enemy-hp-fill'),
        enemyHp: document.getElementById('enemy-hp'),
        enemyMaxHp: document.getElementById('enemy-max-hp'),
        playerHpFill: document.getElementById('player-hp-fill'),
        playerHp: document.getElementById('player-hp'),
        playerMaxHp: document.getElementById('player-max-hp'),
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
        tabPanelsContainer: document.querySelector('.tab-panels'),

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
        modalTitle: document.getElementById('modal-title'),
        modalIcon: document.getElementById('modal-icon'),
        modalDamage: document.getElementById('modal-damage'),
        modalSpeed: document.getElementById('modal-speed'),
        modalCrit: document.getElementById('modal-crit'),
        equipNewBtn: document.getElementById('equip-new-btn'),
        keepBtn: document.getElementById('keep-btn'),

        // Arena/Alliance
        arenaCoinDisplay: document.getElementById('arena-coin-display'),
    };
}

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

function getCraftCost(tier = selectedCraftTier) {
    return CRAFT_COSTS[tier] || CRAFT_COSTS.basic;
}

function getUpgradeCost(type) {
    const config = UPGRADE_COSTS[type];
    return Math.floor(config.base * Math.pow(config.multiplier, gameState.upgrades[type]));
}

function getGeometricBonus(level) {
    if (level <= 0) return 0;
    let bonus = Math.pow(2, level); // 2, 4, 8, 16...
    if (bonus > 100) bonus = 100;
    return bonus;
}

function getSharpenerBonusPercent() {
    return Math.min(100, (gameState.upgrades.sharpener || 0) * 10);
}

function getFurnaceBonusPercent() {
    return Math.min(50, (gameState.upgrades.furnace || 0) * 5);
}

function recalculatePlayerStats() {
    let baseHp = 100;
    let baseDef = 0;

    // Add equipment stats
    if (gameState.equipment.body) {
        baseHp += gameState.equipment.body.hp || 0;
        baseDef += gameState.equipment.body.defense || 0;
    }

    if (gameState.equipment.head) {
        baseHp += gameState.equipment.head.hp || 0;
        baseDef += gameState.equipment.head.defense || 0;
    }

    gameState.maxHp = baseHp;
    gameState.defense = baseDef;

    // Cap current HP
    if (gameState.hp > gameState.maxHp) gameState.hp = gameState.maxHp;
    // Don't heal automatically on recalc, preventing exploit
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
// ITEM ICON HELPER
// =====================================================
function getItemIcon(item) {
    // Get icon from ITEM_TYPES based on category and class
    if (item.category && item.class && ITEM_TYPES[item.category]?.[item.class]) {
        return ITEM_TYPES[item.category][item.class].icon;
    }
    // Fallback icons based on category
    const fallbacks = {
        weapon: '⚔️',
        body: '🛡️',
        head: '🪖'
    };
    return fallbacks[item.category] || '⚔️';
}

// =====================================================
// CRAFTING SYSTEM
// =====================================================
function canCraft(tier = selectedCraftTier) {
    if (gameState.smithingPoints < getCraftCost(tier)) return false;

    const tierConfig = MATERIAL_TIERS[tier];
    for (const [material, amount] of Object.entries(tierConfig.materials)) {
        if ((gameState.materials[material] || 0) < amount) return false;
    }
    return true;
}

function craftItem() {
    const activeChar = Characters[gameState.activeCharacter] || Characters.default;
    const category = selectedCategory || 'weapon';
    const tierConfig = MATERIAL_TIERS[selectedCraftTier];
    const typeInfo = ITEM_TYPES[category][activeChar.class];

    if (!canCraft(selectedCraftTier)) return;

    // Consume smithing points
    gameState.smithingPoints -= getCraftCost(selectedCraftTier);

    // Consume materials
    for (const [material, amount] of Object.entries(tierConfig.materials)) {
        gameState.materials[material] -= amount;
    }

    // Determine rarity
    const rarity = determineRarity();
    const rarityConfig = RARITY[rarity];
    if (rarity === 'common') {
        gameState.pityCounter = (gameState.pityCounter || 0) + 1;
    } else {
        gameState.pityCounter = 0;
    }

    // Calculate base stats
    const spiritBonus = 1 + gameState.swordSpirit;
    const sharpenerBonus = 1 + (getSharpenerBonusPercent() / 100);

    let item = {
        id: Date.now(),
        rarity: rarity,
        tier: selectedCraftTier,
        category: category,
        subType: typeInfo.type,
        class: activeChar.class,
        icon: typeInfo.icon
    };

    if (category === 'weapon') {
        const baseDamage = random(5, 15) * rarityConfig.multiplier * spiritBonus * sharpenerBonus * tierConfig.damageBonus;
        const baseSpeed = randomFloat(0.8, 1.5) * tierConfig.speedBonus;
        const baseCrit = random(5, 15) + tierConfig.critBonus + (rarity === 'mythic' ? 20 : rarity === 'legendary' ? 10 : 0);

        item.name = generateItemName(rarity, selectedCraftTier, typeInfo.name);
        item.damage = Math.floor(baseDamage);
        item.attackSpeed = parseFloat(baseSpeed.toFixed(2));
        item.critChance = Math.min(baseCrit, 80);
    } else {
        // Armor stats: HP and Defense
        const baseHp = random(20, 100) * rarityConfig.multiplier * tierConfig.damageBonus; // reusable multiplier
        const baseDef = random(1, 10) * rarityConfig.multiplier;

        item.name = generateItemName(rarity, selectedCraftTier, typeInfo.name);
        item.hp = Math.floor(baseHp);
        item.defense = Math.floor(baseDef);
    }

    item.sellValue = Math.floor((item.damage || item.hp / 5) * 2 * tierConfig.sellMultiplier);

    gameState.stats.totalSwords++; // Keeping the stat name
    if (item.damage && item.damage > gameState.stats.bestSwordDamage) {
        gameState.stats.bestSwordDamage = item.damage;
    }

    showNewItemModal(item);
    updateUI();
    saveGame(true); // Force cloud save on craft
}

function generateItemName(rarity, tier, baseTypeName) {
    const prefix = SWORD_PREFIXES[random(0, SWORD_PREFIXES.length - 1)];
    const tierName = MATERIAL_TIERS[tier].name;

    if (rarity === 'common') {
        return prefix + ' ' + tierName + ' ' + baseTypeName;
    }
    const suffix = SWORD_SUFFIXES[random(0, SWORD_SUFFIXES.length - 1)];
    return prefix + ' ' + suffix + ' (' + tierName + ' ' + baseTypeName + ')';
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

// Utility: Show Toast Notification
// Utility: Show Toast Notification (Disabled as per request)
function showToast(message, type = 'info') {
    // console.log("Toast suppressed:", message);
    return;
}

window.sellAllUnused = function () {
    const equippedIds = Object.values(gameState.equipment).filter(Boolean).map(item => item.id);
    const unequippedItems = gameState.inventory.filter(item => !equippedIds.includes(item.id));

    if (unequippedItems.length === 0) {
        showToast("⚠️ لا توجد عناصر غير مجهزة لبيعها.", 'warning');
        return;
    }

    let totalValue = unequippedItems.reduce((sum, item) => sum + (item.sellValue || 0), 0);

    // Updated Confirm Message
    if (confirm(`هل أنت متأكد من بيع ${unequippedItems.length} عنصر مقابل ${formatNumber(totalValue)} ذهب؟`)) {
        gameState.inventory = gameState.inventory.filter(item => equippedIds.includes(item.id));
        gameState.gold += totalValue;
        gameState.stats.totalGold += totalValue;

        showToast(`💰 تم بيع ${unequippedItems.length} عنصر بنجاح!`, 'success');
        updateInventoryUI();
        updateUI();
        saveGame(true);
    }
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
    const sharpenerBonus = 1 + (getSharpenerBonusPercent() / 100);

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
    saveGame(true); // Force cloud save on luck craft
}

function determineRarity(isLuckCraft = false) {
    const table = isLuckCraft ? LUCK_RARITY : RARITY;
    const furnaceBonus = isLuckCraft ? 0 : getFurnaceBonusPercent();
    let roll = Math.random() * 100;

    // Furnace bonus should increase chances for higher rarity
    let pityBonus = 0;
    if (!isLuckCraft) {
        const pityCount = gameState.pityCounter || 0;
        pityBonus = Math.min(30, pityCount * 2);
    }
    roll = Math.min(99.99, roll + furnaceBonus + pityBonus);

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
    let droppedMat = null;

    // Miner Character Buff: Mining power multiplier
    if (gameState.activeCharacter === 'miner') {
        miningPower *= getCharacterBuff('miner');
    }

    const spiritBonus = 1 + gameState.swordSpirit;
    const pointsGained = Math.floor(miningPower * 1.2 * spiritBonus);

    gameState.smithingPoints += pointsGained;

    // Updated Mining logic: Chance for all materials with rarity
    const dropChance = Math.min(0.45, 0.12 + (miningPower * 0.008));
    if (Math.random() < dropChance) {
        const roll = Math.random() * 100;
        let type = 'iron';

        // Rarity chances based on pickaxe level
        const bonus = miningPower * 0.6;
        if (roll < 2 + bonus * 0.1) type = 'starMetal';
        else if (roll < 10 + bonus * 0.3) type = 'dragonBone';
        else if (roll < 30 + bonus * 0.5) type = 'obsidian';
        else if (roll < 60 + bonus * 0.8) type = 'steel';
        else type = 'iron';

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

function showNewItemModal(item) {
    const rarityConfig = RARITY[item.rarity];
    const categoryNames = { weapon: 'سلاح', body: 'درع', head: 'خوذة' };

    const categoryTitles = { weapon: 'سيف جديد!', body: 'درع جديد!', head: 'خوذة جديدة!' };

    DOM.newSword.className = 'new-sword ' + rarityConfig.nameEn;
    DOM.modalRarity.textContent = rarityConfig.name + ' (' + categoryNames[item.category] + ')';
    DOM.modalSwordName.textContent = item.name;

    if (DOM.modalTitle) DOM.modalTitle.textContent = categoryTitles[item.category] || 'عنصر جديد!';
    if (DOM.modalIcon) DOM.modalIcon.textContent = getItemIcon(item);

    // Switch between damage/speed and HP/Def
    if (item.category === 'weapon') {
        document.getElementById('modal-damage-row').style.display = 'flex';
        document.getElementById('modal-speed-row').style.display = 'flex';
        document.getElementById('modal-crit-row').style.display = 'flex';
        document.getElementById('modal-hp-row').style.display = 'none';
        document.getElementById('modal-def-row').style.display = 'none';

        DOM.modalDamage.textContent = item.damage;
        DOM.modalSpeed.textContent = item.attackSpeed.toFixed(2);
        DOM.modalCrit.textContent = item.critChance + '%';
    } else {
        document.getElementById('modal-damage-row').style.display = 'none';
        document.getElementById('modal-speed-row').style.display = 'none';
        document.getElementById('modal-crit-row').style.display = 'none';
        document.getElementById('modal-hp-row').style.display = 'flex';
        document.getElementById('modal-def-row').style.display = 'flex';

        document.getElementById('modal-hp').textContent = item.hp;
        document.getElementById('modal-def').textContent = item.defense;
    }

    // Store item reference
    gameState._tempSword = item; // Keep name for compatibility with listeners
    DOM.craftModal.classList.remove('hidden');
}

function equipItem(item) {
    const activeChar = Characters[gameState.activeCharacter];

    // Class compatibility check
    if (!activeChar.allowedTypes.includes(item.subType)) {
        alert(`⚠️ هذه الشخصية لا تجيد استخدام ${item.name}!`);
        return;
    }

    gameState.equipment[item.category] = item;
    recalculatePlayerStats();
    updateEquippedUI();
    saveGame(true); // Force cloud save on equip
}

function addToInventory(item) {
    if (gameState.settings && gameState.settings.autoSellCommon && item.rarity === 'common') {
        const equippedIds = Object.values(gameState.equipment).filter(i => i).map(i => i.id);
        if (!equippedIds.includes(item.id)) {
            const sellVal = item.sellValue || 0;
            gameState.gold += sellVal;
            gameState.stats.totalGold += sellVal;
            updateUI();
            return;
        }
    }
    if (gameState.inventory.length >= 30) {
        alert("⚠️ الحقيبة ممتلئة!");
        return;
    }
    gameState.inventory.push(item);
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
    const isBoss = gameState.wave % 10 === 0;
    const enemyIndex = Math.min(Math.floor(gameState.wave / 10), ENEMIES.length - 1);
    const baseEnemy = ENEMIES[enemyIndex];

    // Adjusted Scaling for smoother progression
    const waveMultiplier = Math.pow(1.08, gameState.wave) * (isBoss ? 3.0 : 1); // Reduced from 1.1 and boss bonus from 4
    const hp = Math.floor(baseEnemy.baseHp * waveMultiplier);

    // Enemy Damage Scaling - Slightly reduced for balance
    const baseDmg = 5;
    const damageMultiplier = Math.pow(1.1, gameState.wave) * (isBoss ? 1.2 : 1); // Reduced from 1.12 and boss bonus from 2
    const damage = Math.floor(baseDmg * damageMultiplier);

    gameState.currentEnemy = {
        name: baseEnemy.name,
        sprite: baseEnemy.sprite,
        hp: hp,
        maxHp: hp,
        damage: damage
    };

    updateEnemyUI();
}

function attackEnemy() {
    if (!gameState.currentEnemy) return;

    // Default stats if no weapon is equipped
    let damage = 1;
    let critChance = 5;
    let isCrit = false;

    const weapon = gameState.equipment.weapon;
    if (weapon) {
        damage = weapon.damage;
        critChance = weapon.critChance;
    }

    // Sharpener Buff: Global sword damage multiplier
    if (weapon) {
        damage = Math.floor(damage * (1 + getSharpenerBonusPercent() / 100));
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

function enemyAttackPlayer() {
    if (!gameState.currentEnemy || gameState.currentEnemy.hp <= 0) return;

    // Calculate Damage
    let enemyDmg = gameState.currentEnemy.damage || 10;

    // Calculate player's total HP and defense
    let maxHp = 100; // Base
    let defense = 0;

    const slots = ['head', 'body'];
    slots.forEach(slot => {
        const item = gameState.equipment[slot];
        if (item) {
            if (item.hp) maxHp += item.hp;
            if (item.defense) defense += item.defense;
        }
    });

    // Update global maxHp if changed by equipment
    gameState.maxHp = maxHp;

    // Mitigate with defense (Simple mitigation: Damage - Defense)
    const mitigation = defense;
    let actualDmg = Math.max(Math.ceil(enemyDmg * 0.05), enemyDmg - mitigation);

    // Apply damage
    gameState.hp = Math.max(0, gameState.hp - actualDmg);

    // Show damage on player
    showDamageEffect(actualDmg, true); // true = player takes damage

    // Check for death
    if (gameState.hp <= 0) {
        handlePlayerDeath();
    }

    // Update UI
    updatePlayerHpUI();
    saveGame();
}

function handlePlayerDeath() {
    gameState.hp = 0;
    gameState.currentEnemy = null; // Remove enemy

    // Calculate fallback level (nearest 10)
    let newWave = Math.floor(gameState.wave / 10) * 10;
    if (newWave < 1) newWave = 1;

    const lostWave = gameState.wave;
    gameState.wave = newWave;

    // Restore HP to full based on equipment
    let totalHp = 100;
    const slots = ['head', 'body'];
    slots.forEach(slot => {
        const item = gameState.equipment[slot];
        if (item && item.hp) totalHp += item.hp;
    });
    gameState.hp = totalHp;
    gameState.maxHp = totalHp;

    // Notifications
    if (window.AdminSystem && typeof AdminSystem.sendNotification === 'function') {
        AdminSystem.sendNotification(`💀 لقد قتلك الوحش! تراجعت من الموجة ${lostWave} إلى ${newWave}`, 'error');
    }

    // Reset combat
    spawnEnemy();
    updateUI();
    saveGame();
}

function showDamageEffect(damage, isPlayer = false) {
    const target = isPlayer ? DOM.warrior : DOM.enemy;
    if (!target) return;

    // Create damage number
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-number' + (isPlayer ? ' player-damage' : '');
    damageEl.textContent = `-${damage}`;
    damageEl.style.cssText = `
        position: absolute;
        color: ${isPlayer ? '#e74c3c' : '#f39c12'};
        font-weight: bold;
        font-size: 1.5rem;
        animation: floatUp 1s ease-out;
        pointer-events: none;
        z-index: 1000;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;

    target.appendChild(damageEl);

    // Flash effect
    target.style.filter = 'brightness(1.5)';
    setTimeout(() => {
        target.style.filter = '';
    }, 200);

    // Remove damage number after animation
    setTimeout(() => {
        damageEl.remove();
    }, 1000);
}

function updatePlayerHpUI() {
    const hpFill = document.getElementById('player-hp-fill');
    const hpCur = document.getElementById('player-hp');
    const hpMax = document.getElementById('player-max-hp');

    // Recalculate maxHp just in case
    let totalHp = 100;
    const slots = ['head', 'body'];
    slots.forEach(slot => {
        const item = gameState.equipment[slot];
        if (item && item.hp) totalHp += item.hp;
    });
    gameState.maxHp = totalHp;

    // Smooth the hp bar
    if (hpFill) {
        const percent = Math.max(0, Math.min(100, (gameState.hp / gameState.maxHp) * 100));
        hpFill.style.width = percent + '%';
        // Dynamic color change based on health percentage
        if (percent < 25) {
            hpFill.style.background = 'linear-gradient(90deg, #ff4d4d, #b30000)';
        } else if (percent < 50) {
            hpFill.style.background = 'linear-gradient(90deg, #ffa500, #ff8c00)';
        } else {
            hpFill.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
        }
    }

    if (hpCur) hpCur.textContent = formatNumber(Math.max(0, Math.floor(gameState.hp)));
    if (hpMax) hpMax.textContent = formatNumber(Math.floor(gameState.maxHp));
}

// Start enemy attack timer
let enemyAttackInterval = null;
function startBattleSystem() {
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    enemyAttackInterval = setInterval(() => {
        enemyAttackPlayer();
    }, 3000);
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
            showToast("+1 💎 حجر أسطوري!", 'gem');
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

    // Heal player on wave completion
    gameState.hp = gameState.maxHp;
    updatePlayerHpUI();

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
    // Check max level for sharpener and furnace
    if ((type === 'sharpener' || type === 'furnace') && gameState.upgrades[type] >= 10) {
        showToast("⚠️ وصل هذا التطوير إلى أقصى مستوى", "warning");
        return;
    }

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

    // Reset progress
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
    gameState.equipment = { head: null, body: null, weapon: null };
    gameState.wave = 1;
    gameState.currentEnemy = null;
    gameState.pityCounter = 0;

    // Respawn enemy
    spawnEnemy();

    updateUI();
    saveGame(true);

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
    const smithingArea = document.querySelector('.smithing-area');
    const battleArea = document.querySelector('.battle-area');
    const tabPanelsContainer = document.querySelector('.tab-panels');

    DOM.menuTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Handle the smithing area and tab panels container visibility
    if (tabName === 'smithing') {
        smithingArea.style.display = 'flex';
        if (DOM.tabPanelsContainer) DOM.tabPanelsContainer.style.display = 'none';
        // Hide individual tab panels
        DOM.tabPanels.forEach(panel => panel.classList.remove('active'));
    } else {
        // Hide smithing area
        smithingArea.style.display = 'none';
        if (DOM.tabPanelsContainer) DOM.tabPanelsContainer.style.display = 'block';

        let targetPanelId = tabName + '-panel';

        // Special handling for 'upgrades' tab which maps to 'shop-panel'
        if (tabName === 'upgrades') {
            targetPanelId = 'shop-panel';
        }

        DOM.tabPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === targetPanelId);
        });
    }

    // Battle area should generally stay visible unless we are in a full-screen mode like Arena
    // For now, we keep it visible as requested
    battleArea.style.display = 'flex';

    // Specific UI updates for certain tabs
    if (tabName === 'characters') {
        updateCharactersUI();
    } else if (tabName === 'inventory') {
        updateInventoryUI();
    } else if (tabName === 'missions') {
        if (window.Missions) Missions.render();
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
    // Update notifications toggle
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
        if (gameState.settings) {
            notificationsToggle.checked = gameState.settings.notificationsEnabled;
        } else {
            // Default to false if settings object doesn't exist
            notificationsToggle.checked = false;
        }
    }
    const autoSellToggle = document.getElementById('auto-sell-common-toggle');
    if (autoSellToggle) {
        if (gameState.settings) {
            autoSellToggle.checked = !!gameState.settings.autoSellCommon;
        } else {
            autoSellToggle.checked = false;
        }
    }

    // Header
    DOM.goldDisplay.textContent = formatNumber(gameState.gold);
    if (DOM.gemDisplay) DOM.gemDisplay.textContent = formatNumber(gameState.gems);
    DOM.spiritDisplay.textContent = formatNumber(gameState.swordSpirit);
    if (DOM.arenaCoinDisplay) DOM.arenaCoinDisplay.textContent = formatNumber(gameState.arenaCoins);

    // Arena/Alliance UI
    if (window.ArenaSystem) {
        const rankEl = document.getElementById('arena-rank-display');
        const streakEl = document.getElementById('arena-streak-display');
        const winsEl = document.getElementById('arena-wins-display');
        const powerEl = document.getElementById('arena-power-display');

        if (rankEl) rankEl.textContent = gameState.arenaRankPoints || 0;
        if (streakEl && gameState.arenaStats) streakEl.textContent = gameState.arenaStats.winStreak || 0;
        if (winsEl && gameState.arenaStats) winsEl.textContent = gameState.arenaStats.totalWins || 0;
        if (powerEl) powerEl.textContent = ArenaSystem.calculatePowerScore(gameState.equipment);

        ArenaSystem.updateAllianceUI();
    }

    // Smithing
    DOM.smithingPoints.textContent = formatNumber(gameState.smithingPoints);
    DOM.clickPower.textContent = formatNumber(gameState.clickPower);

    // Progress bar
    const progress = Math.min(gameState.smithingPoints / getCraftCost(selectedCraftTier) * 100, 100);
    DOM.progressFill.style.width = progress + '%';
    DOM.progressPercent.textContent = Math.floor(progress) + '%';

    // Craft button
    DOM.craftBtn.disabled = !canCraft();

    // Equipment
    updateEquippedUI();
    updateInventoryUI();

    // Wave
    if (!DOM.waveNumber) DOM.waveNumber = document.getElementById('current-wave');
    if (DOM.waveNumber) DOM.waveNumber.textContent = gameState.wave;

    // Materials
    DOM.ironCount.textContent = formatNumber(gameState.materials.iron);
    DOM.steelCount.textContent = formatNumber(gameState.materials.steel);
    DOM.obsidianCount.textContent = formatNumber(gameState.materials.obsidian);
    DOM.dragonboneCount.textContent = formatNumber(gameState.materials.dragonBone);
    DOM.starmetalCount.textContent = formatNumber(gameState.materials.starMetal);

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

    // Player HP
    updatePlayerHpUI();
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

    const sharpenerDesc = document.querySelector('#sharpener-upgrade .upgrade-desc');
    if (sharpenerDesc) {
        sharpenerDesc.textContent = `+${getSharpenerBonusPercent()}% ضرر السيوف`;
    }
    const furnaceDesc = document.querySelector('#furnace-upgrade .upgrade-desc');
    if (furnaceDesc) {
        furnaceDesc.textContent = `+${getFurnaceBonusPercent()}% فرصة عنصر نادر`;
    }

    // Pickaxe upgrade special case as it's added later
    if (DOM.pickaxeBtn) {
        const cost = getUpgradeCost('pickaxe');
        DOM.pickaxeLevel.textContent = gameState.upgrades.pickaxe;
        DOM.pickaxeCost.textContent = formatNumber(cost);
        DOM.pickaxeBtn.disabled = gameState.gold < cost;
    }
}

function updateEquippedUI() {
    const slots = ['head', 'weapon', 'body'];

    slots.forEach(slot => {
        const item = gameState.equipment[slot];
        const slotEl = document.getElementById(`equip-${slot}`);
        if (!slotEl) return;

        const nameEl = slotEl.querySelector('.slot-name');
        const iconEl = slotEl.querySelector('.slot-icon');

        if (item) {
            const rarityConfig = RARITY[item.rarity];
            nameEl.textContent = item.name;
            nameEl.style.color = rarityConfig.color;
            iconEl.textContent = item.icon || (slot === 'weapon' ? '⚔️' : slot === 'head' ? '🪖' : '🛡️');
        } else {
            nameEl.textContent = 'فارغ';
            nameEl.style.color = '#aaa';
            iconEl.textContent = (slot === 'weapon' ? '⚔️' : slot === 'head' ? '🪖' : '🛡️');
        }
    });

    // Update global damage/hp/def in future if needed
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





let currentInventoryFilter = 'all';

function updateInventoryUI() {
    const filteredInventory = currentInventoryFilter === 'all'
        ? gameState.inventory
        : gameState.inventory.filter(item => item.category === currentInventoryFilter);

    // Check if item is equipped in any slot
    const equippedIds = Object.values(gameState.equipment).filter(i => i).map(i => i.id);

    // Sort items: Equipped first, then by power (Damage/Defense) descending
    filteredInventory.sort((a, b) => {
        const isEquippedA = equippedIds.includes(a.id);
        const isEquippedB = equippedIds.includes(b.id);
        if (isEquippedA && !isEquippedB) return -1;
        if (!isEquippedA && isEquippedB) return 1;

        // Calculate power score for sorting
        const getPower = (item) => {
            if (item.category === 'weapon') return item.damage || 0;
            return (item.defense || 0) + (item.hp || 0); // For armor
        };

        return getPower(b) - getPower(a);
    });

    if (filteredInventory.length === 0) {
        let emptyMsg = "الحقيبة فارغة";
        if (currentInventoryFilter !== 'all') {
            const names = { weapon: 'سيوف', body: 'دروع', head: 'خوذ' };
            emptyMsg = `لا توجد ${names[currentInventoryFilter]} في حقيبتك`;
        }

        // We still want to show controls even if empty, so user can switch filter
        // But the original code replaced specific content. 
        // Let's rebuild the grid with controls + empty message
        DOM.inventoryGrid.innerHTML = '';

        // Add Controls
        const controls = createInventoryControls();
        controls.style.gridColumn = "1 / -1";
        controls.style.width = "100%";
        DOM.inventoryGrid.appendChild(controls);

        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-inventory';
        emptyDiv.style.gridColumn = "1 / -1";
        emptyDiv.style.textAlign = "center";
        emptyDiv.style.padding = "60px 20px";
        emptyDiv.style.background = "linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,215,0,0.15))";
        emptyDiv.style.border = "2px dashed rgba(255,215,0,0.3)";
        emptyDiv.style.borderRadius = "15px";
        emptyDiv.style.color = "#ffd700";

        emptyDiv.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 15px;">📦</div>
            <div style="font-weight: bold; margin-bottom: 8px;">${emptyMsg}</div>
            <div style="font-size: 0.9rem; color: #aaa;">اصنع معداتك الأولى لتبدأ مغامرتك!</div>
        `;
        DOM.inventoryGrid.appendChild(emptyDiv);
        return;
    }

    DOM.inventoryGrid.innerHTML = '';

    // Add Controls
    const controls = createInventoryControls();
    controls.style.gridColumn = "1 / -1";
    controls.style.width = "100%";
    DOM.inventoryGrid.appendChild(controls);

    filteredInventory.forEach(item => {
        const isEquipped = equippedIds.includes(item.id);
        const rarityConfig = RARITY[item.rarity];

        const card = document.createElement('div');
        card.className = `inventory-card ${item.rarity}`;

        // Beautiful gradient background based on rarity
        const gradients = {
            common: 'linear-gradient(135deg, rgba(156,163,175,0.1), rgba(156,163,175,0.2))',
            rare: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.25))',
            epic: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.25))',
            legendary: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.25))',
            mythic: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.25))'
        };

        card.style.cssText = `
            background: ${gradients[item.rarity] || gradients.common};
            border: 2px solid ${rarityConfig.color};
            border-radius: 12px;
            padding: 15px;
            position: relative;
            transition: all 0.3s ease;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        // Hover effect
        card.onmouseenter = () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
            card.style.boxShadow = `0 8px 25px ${rarityConfig.color}40`;
        };
        card.onmouseleave = () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        };

        const categoryNames = { weapon: 'سلاح', body: 'درع', head: 'خوذة' };
        const tierNames = { basic: 'أساسي', iron: 'حديدي', steel: 'فولاذي', obsidian: 'سبجي', dragon: 'تنيني', star: 'نجمي' };

        let statsHtml = '';
        if (item.category === 'weapon') {
            statsHtml = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 5px 0;">
                    <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 6px; text-align: center;">
                        <span style="font-size: 0.8rem; color: #e74c3c;">⚔️ ${formatNumber(item.damage)}</span>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 6px; text-align: center;">
                        <span style="font-size: 0.8rem; color: #3b82f6;">⚡ ${item.attackSpeed}</span>
                    </div>
                </div>`;
        } else {
            statsHtml = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 5px 0;">
                    <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 6px; text-align: center;">
                        <span style="font-size: 0.8rem; color: #e74c3c;">❤️ ${formatNumber(item.hp)}</span>
                    </div>
                    <div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 6px; text-align: center;">
                        <span style="font-size: 0.8rem; color: #3b82f6;">🛡️ ${item.defense}</span>
                    </div>
                </div>`;
        }

        // Action Buttons Setup
        let actionButtons = '';
        if (isEquipped) {
            actionButtons = `
                <div style="
                    background: linear-gradient(135deg, #2ecc71, #27ae60);
                    color: white;
                    padding: 8px;
                    border-radius: 8px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 0.9rem;
                    box-shadow: 0 3px 10px rgba(46,204,113,0.3);
                ">✓ مجهز</div>`;
        } else {
            actionButtons = `
                <div style="display: flex; gap: 8px; margin-top: auto;">
                    <button onclick='toggleEquip(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="
                        flex: 1;
                        background: linear-gradient(135deg, #2ecc71, #27ae60);
                        border: none;
                        color: white;
                        padding: 8px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                    ">تجهيز</button>
                    <button onclick='sellItem(${item.id})' style="
                        flex: 1;
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        border: none;
                        color: white;
                        padding: 8px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                    ">💰 ${formatNumber(item.sellValue)}</button>
                </div>`;
        }

        card.innerHTML = `
            <div style="text-align: center; margin-bottom: 5px;">
                <div style="font-size: 3rem; margin-bottom: 5px; filter: drop-shadow(0 0 10px ${rarityConfig.color});">
                    ${getItemIcon(item)}
                </div>
                <div style="font-size: 0.7rem; color: ${rarityConfig.color}; font-weight: bold; text-transform: uppercase;">
                    ${rarityConfig.name} • ${categoryNames[item.category] || 'معدات'}
                </div>
                <div style="font-size: 1rem; font-weight: bold; color: #fff; margin: 5px 0;">
                    ${item.name}
                </div>
                <span style="font-size: 0.7rem; background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 10px; color: #aaa;">
                    ${tierNames[item.tier] || 'عادي'}
                </span>
            </div>

            ${statsHtml}
            ${actionButtons}
        `;

        DOM.inventoryGrid.appendChild(card);
    });
}

function createInventoryControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'inventory-controls';
    controlsContainer.style.cssText = `
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 15px;
        flex-wrap: wrap; 
        gap: 10px;
    `;

    // Filter Group
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    ['all', 'weapon', 'body', 'head'].forEach(type => {
        const btn = document.createElement('button');
        const labels = { all: 'الكل', weapon: '⚔️', body: '🛡️', head: '🪖' };
        btn.textContent = labels[type];
        btn.className = `filter-btn ${currentInventoryFilter === type ? 'active' : ''}`;
        btn.onclick = () => {
            currentInventoryFilter = type;
            updateInventoryUI();
        };
        filterGroup.appendChild(btn);
    });
    controlsContainer.appendChild(filterGroup);

    // Sell Button
    const sellBtn = document.createElement('button');
    sellBtn.textContent = '💰 بيع غير المجهز';
    sellBtn.className = 'sell-all-btn';
    sellBtn.onclick = () => window.sellAllUnused();
    controlsContainer.appendChild(sellBtn);

    return controlsContainer;
}
// Get category display name
// =====================================================
// INVENTORY HELPERS
// =====================================================

window.equipItemById = function (id) {
    const item = gameState.inventory.find(i => i.id === id);
    if (item) equipItem(item);
};

// Support for the UI call which might pass the object directly
window.toggleEquip = function (item) {
    if (typeof item === 'object') {
        equipItem(item);
    } else {
        equipItemById(item);
    }
}

window.sellItem = function (id) {
    // Check if equipped
    const equippedIds = Object.values(gameState.equipment).filter(i => i).map(i => i.id);
    if (equippedIds.includes(id)) {
        showToast("⚠️ لا يمكنك بيع معدات مجهزة!", 'warning');
        return;
    }

    const index = gameState.inventory.findIndex(i => i.id === id);
    if (index === -1) return;

    const item = gameState.inventory[index];
    const sellVal = item.sellValue || 0;

    gameState.gold += sellVal;
    gameState.stats.totalGold += sellVal;

    gameState.inventory.splice(index, 1);

    showToast(`💰 تم بيع ${item.name} مقابل ${formatNumber(sellVal)} ذهب`, 'success');
    updateInventoryUI();
    updateUI();
    saveGame(true);
};

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
const CLOUD_SAVE_INTERVAL = 30000; // 30 seconds
let lastCloudSaveTime = 0;

function saveGame(forceCloud = false) {
    const saveData = {
        ...gameState,
        _tempSword: undefined // Don't save temp data
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));

    // Cloud save if authenticated
    if (window.AuthService && typeof firebase !== 'undefined') {
        const user = firebase.auth().currentUser;
        if (user) {
            const now = Date.now();
            if (forceCloud || now - lastCloudSaveTime > CLOUD_SAVE_INTERVAL) {
                // Include player name, equipment, and character in cloud data
                const cloudData = {
                    ...gameState,
                    playerName: playerName,
                    equipment: gameState.equipment,
                    activeCharacter: gameState.activeCharacter
                };
                AuthService.saveCloudData(user.uid, cloudData);
                lastCloudSaveTime = now;
            }
        }
    }
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

        // Ensure HP exists
        if (gameState.hp === undefined) gameState.hp = 100;
        if (gameState.maxHp === undefined) gameState.maxHp = 100;
        if (gameState.pityCounter === undefined) gameState.pityCounter = 0;
        if (!gameState.settings) gameState.settings = { notificationsEnabled: false, autoSellCommon: false };
        gameState.settings.notificationsEnabled = false;
        if (gameState.settings.autoSellCommon === undefined) gameState.settings.autoSellCommon = false;

        recalculatePlayerStats();
    } else {
        recalculatePlayerStats();
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
            // Player attacks enemy
            attackEnemy();

            // Enemy attacks player (if still alive)
            if (gameState.currentEnemy && gameState.currentEnemy.hp > 0) {
                enemyAttackPlayer();
            }
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
    const addSafeListener = (el, event, callback) => {
        if (el) {
            el.addEventListener(event, callback);
        }
    };

    // Anvil click
    addSafeListener(DOM.anvil, 'click', handleAnvilClick);

    // Modal buttons
    addSafeListener(DOM.equipNewBtn, 'click', () => {
        if (gameState._tempSword) {
            equipItem(gameState._tempSword);
            addToInventory(gameState._tempSword);
        }
        closeModal();
    });

    addSafeListener(DOM.keepBtn, 'click', () => {
        if (gameState._tempSword) {
            addToInventory(gameState._tempSword);
        }
        closeModal();
    });

    // Close modal on background click
    addSafeListener(DOM.craftModal, 'click', (e) => {
        if (e.target === DOM.craftModal) {
            if (gameState._tempSword) {
                addToInventory(gameState._tempSword);
            }
            closeModal();
        }
    });

    // Tab switching
    if (DOM.menuTabs) {
        DOM.menuTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
    }

    // New Listeners
    const refineBtn = document.getElementById('refine-materials-btn');
    if (refineBtn) refineBtn.onclick = () => window.refineMaterials();

    const instaShareBtn = document.getElementById('insta-share-btn');
    if (instaShareBtn) instaShareBtn.onclick = () => ReferralSystem.claimInstagramReward();

    const startLinkBtn = document.getElementById('start-link-btn');
    if (startLinkBtn) startLinkBtn.onclick = () => AuthService.loginWithGoogle();

    // Equipment Slots listeners (to show bag)
    ['head', 'weapon', 'body'].forEach(slot => {
        const el = document.getElementById(`equip-${slot}`);
        if (el) el.onclick = () => switchTab('inventory');
    });

    // Craft button
    if (DOM.craftBtn) DOM.craftBtn.onclick = craftItem;

    // Upgrade buttons
    addSafeListener(DOM.hammerBtn, 'click', () => buyUpgrade('hammer'));
    addSafeListener(DOM.bellowsBtn, 'click', () => buyUpgrade('bellows'));
    addSafeListener(DOM.sharpenerBtn, 'click', () => buyUpgrade('sharpener'));
    addSafeListener(DOM.furnaceBtn, 'click', () => buyUpgrade('furnace'));
    addSafeListener(DOM.pickaxeBtn, 'click', () => buyUpgrade('pickaxe'));

    // Mining Rock
    addSafeListener(DOM.miningRock, 'click', handleRockClick);

    // Luck Craft
    addSafeListener(DOM.luckCraftBtn, 'click', craftLuckSword);

    // Prestige button
    addSafeListener(DOM.prestigeBtn, 'click', doPrestige);

    // Sell all unused button
    const sellAllBtn = document.getElementById('sell-all-unused-btn');
    addSafeListener(sellAllBtn, 'click', sellAllUnused);

    // Keyboard shortcut for clicking
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && DOM.craftModal && !DOM.craftModal.classList.contains('hidden')) {
            // Space pressed while modal open? maybe ignore or just handle
        } else if (e.code === 'Space') {
            handleAnvilClick();
        }
    });

    // Inventory Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.style.border = '1px solid #555';
                b.style.background = 'rgba(255,255,255,0.05)';
                b.style.color = '#ccc';
            });
            btn.classList.add('active');
            btn.style.border = '1px solid #ffd700';
            btn.style.background = 'rgba(255,215,0,0.1)';
            btn.style.color = '#ffd700';
            currentInventoryFilter = btn.dataset.filter;
            updateInventoryUI();
        });
    });
}

// =====================================================
// GAME RESET
// =====================================================
function resetGame() {
    console.log("Resetting game state...");
    // Clear the local save
    localStorage.removeItem(SAVE_KEY);
    // Reload the page to start fresh
    window.location.reload();
}

// =====================================================
// INITIALIZATION
// =====================================================

let playerName = null;

// Helper to set player name from external scripts (like auth.js)
window.setLocalPlayerName = function (name) {
    playerName = name;
};

// Craft category selection - will be initialized in DOMContentLoaded
let selectedCategory = 'weapon';

function showNameModal() {
    console.log('showNameModal called');
    // Use the new NameModalSystem
    if (window.NameModalSystem) {
        NameModalSystem.show();
    } else {
        console.error('NameModalSystem not loaded!');
        // Fallback: try again after a short delay
        setTimeout(() => {
            if (window.NameModalSystem) {
                NameModalSystem.show();
            } else {
                alert('⚠️ خطأ في تحميل النظام. يرجى تحديث الصفحة.');
            }
        }, 500);
    }
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

    // Check for admin rewards
    AdminRewardSystem.checkRewards();

    // Initialize Ad system
    if (typeof AdSystem !== 'undefined') {
        AdSystem.init();
    }

    // Initialize missions
    updateMissionsUI();

    // Initialize leaderboard
    updateLeaderboardUI();
    checkWeeklyResetAndRewards();

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

function createSeasonRewardWeapon(rank, seasonKey) {
    const activeChar = Characters[gameState.activeCharacter] || Characters.default;
    const typeInfo = ITEM_TYPES.weapon[activeChar.class] || ITEM_TYPES.weapon.warrior;
    const isTop3 = rank <= 3;
    const rarity = isTop3 ? 'legendary' : 'epic';
    const baseDamage = isTop3 ? random(110, 150) : random(70, 95);
    const baseCrit = isTop3 ? 20 : 12;
    const baseSpeed = isTop3 ? 1.25 : 1.1;

    return {
        id: Date.now() + rank,
        name: isTop3 ? `سلاح أسطوري موسم ${seasonKey}` : `سلاح بطولة موسم ${seasonKey}`,
        rarity: rarity,
        tier: 'star',
        category: 'weapon',
        subType: typeInfo.type,
        class: activeChar.class,
        icon: '🏆',
        damage: Math.floor(baseDamage),
        attackSpeed: parseFloat(baseSpeed.toFixed(2)),
        critChance: baseCrit,
        sellValue: Math.floor(baseDamage * (isTop3 ? 6 : 3)),
        isSeasonReward: true,
        seasonKey: seasonKey
    };
}

async function checkWeeklyResetAndRewards() {
    if (!window.LeaderboardSystem || !playerName) return;

    const currentSeason = LeaderboardSystem.getCurrentSeasonKey();
    const storedSeason = localStorage.getItem('bladeWeaver_season');

    if (!storedSeason) {
        localStorage.setItem('bladeWeaver_season', currentSeason);
        return;
    }

    if (storedSeason === currentSeason) return;

    const rewardKey = `bladeWeaver_rewards_${storedSeason}`;
    if (localStorage.getItem(rewardKey)) {
        localStorage.setItem('bladeWeaver_season', currentSeason);
        return;
    }

    const topPlayers = await LeaderboardSystem.getTopPlayersBySeason(storedSeason, 10);
    const rank = LeaderboardSystem.getPlayerRankTop10(playerName, topPlayers);

    if (rank) {
        const reward = createSeasonRewardWeapon(rank, storedSeason);
        addToInventory(reward);
        saveGame(true);
        alert(`🏆 تهانينا! حصلت على مكافأة نهاية الأسبوع للرتبة ${rank}.`);
    }

    localStorage.setItem(rewardKey, 'claimed');
    localStorage.setItem('bladeWeaver_season', currentSeason);
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
        gameState.stats.totalSwords,
        gameState.equipment,
        gameState.activeCharacter,
        gameState.inventory
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
        if (playerName) {
            playerRankEl.textContent = 'خارج التوب 10';
        }
        return;
    }

    if (playerName) {
        const rank = LeaderboardSystem.getPlayerRankTop10(playerName, topPlayers);
        playerRankEl.textContent = rank ? rank : 'خارج التوب 10';
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
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <span class="entry-rank ${rankClass}">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}</span>
            <span class="entry-name">${entry.name}</span>
            <span class="entry-score">${formatNumber(entry.score)}</span>
            <span class="entry-wave">🌊 ${entry.wave}</span>
        `;

        // Add click handler to show player profile
        div.addEventListener('click', () => showPlayerProfile(entry));

        leaderboardList.appendChild(div);
    });
}

// Show player profile modal
function showPlayerProfile(playerData) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('player-profile-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'player-profile-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const equipment = playerData.equipment || { head: null, body: null, weapon: null };
    const character = Characters[playerData.activeCharacter] || Characters.default;
    const inventory = playerData.inventory || [];

    // Sort inventory by rarity and damage/hp
    const sortedInventory = [...inventory].sort((a, b) => {
        const rarityOrder = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };
        const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        if (rarityDiff !== 0) return rarityDiff;
        return (b.damage || b.hp || 0) - (a.damage || a.hp || 0);
    });

    // Get top 5 items
    const topItems = sortedInventory.slice(0, 5);

    let equipmentHTML = '';
    ['head', 'weapon', 'body'].forEach(slot => {
        const item = equipment[slot];
        const slotNames = { head: 'الرأس', weapon: 'السلاح', body: 'الجسم' };
        if (item) {
            const rarityConfig = RARITY[item.rarity];
            const statsHTML = item.category === 'weapon'
                ? `⚔️ ${item.damage} | ⚡ ${item.attackSpeed} | 💥 ${item.critChance}%`
                : `❤️ ${item.hp} | 🛡️ ${item.defense}`;

            equipmentHTML += `
                <div class="profile-item" style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid ${rarityConfig.color};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.7rem; color: #aaa;">${slotNames[slot]}</div>
                            <div style="color: ${rarityConfig.color}; font-weight: bold;">${item.icon || '⚔️'} ${item.name}</div>
                            <div style="font-size: 0.8rem; color: #ccc;">${statsHTML}</div>
                        </div>
                        <div style="font-size: 0.7rem; color: ${rarityConfig.color};">${rarityConfig.name}</div>
                    </div>
                </div>
            `;
        } else {
            equipmentHTML += `
                <div class="profile-item" style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 0.7rem; color: #666;">${slotNames[slot]}: فارغ</div>
                </div>
            `;
        }
    });

    let inventoryHTML = '';
    if (topItems.length > 0) {
        topItems.forEach(item => {
            const rarityConfig = RARITY[item.rarity];
            const statsHTML = item.category === 'weapon'
                ? `⚔️ ${item.damage}`
                : `❤️ ${item.hp}`;

            inventoryHTML += `
                <div style="display: inline-block; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; margin: 4px; border: 1px solid ${rarityConfig.color};">
                    <div style="font-size: 0.7rem; color: ${rarityConfig.color};">${item.icon || '⚔️'}</div>
                    <div style="font-size: 0.65rem; color: #ccc;">${statsHTML}</div>
                </div>
            `;
        });
    } else {
        inventoryHTML = '<div style="color: #666; font-size: 0.8rem;">لا توجد معدات</div>';
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>👤 ${playerData.name}</h3>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <!-- Character Info -->
                <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #ffd700;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="font-size: 3rem;">${character.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-size: 1.1rem; font-weight: bold; color: #ffd700;">${character.nameAr}</div>
                            <div style="font-size: 0.8rem; color: #ccc; margin-top: 5px;">${character.desc}</div>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #aaa;">النقاط</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #ffd700;">${formatNumber(playerData.score)}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.7rem; color: #aaa;">الموجة</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #2ecc71;">🌊 ${playerData.wave}</div>
                    </div>
                </div>

                <!-- Equipment -->
                <div style="margin-bottom: 15px;">
                    <h4 style="color: #ffd700; margin-bottom: 10px;">⚔️ المعدات المجهزة</h4>
                    ${equipmentHTML}
                </div>

                <!-- Top Inventory Items -->
                <div>
                    <h4 style="color: #ffd700; margin-bottom: 10px;">🎒 أفضل المعدات (${inventory.length} قطعة)</h4>
                    <div style="text-align: center;">
                        ${inventoryHTML}
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-btn" id="close-profile-btn">إغلاق</button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');

    // Close button handler
    document.getElementById('close-profile-btn').onclick = () => {
        modal.classList.add('hidden');
    };

    // Click outside to close
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    };
}

// Track mission progress
function trackMissionProgress(type, amount = 1, absolute = false) {
    MissionsSystem.updateProgress(type, amount, absolute);
    updateMissionsUI();
}

function initGame() {
    initDOM();
    // Check for referral
    if (window.ReferralSystem) ReferralSystem.checkReferralOnLoad();
    if (window.ArenaSystem) ArenaSystem.init();
    if (window.AuthService) AuthService.init();
    if (window.AdminSystem) AdminSystem.init();
    if (window.LanguageSystem) LanguageSystem.init();

    // Load saved game
    loadGame();

    // Setup event listeners
    setupEventListeners();

    // Final UI update
    updateUI();

    // Spawn initial enemy
    if (!gameState.currentEnemy) {
        spawnEnemy();
    } else {
        updateEnemyUI();
    }

    // Update UI
    updateUI();
    updateEquippedUI();
    updateInventoryUI();
    updateCraftingUI();

    // Show name modal or start game
    showNameModal();

    // Check for starter pack (New Player)
    if (gameState.wave === 1 && gameState.inventory.length === 0 && !gameState.equipment.weapon) {
        giveStarterPack();
    }
}

function giveStarterPack() {
    console.log("Creating Starter Pack for new player...");

    // 1. Starter Sword (Target: ~40-50 DMG)
    const starterSword = {
        id: Date.now(),
        name: "سيف البداية",
        category: "weapon",
        subType: "sword",
        rarity: "common",
        isStarter: true,
        damage: 45,
        attackSpeed: 1.2,
        critChance: 10,
        icon: "⚔️",
        sellValue: 0
    };

    // 2. Starter Body Armor (Target: ~200 HP, 10 DEF)
    const starterBody = {
        id: Date.now() + 1,
        name: "درع المتدرب",
        category: "body",
        subType: "heavy_plate",
        rarity: "common",
        isStarter: true,
        hp: 250,
        defense: 15,
        icon: "🛡️",
        sellValue: 0
    };

    // 3. Starter Helmet (Target: ~100 HP, 5 DEF)
    const starterHelm = {
        id: Date.now() + 2,
        name: "خوذة البداية",
        category: "head",
        subType: "helm",
        rarity: "common",
        isStarter: true,
        hp: 150,
        defense: 8,
        icon: "🪖",
        sellValue: 0
    };

    // Equip them directly
    gameState.equipment.weapon = starterSword;
    gameState.equipment.body = starterBody;
    gameState.equipment.head = starterHelm;

    // Add to inventory too (good practice for data consistency)
    gameState.inventory.push(starterSword, starterBody, starterHelm);

    // Update stats and UI
    recalculatePlayerStats();
    updateEquippedUI();
    updateInventoryUI();
    updatePlayerHpUI();
    saveGame(true);

    showToast("🎁 حصلت على حزمة البداية للمقاتل الجديد!", "success");
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

// Track items crafted
const originalCraftItem = craftItem;
craftItem = function () {
    const beforeCount = gameState.stats.totalSwords;
    originalCraftItem();
    if (gameState.stats.totalSwords > beforeCount) {
        trackMissionProgress('swords', 1);
        // Check for rare item
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

    const instaBtn = document.getElementById('share-insta');
    if (instaBtn) {
        instaBtn.addEventListener('click', () => {
            ReferralSystem.claimInstagramReward();
        });
    }
}

// Global refining function
window.refineMaterials = function () {
    const totalMats = Object.values(gameState.materials).reduce((a, b) => a + b, 0);
    if (totalMats < 100) {
        alert("⚠️ تحتاج إلى 100 قطعة من المواد على الأقل للتكرير!");
        return;
    }

    if (confirm(`هل تريد تكرير 100 قطعة من المواد عشوائياً مقابل 1 حجر أسطوري 💎؟`)) {
        let count = 0;
        const types = Object.keys(gameState.materials);
        while (count < 100) {
            const type = types[Math.floor(Math.random() * types.length)];
            if (gameState.materials[type] > 0) {
                gameState.materials[type]--;
                count++;
            }
        }
        gameState.gems += 1;
        updateUI();
        saveGame();
        alert("💎 تم التكرير بنجاح! حصلت على 1 حجر أسطوري.");
    }
};

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', (e) => {
            if (!gameState.settings) {
                gameState.settings = { notificationsEnabled: false, autoSellCommon: false };
            }
            gameState.settings.notificationsEnabled = e.target.checked;
            saveGame();
        });
    }
    const autoSellToggle = document.getElementById('auto-sell-common-toggle');
    if (autoSellToggle) {
        autoSellToggle.addEventListener('change', (e) => {
            if (!gameState.settings) {
                gameState.settings = { notificationsEnabled: false, autoSellCommon: false };
            }
            gameState.settings.autoSellCommon = e.target.checked;
            saveGame();
        });
    }

    // Initialize category selection buttons
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => {
                b.classList.remove('active');
                b.style.border = '1px solid rgba(255,255,255,0.2)';
                b.style.background = 'rgba(255,255,255,0.05)';
            });
            btn.classList.add('active');
            btn.style.border = '1px solid #ffd700';
            btn.style.background = 'rgba(255,215,0,0.1)';
            selectedCategory = btn.dataset.category;
            console.log('Selected category:', selectedCategory); // Debug log
        });
    });

    initDOM();
    initGame();

    // Start battle system - enemy attacks player automatically
    startBattleSystem();
});
