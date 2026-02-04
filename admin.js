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
        document.getElementById('gift-custom-item-btn')?.addEventListener('click', () => this.giftCustomItemFromPanel());

        // Player management
        document.getElementById('change-name-btn')?.addEventListener('click', () => this.changePlayerNameFromPanel());
        document.getElementById('remote-change-name-btn')?.addEventListener('click', () => this.remoteChangePlayerNameFromPanel());
        document.getElementById('send-weapon-gift-btn')?.addEventListener('click', () => this.sendWeaponGiftFromPanel());
        document.getElementById('send-custom-gift-btn')?.addEventListener('click', () => this.sendCustomGiftFromPanel());

        // NEW: Send weapon to specific player
        document.getElementById('send-weapon-to-player-btn')?.addEventListener('click', () => this.sendWeaponToPlayerFromPanel());
        document.getElementById('refresh-weapon-players-btn')?.addEventListener('click', () => this.fetchWeaponPlayerList());

        // Tournament
        document.getElementById('create-tournament-btn')?.addEventListener('click', () => this.createTournamentFromPanel());
        document.getElementById('cancel-tournament-btn')?.addEventListener('click', () => this.cancelTournament());

        // Player List Refresh
        document.getElementById('refresh-players-btn')?.addEventListener('click', () => this.fetchPlayerList());
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
            controlSection?.classList.remove('hidden');
            this.updateTournamentUI();
            // Fetch players automatically
            this.fetchPlayerList();
            this.fetchWeaponPlayerList(); // Load weapon gift player list
        } else {
            authSection?.classList.remove('hidden');
            controlSection?.classList.add('hidden');
        }
    },

    // =====================================================
    // NOTIFICATION SYSTEM
    // =====================================================
    sendNotification: function (message, type = 'info') {
        // Check if notifications are enabled in game settings
        if (window.gameState && window.gameState.settings && !window.gameState.settings.notificationsEnabled) {
            console.log(`Notification blocked by user settings: "${message}"`);
            return; // Don't show notification if disabled
        }

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

    giftCustomItemFromPanel: function () {
        const category = document.getElementById('gift-item-category')?.value;
        const tier = document.getElementById('gift-item-tier')?.value;
        const rarity = document.getElementById('gift-item-rarity')?.value;

        if (!category || !tier || !rarity) return;

        if (category === 'weapon') {
            this.giftWeapon({ rarity: rarity, tier: tier });
        } else {
            this.giftArmor(category, { rarity: rarity, tier: tier });
        }
    },

    // =====================================================
    // REMOTE GIFTING (PLAYER LIST)
    // =====================================================
    fetchPlayerList: async function () {
        if (!db) return;
        const container = document.getElementById('admin-players-list');
        if (!container) return;

        container.innerHTML = '<div style="color: #aaa; text-align: center;">جاري التحميل...</div>';

        try {
            // Get recent players from leaderboard (assuming active players are there)
            const snapshot = await db.collection('leaderboard')
                .orderBy('timestamp', 'desc')
                .limit(20)
                .get();

            const players = [];
            snapshot.forEach(doc => {
                players.push({ id: doc.id, ...doc.data() });
            });

            this.renderPlayerList(players);
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div style="color: #e74c3c; text-align: center;">فشل التحميل</div>';
        }
    },

    renderPlayerList: function (players) {
        const nameChangeSelect = document.getElementById('player-select-for-name-change');
        const weaponGiftSelect = document.getElementById('player-select-for-weapon-gift');
        const customGiftSelect = document.getElementById('player-id-for-gift');

        if (nameChangeSelect) nameChangeSelect.innerHTML = '';
        if (weaponGiftSelect) weaponGiftSelect.innerHTML = '';
        if (customGiftSelect) customGiftSelect.innerHTML = '';
        const container = document.getElementById('admin-players-list');
        if (!container) return;

        container.innerHTML = '';

        if (players.length === 0) {
            container.innerHTML = '<div style="color: #aaa; text-align: center;">لا يوجد لاعبين</div>';
            if (nameChangeSelect) nameChangeSelect.innerHTML = '<option>لا يوجد لاعبين</option>';
            if (weaponGiftSelect) weaponGiftSelect.innerHTML = '<option>لا يوجد لاعبين</option>';
            if (customGiftSelect) customGiftSelect.innerHTML = '<option>لا يوجد لاعبين</option>';
            return;
        }

        // إزالة اللاعبين المكررين - الاحتفاظ بأحدث سجل لكل اسم
        const uniquePlayers = {};
        players.forEach(player => {
            if (!player.name) return; // تجاهل اللاعبين بدون اسم

            // إذا كان اللاعب موجود بالفعل، نقارن الموجة أو التاريخ
            if (!uniquePlayers[player.name] ||
                (player.wave || 0) > (uniquePlayers[player.name].wave || 0)) {
                uniquePlayers[player.name] = player;
            }
        });

        // تحويل إلى مصفوفة وترتيب حسب الموجة
        const sortedPlayers = Object.values(uniquePlayers)
            .sort((a, b) => (b.wave || 0) - (a.wave || 0));

        sortedPlayers.forEach(player => {
            const div = document.createElement('div');
            div.style.cssText = 'background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.1);';

            const nameDiv = document.createElement('div');
            nameDiv.innerHTML = `<strong style="color: #3498db;">${player.name}</strong> <small style="color: #aaa;">(Lvl ${player.wave || 1})</small>`;

            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '5px';

            // Gold Button
            const goldBtn = document.createElement('button');
            goldBtn.textContent = '💰10k';
            goldBtn.title = 'إهداء 10,000 ذهب';
            goldBtn.style.cssText = 'background: #f1c40f; border: none; border-radius: 3px; cursor: pointer; font-size: 0.7rem; padding: 2px 5px; color: black; font-weight: bold;';
            goldBtn.onclick = () => this.sendRemoteGift(player.id, player.name, 'gold', 10000);

            // Gems Button
            const gemsBtn = document.createElement('button');
            gemsBtn.textContent = '💎100';
            gemsBtn.title = 'إهداء 100 جوهرة';
            gemsBtn.style.cssText = 'background: #9b59b6; border: none; border-radius: 3px; cursor: pointer; font-size: 0.7rem; padding: 2px 5px; color: white;';
            gemsBtn.onclick = () => this.sendRemoteGift(player.id, player.name, 'gems', 100);

            // Arena Button
            const arenaBtn = document.createElement('button');
            arenaBtn.textContent = '⚔️500';
            arenaBtn.title = 'إهداء 500 عملة ساحة';
            arenaBtn.style.cssText = 'background: #e74c3c; border: none; border-radius: 3px; cursor: pointer; font-size: 0.7rem; padding: 2px 5px; color: white;';
            arenaBtn.onclick = () => this.sendRemoteGift(player.id, player.name, 'arenaCoins', 500);

            actionsDiv.appendChild(goldBtn);
            actionsDiv.appendChild(gemsBtn);
            actionsDiv.appendChild(arenaBtn);

            div.appendChild(nameDiv);
            div.appendChild(actionsDiv);
            container.appendChild(div);

            // Populate select dropdowns
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            if (nameChangeSelect) nameChangeSelect.appendChild(option.cloneNode(true));
            if (weaponGiftSelect) weaponGiftSelect.appendChild(option.cloneNode(true));
            if (customGiftSelect) customGiftSelect.appendChild(option.cloneNode(true));
        });
    },

    sendRemoteGift: async function (targetId, targetName, type, amount) {
        if (!targetId) {
            alert('Please provide a player ID.');
            return;
        }
        if (!confirm(`Are you sure you want to gift ${targetName || targetId} ${amount} ${type}?`)) return;
        if (!confirm(`هل أنت متأكد من إهداء ${targetName} (${amount} ${type})؟`)) return;

        try {
            const userRef = db.collection('users').doc(targetId);

            // Map type to gameData field
            // 'gold' -> 'gameData.gold'
            // 'gems' -> 'gameData.gems'
            // 'arenaCoins' -> 'gameData.arenaCoins'

            const updateField = `gameData.${type}`;
            const updateData = {};
            updateData[updateField] = firebase.firestore.FieldValue.increment(amount);

            // Also notify? (Optional, requires notification system per user)

            await userRef.update(updateData);

            this.sendNotification(`✅ تم إرسال الهدية بنجاح إلى ${targetName}`, 'success');
        } catch (e) {
            console.error(e);
            alert('❌ فشل الإرسال (ربما لم يربط حسابه بعد)');
        }
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

    remoteChangePlayerName: async function (playerId, newName) {
        if (!playerId || !newName) {
            alert('Please provide both a player ID and a new name.');
            return;
        }

        if (newName.length < 2 || newName.length > 15) {
            alert('Name must be between 2 and 15 characters.');
            return;
        }

        try {
            const userRef = db.collection('users').doc(playerId);
            await userRef.update({
                'gameData.playerName': newName
            });

            // Also update the leaderboard entry if it exists
            const leaderboardRef = db.collection('leaderboard').doc(playerId);
            await leaderboardRef.update({
                name: newName
            });

            this.sendNotification(`✅ Player ${playerId}'s name has been changed to ${newName}.`, 'success');
        } catch (e) {
            console.error(e);
            alert('❌ Failed to change player name. The player may not have a linked account.');
        }
    },

    remoteChangePlayerNameFromPanel: function () {
        const playerId = document.getElementById('player-select-for-name-change')?.value;
        const newName = document.getElementById('new-player-name')?.value.trim();
        this.remoteChangePlayerName(playerId, newName);
    },

    sendWeaponGiftFromPanel: function () {
        const playerId = document.getElementById('player-select-for-weapon-gift')?.value;
        const playerName = document.querySelector('#player-select-for-weapon-gift option:checked')?.textContent;
        if (!playerId) {
            alert('Please select a player.');
            return;
        }
        if (!confirm(`Are you sure you want to gift a weapon to ${playerName}?`)) return;

        this.sendRemoteWeapon(playerId, playerName);
    },

    sendRemoteWeapon: async function (targetId, targetName) {
        try {
            const userRef = db.collection('users').doc(targetId);

            // Create a powerful admin weapon
            const weapon = {
                id: Date.now(),
                name: 'سيف الإدارة (هدية)',
                rarity: 'legendary',
                tier: 'star',
                category: 'weapon',
                subType: 'sword', // Assuming warrior class for now, this could be improved
                class: 'warrior',
                icon: '⚔️',
                damage: 5000,
                attackSpeed: 1.2,
                critChance: 50,
                sellValue: 100000
            };

            await userRef.update({
                'gameData.inventory': firebase.firestore.FieldValue.arrayUnion(weapon)
            });

            this.sendNotification(`✅ تم إرسال سلاح هدية إلى ${targetName}`, 'success');
        } catch (e) {
            console.error(e);
            alert('❌ فشل إرسال السلاح.');
        }
    },

    sendCustomGiftFromPanel: function () {
        const playerId = document.getElementById('player-id-for-gift')?.value.trim();
        const type = document.getElementById('gift-type')?.value;
        const amount = parseInt(document.getElementById('gift-amount')?.value);

        if (!playerId || !type || isNaN(amount) || amount <= 0) {
            alert('Please fill out all fields for the custom gift.');
            return;
        }

        this.sendRemoteGift(playerId, null, type, amount);
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
    },

    // =====================================================
    // WEAPON GIFTING TO SPECIFIC PLAYERS
    // =====================================================
    fetchWeaponPlayerList: async function () {
        if (!db) return;
        const selectElement = document.getElementById('weapon-gift-player-select');
        const listContainer = document.getElementById('weapon-admin-players-list');

        if (!selectElement) return;

        selectElement.innerHTML = '<option value="">جاري التحميل...</option>';
        if (listContainer) listContainer.innerHTML = '<div style="color: #aaa; text-align: center;">جاري التحميل...</div>';

        try {
            // Get recent players from leaderboard
            const snapshot = await db.collection('leaderboard')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const players = [];
            snapshot.forEach(doc => {
                players.push({ id: doc.id, ...doc.data() });
            });

            // Remove duplicates - keep latest record for each name
            const uniquePlayers = {};
            players.forEach(player => {
                if (!player.name) return;
                if (!uniquePlayers[player.name] ||
                    (player.wave || 0) > (uniquePlayers[player.name].wave || 0)) {
                    uniquePlayers[player.name] = player;
                }
            });

            // Convert to array and sort by wave
            const sortedPlayers = Object.values(uniquePlayers)
                .sort((a, b) => (b.wave || 0) - (a.wave || 0));

            // Populate dropdown
            selectElement.innerHTML = '<option value="">-- اختر لاعب --</option>';
            sortedPlayers.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = `${player.name} (المستوى ${player.wave || 1})`;
                selectElement.appendChild(option);
            });

            // Populate list display
            if (listContainer) {
                listContainer.innerHTML = '';
                if (sortedPlayers.length === 0) {
                    listContainer.innerHTML = '<div style="color: #aaa; text-align: center;">لا يوجد لاعبين</div>';
                } else {
                    sortedPlayers.slice(0, 10).forEach(player => {
                        const div = document.createElement('div');
                        div.style.cssText = 'background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;';
                        div.innerHTML = `
                            <span style="color: #2ecc71; font-weight: bold;">${player.name}</span>
                            <span style="color: #aaa; font-size: 0.85rem;">المستوى ${player.wave || 1}</span>
                        `;
                        listContainer.appendChild(div);
                    });
                }
            }

            this.sendNotification('✅ تم تحديث قائمة اللاعبين', 'success');
        } catch (e) {
            console.error(e);
            selectElement.innerHTML = '<option value="">فشل التحميل</option>';
            if (listContainer) listContainer.innerHTML = '<div style="color: #e74c3c; text-align: center;">فشل التحميل</div>';
        }
    },

    sendWeaponToPlayerFromPanel: function () {
        const playerId = document.getElementById('weapon-gift-player-select')?.value;
        const playerName = document.querySelector('#weapon-gift-player-select option:checked')?.textContent;
        const category = document.getElementById('weapon-gift-category')?.value || 'weapon';
        const rarity = document.getElementById('weapon-gift-rarity')?.value || 'legendary';
        const tier = document.getElementById('weapon-gift-tier')?.value || 'dragon';

        if (!playerId) {
            alert('⚠️ يرجى اختيار لاعب من القائمة!');
            return;
        }

        if (!confirm(`هل أنت متأكد من إرسال ${category === 'weapon' ? 'سلاح' : category === 'body' ? 'درع' : 'خوذة'} (${rarity}) إلى ${playerName}؟`)) {
            return;
        }

        this.sendCustomWeaponToPlayer(playerId, playerName, category, rarity, tier);
    },

    sendCustomWeaponToPlayer: async function (targetId, targetName, category, rarity, tier) {
        try {
            const userRef = db.collection('users').doc(targetId);

            // Get rarity and tier configs
            const rarityConfig = RARITY[rarity] || RARITY.legendary;
            const tierConfig = MATERIAL_TIERS[tier] || MATERIAL_TIERS.dragon;

            // Create the item based on category
            let item;

            if (category === 'weapon') {
                item = {
                    id: Date.now(),
                    name: `سلاح الإدارة (هدية ${rarity})`,
                    rarity: rarity,
                    tier: tier,
                    category: 'weapon',
                    subType: 'sword', // Default to sword, could be improved
                    class: 'warrior',
                    icon: '⚔️',
                    damage: Math.floor(1000 * rarityConfig.multiplier * tierConfig.damageBonus),
                    attackSpeed: parseFloat((1.2 * tierConfig.speedBonus).toFixed(2)),
                    critChance: Math.min(40 + tierConfig.critBonus, 80),
                    sellValue: Math.floor(10000 * rarityConfig.multiplier)
                };
            } else {
                // Armor (body or head)
                const armorNames = {
                    body: 'درع الإدارة',
                    head: 'خوذة الإدارة'
                };

                item = {
                    id: Date.now(),
                    name: `${armorNames[category]} (هدية ${rarity})`,
                    rarity: rarity,
                    tier: tier,
                    category: category,
                    subType: category === 'body' ? 'heavy_plate' : 'helm',
                    class: 'warrior',
                    icon: category === 'body' ? '🛡️' : '🪖',
                    hp: Math.floor(500 * rarityConfig.multiplier * tierConfig.damageBonus),
                    defense: Math.floor(50 * rarityConfig.multiplier),
                    sellValue: Math.floor(5000 * rarityConfig.multiplier)
                };
            }

            // Send to player's inventory
            await userRef.update({
                'gameData.inventory': firebase.firestore.FieldValue.arrayUnion(item)
            });

            const itemTypeName = category === 'weapon' ? 'سلاح' : category === 'body' ? 'درع' : 'خوذة';
            this.sendNotification(`✅ تم إرسال ${itemTypeName} (${rarity}) بنجاح إلى ${targetName}`, 'success');

        } catch (e) {
            console.error(e);
            alert('❌ فشل إرسال الهدية. تأكد من أن اللاعب قد ربط حسابه.');
        }
    }
};

// Make available globally
window.AdminSystem = AdminSystem;
