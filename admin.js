/**
 * BLADE WEAVER: Admin System
 * Features: Notifications, Item Gifting, Player Management, Tournaments
 */

const AdminSystem = {
    // Admin Configuration
    ALLOWED_ADMIN_EMAIL: 'memedkervanji@gmail.com',
    isAuthenticated: false,

    // Tournament state
    activeTournament: null,
    tournamentTimer: null,
    reminderTimer: null,

    init: function () {
        console.log('AdminSystem: Initializing...');

        // Listen for Auth changes
        if (typeof firebase !== 'undefined' && firebase.auth()) {
            firebase.auth().onAuthStateChanged((user) => {
                this.checkAdminPrivileges(user);
            });
        }
    },

    checkAdminPrivileges: function (user) {
        if (user && user.email === this.ALLOWED_ADMIN_EMAIL) {
            console.log("AdminSystem: Welcome, Admin [" + user.email + "]");
            this.isAuthenticated = true;
            this.showAdminButton();
            // Initialize listeners only if admin
            this.initEventListeners();
            this.checkScheduledTournaments();
        } else {
            this.isAuthenticated = false;
            this.hideAdminButton();
            this.closePanel();
        }
    },

    // Legacy login (Removed)
    login: function () {
        alert("⚠️ تم تعطيل الدخول بكلمة المرور. يجب تسجيل الدخول بحساب الجيميل الخاص بالأدمن.");
    },

    initEventListeners: function () {
        // Admin button click
        document.getElementById('admin-btn')?.addEventListener('click', () => this.openPanel());

        // Close admin panel
        document.getElementById('close-admin-panel')?.addEventListener('click', () => this.closePanel());

        // Admin login
        document.getElementById('admin-login-btn')?.addEventListener('click', () => this.login());

        // Send notification
        document.getElementById('send-notification-btn')?.addEventListener('click', () => this.sendNotificationFromPanel());

        // Gift items
        document.getElementById('gift-gold-btn')?.addEventListener('click', () => this.giftGoldFromPanel());
        document.getElementById('gift-gems-btn')?.addEventListener('click', () => this.giftGemsFromPanel());
        document.getElementById('gift-arena-btn')?.addEventListener('click', () => this.giftArenaCoinsFromPanel());
        document.getElementById('gift-weapon-btn')?.addEventListener('click', () => this.giftRandomWeapon());
        document.getElementById('gift-armor-btn')?.addEventListener('click', () => this.giftRandomArmor());

        // Player management
        document.getElementById('change-name-btn')?.addEventListener('click', () => this.changePlayerNameFromPanel());

        // Tournament
        document.getElementById('create-tournament-btn')?.addEventListener('click', () => this.createTournamentFromPanel());
        document.getElementById('cancel-tournament-btn')?.addEventListener('click', () => this.cancelTournament());
    },

    logout: function () {
        // Just hide the panel, actual logout happens in AuthService
        this.closePanel();
    },

    showAdminButton: function () {
        const btn = document.getElementById('admin-btn');
        if (btn) btn.classList.remove('hidden');
    },

    hideAdminButton: function () {
        const btn = document.getElementById('admin-btn');
        if (btn) btn.classList.add('hidden');
    },

    // =====================================================
    // PANEL UI
    // =====================================================
    openPanel: function () {
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.classList.remove('hidden');
            this.updatePanelUI();
        }
    },

    closePanel: function () {
        const panel = document.getElementById('admin-panel');
        if (panel) panel.classList.add('hidden');
    },

    updatePanelUI: function () {
        const authSection = document.getElementById('admin-auth-section');
        const controlSection = document.getElementById('admin-control-section');

        if (this.isAuthenticated) {
            authSection?.classList.add('hidden');
            controlSection?.classList.remove('hidden');
            this.updateTournamentUI();
        } else {
            authSection?.classList.remove('hidden');
            controlSection?.classList.add('hidden');
        }
    },

    // =====================================================
    // NOTIFICATION SYSTEM
    // =====================================================
    sendNotification: function (message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Add to notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto remove after 8 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 8000);

        // Play sound
        this.playNotificationSound(type);
    },

    getNotificationIcon: function (type) {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'tournament': return '🏆';
            case 'gift': return '🎁';
            case 'reminder': return '🔔';
            default: return '📢';
        }
    },

    playNotificationSound: function (type) {
        // Optional: Add sound effects
        // const audio = new Audio('notification.mp3');
        // audio.play();
    },

    sendNotificationFromPanel: function () {
        const messageInput = document.getElementById('notification-message');
        const typeSelect = document.getElementById('notification-type');
        const message = messageInput?.value;
        const type = typeSelect?.value || 'info';

        if (!message) {
            alert('⚠️ يرجى إدخال رسالة الإشعار!');
            return;
        }

        this.sendNotification(message, type);
        messageInput.value = '';
    },

    // =====================================================
    // ITEM GIFTING SYSTEM
    // =====================================================
    giftGold: function (amount) {
        if (!gameState) return;
        gameState.gold += amount;
        gameState.stats.totalGold += amount;
        this.sendNotification(`🎁 تم إهداؤك ${amount} ذهبة من الإدارة!`, 'gift');
        updateUI();
        saveGame();
    },

    giftGems: function (amount) {
        if (!gameState) return;
        gameState.gems += amount;
        gameState.stats.totalGems += amount;
        this.sendNotification(`💎 تم إهداؤك ${amount} جوهرة من الإدارة!`, 'gift');
        updateUI();
        saveGame();
    },

    giftArenaCoins: function (amount) {
        if (!gameState) return;
        gameState.arenaCoins += amount;
        this.sendNotification(`⚔️ تم إهداؤك ${amount} عملة ساحة من الإدارة!`, 'gift');
        updateUI();
        saveGame();
    },

    giftPoints: function (amount) {
        if (!gameState) return;
        gameState.arenaRankPoints += amount;
        this.sendNotification(`🏆 تم إهداؤك ${amount} نقطة تصنيف من الإدارة!`, 'gift');
        updateUI();
        saveGame();
    },

    giftWeapon: function (weaponConfig = {}) {
        if (!gameState) return;

        const rarity = weaponConfig.rarity || 'legendary';
        const tier = weaponConfig.tier || 'dragon';
        const rarityConfig = RARITY[rarity];
        const tierConfig = MATERIAL_TIERS[tier];

        const activeChar = Characters[gameState.activeCharacter] || Characters.default;
        const typeInfo = ITEM_TYPES.weapon[activeChar.class];

        const spiritBonus = 1 + gameState.swordSpirit;
        const baseDamage = 200 * rarityConfig.multiplier * spiritBonus * tierConfig.damageBonus;
        const baseSpeed = 1.5 * tierConfig.speedBonus;
        const baseCrit = 30 + tierConfig.critBonus;

        // Get proper weapon name based on class
        const weaponNames = {
            warrior: 'سيف الإدارة',
            mage: 'عصا الإدارة',
            archer: 'قوس الإدارة'
        };
        const weaponName = weaponNames[activeChar.class] || 'سلاح الإدارة';

        const weapon = {
            id: Date.now(),
            name: `${weaponName} (هدية خاصة)`,
            rarity: rarity,
            tier: tier,
            category: 'weapon',
            subType: typeInfo.type,
            class: activeChar.class,
            icon: typeInfo.icon,
            damage: Math.floor(baseDamage),
            attackSpeed: parseFloat(baseSpeed.toFixed(2)),
            critChance: Math.min(baseCrit, 80),
            sellValue: Math.floor(baseDamage * 10)
        };

        gameState.inventory.push(weapon);
        this.sendNotification(`${typeInfo.icon} تم إهداؤك ${typeInfo.name} أسطوري من الإدارة!`, 'gift');
        updateUI();
        updateInventoryUI();
        saveGame();
    },

    giftArmor: function (category = 'body', armorConfig = {}) {
        if (!gameState) return;

        const rarity = armorConfig.rarity || 'legendary';
        const tier = armorConfig.tier || 'dragon';
        const rarityConfig = RARITY[rarity];
        const tierConfig = MATERIAL_TIERS[tier];

        const activeChar = Characters[gameState.activeCharacter] || Characters.default;
        const typeInfo = ITEM_TYPES[category][activeChar.class];

        const baseHp = 500 * rarityConfig.multiplier * tierConfig.damageBonus;
        const baseDef = 50 * rarityConfig.multiplier;

        // Get proper armor name based on category and class
        const armorNames = {
            body: {
                warrior: 'درع الإدارة',
                mage: 'رداء الإدارة',
                archer: 'عباءة الإدارة'
            },
            head: {
                warrior: 'خوذة الإدارة',
                mage: 'تاج الإدارة',
                archer: 'قلنسوة الإدارة'
            }
        };
        const armorName = armorNames[category]?.[activeChar.class] || 'درع الإدارة';

        const armor = {
            id: Date.now(),
            name: `${armorName} (هدية خاصة)`,
            rarity: rarity,
            tier: tier,
            category: category,
            subType: typeInfo.type,
            class: activeChar.class,
            icon: typeInfo.icon,
            hp: Math.floor(baseHp),
            defense: Math.floor(baseDef),
            sellValue: Math.floor(baseHp * 2)
        };

        gameState.inventory.push(armor);

        const categoryName = category === 'head' ? 'خوذة' : 'درع';
        this.sendNotification(`${typeInfo.icon} تم إهداؤك ${categoryName} أسطوري من الإدارة!`, 'gift');
        updateUI();
        updateInventoryUI();
        saveGame();
    },

    giftGoldFromPanel: function () {
        const amountInput = document.getElementById('gift-gold-amount');
        const amount = parseInt(amountInput?.value) || 10000;
        this.giftGold(amount);
    },

    giftGemsFromPanel: function () {
        const amountInput = document.getElementById('gift-gems-amount');
        const amount = parseInt(amountInput?.value) || 50;
        this.giftGems(amount);
    },

    giftArenaCoinsFromPanel: function () {
        const amountInput = document.getElementById('gift-arena-amount');
        const amount = parseInt(amountInput?.value) || 500;
        this.giftArenaCoins(amount);
    },

    giftRandomWeapon: function () {
        const rarities = ['rare', 'epic', 'legendary', 'mythic'];
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        this.giftWeapon({ rarity });
    },

    giftRandomArmor: function () {
        const rarities = ['rare', 'epic', 'legendary', 'mythic'];
        const categories = ['body', 'head'];
        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        this.giftArmor(category, { rarity });
    },

    // =====================================================
    // PLAYER MANAGEMENT
    // =====================================================
    changePlayerName: function (newName) {
        if (!newName || newName.length < 2) {
            alert('⚠️ الاسم يجب أن يكون حرفين على الأقل!');
            return false;
        }

        if (newName.length > 15) {
            alert('⚠️ الاسم يجب أن لا يتجاوز 15 حرف!');
            return false;
        }

        // Update local player name
        if (window.LeaderboardSystem) {
            window.LeaderboardSystem.initPlayer(newName);
        }
        if (window.setLocalPlayerName) {
            window.setLocalPlayerName(newName);
        }

        // Save to gameState
        gameState.playerName = newName;
        saveGame();

        this.sendNotification(`✏️ تم تغيير اسمك إلى: ${newName}`, 'success');
        return true;
    },

    changePlayerNameFromPanel: function () {
        const nameInput = document.getElementById('player-new-name');
        const newName = nameInput?.value.trim();

        if (this.changePlayerName(newName)) {
            nameInput.value = '';
        }
    },

    // =====================================================
    // TOURNAMENT SYSTEM
    // =====================================================
    TOURNAMENT_DURATION: 20 * 60 * 1000, // 20 minutes in milliseconds
    REMINDER_BEFORE: 60 * 60 * 1000, // 1 hour before in milliseconds

    createTournament: function (scheduledTime = null) {
        if (this.activeTournament) {
            alert('⚠️ يوجد بطولة نشطة بالفعل!');
            return;
        }

        const now = Date.now();
        let startTime = scheduledTime || now;

        // If scheduled for the future, set reminder
        if (startTime > now) {
            const timeUntilStart = startTime - now;

            // Set reminder 1 hour before
            if (timeUntilStart > this.REMINDER_BEFORE) {
                this.reminderTimer = setTimeout(() => {
                    this.sendNotification('🔔 تذكير: بطولة الساحة تبدأ بعد ساعة!', 'reminder');
                }, timeUntilStart - this.REMINDER_BEFORE);
            }

            // Schedule tournament start
            setTimeout(() => this.startTournament(), timeUntilStart);

            this.activeTournament = {
                status: 'scheduled',
                startTime: startTime,
                endTime: startTime + this.TOURNAMENT_DURATION,
                participants: [],
                scores: {}
            };

            this.sendNotification(`📅 تم جدولة بطولة جديدة! تبدأ في ${new Date(startTime).toLocaleTimeString('ar')}`, 'tournament');
        } else {
            this.startTournament();
        }

        this.saveTournamentState();
        this.updateTournamentUI();
    },

    startTournament: function () {
        const now = Date.now();

        this.activeTournament = {
            status: 'active',
            startTime: now,
            endTime: now + this.TOURNAMENT_DURATION,
            participants: [],
            scores: {}
        };

        // Send notification
        this.sendNotification('🏆 بطولة الساحة بدأت الآن! لديك 20 دقيقة للمنافسة!', 'tournament');

        // Start countdown timer
        this.tournamentTimer = setInterval(() => this.updateTournamentCountdown(), 1000);

        // End tournament after duration
        setTimeout(() => this.endTournament(), this.TOURNAMENT_DURATION);

        this.saveTournamentState();
        this.updateTournamentUI();
    },

    endTournament: function () {
        if (!this.activeTournament) return;

        clearInterval(this.tournamentTimer);
        clearTimeout(this.reminderTimer);

        // Calculate winners
        const sortedParticipants = Object.entries(this.activeTournament.scores || {})
            .sort((a, b) => b[1] - a[1]);

        let resultMessage = '🏆 انتهت البطولة!\n';
        if (sortedParticipants.length > 0) {
            resultMessage += '\n🥇 المركز الأول: ' + sortedParticipants[0][0];
            if (sortedParticipants[1]) resultMessage += '\n🥈 المركز الثاني: ' + sortedParticipants[1][0];
            if (sortedParticipants[2]) resultMessage += '\n🥉 المركز الثالث: ' + sortedParticipants[2][0];
        } else {
            resultMessage += '\nلا يوجد مشاركين!';
        }

        this.sendNotification(resultMessage, 'tournament');

        this.activeTournament = null;
        this.saveTournamentState();
        this.updateTournamentUI();
    },

    cancelTournament: function () {
        if (!this.activeTournament) return;

        clearInterval(this.tournamentTimer);
        clearTimeout(this.reminderTimer);

        this.sendNotification('❌ تم إلغاء البطولة!', 'warning');

        this.activeTournament = null;
        this.saveTournamentState();
        this.updateTournamentUI();
    },

    joinTournament: function (playerName) {
        if (!this.activeTournament || this.activeTournament.status !== 'active') {
            return false;
        }

        if (!this.activeTournament.participants.includes(playerName)) {
            this.activeTournament.participants.push(playerName);
            this.activeTournament.scores[playerName] = 0;
            this.saveTournamentState();
            return true;
        }
        return false;
    },

    addTournamentScore: function (playerName, points) {
        if (!this.activeTournament || this.activeTournament.status !== 'active') {
            return;
        }

        if (!this.activeTournament.scores[playerName]) {
            this.activeTournament.scores[playerName] = 0;
        }

        this.activeTournament.scores[playerName] += points;
        this.saveTournamentState();
    },

    updateTournamentCountdown: function () {
        if (!this.activeTournament || this.activeTournament.status !== 'active') {
            return;
        }

        const now = Date.now();
        const remaining = Math.max(0, this.activeTournament.endTime - now);

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        const countdownEl = document.getElementById('tournament-countdown');
        if (countdownEl) {
            countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Update tournament banner if exists
        this.updateTournamentBanner(remaining);
    },

    updateTournamentBanner: function (remaining) {
        let banner = document.getElementById('tournament-banner');

        if (this.activeTournament && this.activeTournament.status === 'active') {
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'tournament-banner';
                banner.className = 'tournament-banner';
                document.body.insertBefore(banner, document.body.firstChild);
            }

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            banner.innerHTML = `
                🏆 بطولة الساحة نشطة! 
                <span class="countdown">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                متبقي
            `;
            banner.classList.remove('hidden');
        } else if (banner) {
            banner.classList.add('hidden');
        }
    },

    saveTournamentState: function () {
        localStorage.setItem('bladeWeaver_tournament', JSON.stringify(this.activeTournament));
    },

    checkScheduledTournaments: function () {
        const saved = localStorage.getItem('bladeWeaver_tournament');
        if (!saved) return;

        try {
            const tournament = JSON.parse(saved);
            if (!tournament) return;

            const now = Date.now();

            if (tournament.status === 'active' && tournament.endTime > now) {
                this.activeTournament = tournament;
                const remaining = tournament.endTime - now;
                this.tournamentTimer = setInterval(() => this.updateTournamentCountdown(), 1000);
                setTimeout(() => this.endTournament(), remaining);
                this.sendNotification('🏆 البطولة لا تزال نشطة!', 'tournament');
            } else if (tournament.status === 'scheduled' && tournament.startTime > now) {
                this.activeTournament = tournament;
                const timeUntilStart = tournament.startTime - now;
                if (timeUntilStart > this.REMINDER_BEFORE) {
                    this.reminderTimer = setTimeout(() => {
                        this.sendNotification('🔔 تذكير: بطولة الساحة تبدأ بعد ساعة!', 'reminder');
                    }, timeUntilStart - this.REMINDER_BEFORE);
                }
                setTimeout(() => this.startTournament(), timeUntilStart);
            } else {
                localStorage.removeItem('bladeWeaver_tournament');
            }
        } catch (e) {
            console.error('Error loading tournament state:', e);
        }

        this.updateTournamentUI();
    },

    updateTournamentUI: function () {
        const statusEl = document.getElementById('tournament-status');
        const createBtn = document.getElementById('create-tournament-btn');
        const cancelBtn = document.getElementById('cancel-tournament-btn');
        const countdownEl = document.getElementById('tournament-countdown');

        if (!statusEl) return;

        if (this.activeTournament) {
            if (this.activeTournament.status === 'active') {
                statusEl.textContent = 'نشطة الآن';
                statusEl.className = 'status active';
                createBtn?.classList.add('hidden');
                cancelBtn?.classList.remove('hidden');
            } else if (this.activeTournament.status === 'scheduled') {
                statusEl.textContent = 'مجدولة';
                statusEl.className = 'status scheduled';
                createBtn?.classList.add('hidden');
                cancelBtn?.classList.remove('hidden');
            }
        } else {
            statusEl.textContent = 'لا توجد بطولة';
            statusEl.className = 'status inactive';
            createBtn?.classList.remove('hidden');
            cancelBtn?.classList.add('hidden');
            if (countdownEl) countdownEl.textContent = '--:--';
        }
    },

    createTournamentFromPanel: function () {
        const scheduleInput = document.getElementById('tournament-schedule');
        let scheduledTime = null;

        if (scheduleInput && scheduleInput.value) {
            scheduledTime = new Date(scheduleInput.value).getTime();
            if (scheduledTime <= Date.now()) {
                alert('⚠️ يجب اختيار وقت في المستقبل!');
                return;
            }
        }

        this.createTournament(scheduledTime);
    }
};

// Make available globally
window.AdminSystem = AdminSystem;
