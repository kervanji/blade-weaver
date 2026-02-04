/**
 * BLADE WEAVER: Advanced Arena & PvP System
 * Features: Equipment showcase, betting system, win streaks, and rewards
 */

const AllianceConfig = {
    UPGRADE_COST_BASE: 1000000,
    UPGRADE_COST_SCALE: 1.5, // Cost * 1.5 per level
    MAX_LEVEL: 10,
    UPGRADES: {
        gold_shrine: {
            name: "ضريح الذهب",
            desc: "يزيد الذهب من الوحوش بنسبة 100% لكل مستوى. المستوى 10 = +1000% ذهب!",
            bonusPerLevel: 1.0,
            icon: "💰"
        },
        war_temple: {
            name: "معبد الحرب",
            desc: "يزيد ضرر السلاح على الوحوش بنسبة 100% لكل مستوى. المستوى 10 = +1000% ضرر!",
            bonusPerLevel: 1.0,
            icon: "⚔️"
        },
        guardian_statue: {
            name: "تمثال الحارس",
            desc: "يقلل الضرر الذي تتلقاه من الوحوش بنسبة 12% لكل مستوى (بحد أقصى 80%).",
            bonusPerLevel: 0.12,
            icon: "🛡️"
        },
        xp_library: {
            name: "مكتبة الخبرة",
            desc: "يزيد نقاط الحدادة من النقر والتعدين بنسبة 100% لكل مستوى. المستوى 10 = +1000%!",
            bonusPerLevel: 1.0,
            icon: "📚"
        },
        crit_chance: {
            name: "طوطم الضربة الحرجة",
            desc: "يزيد فرصة الضربة الحرجة بنسبة 3% لكل مستوى (الإجمالي بحد أقصى 50%).",
            bonusPerLevel: 0.03,
            icon: "💥"
        }
    },
    GEM_UPGRADE_COST_BASE: 50,
    GEM_UPGRADE_COST_SCALE: 1.7,
    GEM_UPGRADES: {
        forge_core: {
            name: "قلب الحدادة",
            desc: "يزيد ضرر وإحصائيات العتاد المصنوع بنسبة 20% لكل مستوى. المستوى 10 = +200% قوة!",
            bonusPerLevel: 0.20,
            icon: "💎"
        },
        rare_forge: {
            name: "شرارة الندرة",
            desc: "يزيد فرصة الحصول على عتاد نادر/أسطوري بنسبة 15% لكل مستوى. المستوى 10 = +150%!",
            bonusPerLevel: 0.15,
            icon: "✨"
        },
        spirit_well: {
            name: "بئر الأرواح",
            desc: "يزيد أرواح السيف عند الصعود بنسبة 20% لكل مستوى. المستوى 10 = +200% أرواح!",
            bonusPerLevel: 0.20,
            icon: "🕯️"
        }
    }
};

const ArenaSystem = {
    HOURS: {
        arenaStart: 18, // 6 PM
        arenaEnd: 20,   // 8 PM
        warStart: 21,   // 9 PM
        warEnd: 22      // 10 PM
    },

    init: function () {
        this.updateTimers();
        setInterval(() => this.updateTimers(), 1000);

        // Arena Buttons
        document.getElementById('prepare-arena-btn')?.addEventListener('click', () => this.prepareHero());
        document.getElementById('start-challenge-btn')?.addEventListener('click', () => this.findOpponent());
        document.getElementById('watch-arena-ad-btn')?.addEventListener('click', () => AdSystem.watchAd('arena_coins'));

        // Alliance Buttons
        document.getElementById('create-alliance-btn')?.addEventListener('click', () => this.createAlliance());
        document.getElementById('leave-alliance-btn')?.addEventListener('click', () => this.leaveAlliance());

        // Initialize arena stats if not exists
        if (!gameState.arenaStats) {
            gameState.arenaStats = {
                winStreak: 0,
                totalWins: 0,
                totalLosses: 0,
                highestStreak: 0
            };
        }

        // Fetch current champion
        this.fetchChampion();
        setInterval(() => this.fetchChampion(), 60000); // Poll every minute

        // Fetch Alliance Data & Start Polling
        this.refreshAllianceData();
        setInterval(() => this.refreshAllianceData(), 30000); // Poll every 30 seconds
    },

    allianceDataCache: null,
    lastAllianceFetch: 0,

    refreshAllianceData: async function () {
        if (!gameState.allianceId || !db) return;

        try {
            const doc = await db.collection("alliances").doc(gameState.allianceId).get();
            if (doc.exists) {
                const data = doc.data();
                this.allianceDataCache = data;

                // Update GameState critical data
                gameState.allianceUpgrades = data.upgrades || {};
                gameState.allianceGemUpgrades = data.gemUpgrades || {};

                // Update UI if open
                const activeView = document.getElementById('active-alliance-view');
                if (activeView && !activeView.classList.contains('hidden')) {
                    this.updateAllianceUI();
                }
            } else {
                // Player has an ID but alliance inactive/deleted?
                // handle graceful degradation?
            }
        } catch (e) { console.error("Alliance Sync Error:", e); }
    },

    isArenaOpen: function () {
        const now = new Date();
        const hour = now.getHours();
        return hour >= this.HOURS.arenaStart && hour < this.HOURS.arenaEnd;
    },

    isWarOpen: function () {
        const now = new Date();
        const hour = now.getHours();
        return hour >= this.HOURS.warStart && hour < this.HOURS.warEnd;
    },

    updateTimers: function () {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const sec = now.getSeconds();

        // Arena Timer
        const arenaStatus = document.getElementById('arena-status');
        const arenaCountdown = document.getElementById('arena-countdown');
        const activeContent = document.getElementById('arena-active-content');
        const closedMsg = document.getElementById('arena-closed-msg');

        if (this.isArenaOpen()) {
            if (arenaStatus) {
                arenaStatus.textContent = "مفتوح الآن!";
                arenaStatus.style.color = "#2ecc71";
            }
            closedMsg?.classList.add('hidden');
            if (activeContent) {
                activeContent.style.opacity = "1";
                activeContent.style.pointerEvents = "auto";
            }

            const remaining = (this.HOURS.arenaEnd - hour - 1) * 3600 + (59 - min) * 60 + (60 - sec);
            if (arenaCountdown) arenaCountdown.textContent = this.formatDuration(remaining);
        } else {
            if (arenaStatus) {
                arenaStatus.textContent = "مغلق";
                arenaStatus.style.color = "#e74c3c";
            }
            closedMsg?.classList.remove('hidden');
            if (activeContent) activeContent.style.opacity = "0.7";

            const startBtn = document.getElementById('start-challenge-btn');
            if (startBtn) startBtn.disabled = true;

            let hoursUntil = (this.HOURS.arenaStart - hour + 24) % 24;
            if (hoursUntil === 0 && hour >= this.HOURS.arenaEnd) hoursUntil = 24 - (hour - this.HOURS.arenaStart);

            const secondsUntil = (hoursUntil - 1) * 3600 + (59 - min) * 60 + (60 - sec);
            if (arenaCountdown) arenaCountdown.textContent = this.formatDuration(secondsUntil);
        }

        // War Timer
        const warTimer = document.getElementById('war-countdown');
        const warStatus = document.getElementById('war-status');
        const warBtn = document.getElementById('join-war-btn');

        if (this.isWarOpen()) {
            if (warStatus) warStatus.textContent = "المعركة مستعرة الآن!";
            if (warBtn) warBtn.disabled = false;
            const remaining = (this.HOURS.warEnd - hour - 1) * 3600 + (59 - min) * 60 + (60 - sec);
            if (warTimer) warTimer.textContent = this.formatDuration(remaining);
        } else {
            if (warStatus) warStatus.textContent = "بانتظار ساعة الصفر...";
            if (warBtn) warBtn.disabled = true;
            let hoursUntil = (this.HOURS.warStart - hour + 24) % 24;
            const secondsUntil = (hoursUntil - 1) * 3600 + (59 - min) * 60 + (60 - sec);
            if (warTimer) warTimer.textContent = this.formatDuration(secondsUntil);
        }
    },

    formatDuration: function (seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    calculatePowerScore: function (equipment) {
        let score = 0;
        const rarityMulti = { common: 1, rare: 2.5, epic: 5, legendary: 10, mythic: 20 };

        const slots = ['head', 'body', 'weapon'];
        slots.forEach(slot => {
            const item = equipment[slot];
            if (item) {
                const rarityBonus = rarityMulti[item.rarity] || 1;
                const tierMulti = { basic: 1, iron: 1.5, steel: 2, obsidian: 3, dragon: 5, star: 8 };
                const tierBonus = tierMulti[item.tier] || 1;

                if (item.damage) {
                    score += item.damage * rarityBonus * tierBonus;
                }
                if (item.hp) {
                    score += (item.hp / 10) * rarityBonus * tierBonus;
                }
                if (item.defense) {
                    score += item.defense * 5 * rarityBonus * tierBonus;
                }
            }
        });

        return Math.floor(score);
    },

    prepareHero: function () {
        if (gameState.arenaCoins < 50) {
            alert("⚠️ لا تملك عملات ساحة كافية (تحتاج 50)");
            return;
        }

        // Check if player has at least weapon equipped
        if (!gameState.equipment.weapon) {
            alert("⚠️ يجب تجهيز سلاح على الأقل للدخول إلى الساحة!");
            return;
        }

        gameState.arenaCoins -= 50;
        gameState.arenaPrepared = true;

        const startBtn = document.getElementById('start-challenge-btn');
        const prepBtn = document.getElementById('prepare-arena-btn');

        if (startBtn) startBtn.disabled = !this.isArenaOpen();
        if (prepBtn) {
            prepBtn.disabled = true;
            prepBtn.textContent = "أنت جاهز للتحدي ✅";
        }

        updateUI();
        saveGame();

        const powerScore = this.calculatePowerScore(gameState.equipment);
        alert(`🛡️ تم تجهيز بطلك!\n💪 قوتك الحالية: ${powerScore}\n⚔️ يمكنك الآن خوض التحديات.`);
    },

    findOpponent: async function () {
        if (!gameState.arenaPrepared) {
            alert("⚠️ يجب تجهيز العدة أولاً!");
            return;
        }

        if (!this.isArenaOpen()) {
            alert("⚠️ الساحة مغلقة الآن! تفتح من 18:00 إلى 20:00");
            return;
        }

        // Try to find real opponent from leaderboard
        try {
            const opponent = await this.getRandomOpponent();
            if (opponent) {
                this.showBattleModal(opponent);
            } else {
                // Fallback to AI opponent
                this.createAIOpponent();
            }
        } catch (error) {
            console.error('Error finding opponent:', error);
            this.createAIOpponent();
        }
    },

    getRandomOpponent: async function () {
        if (!db) return null;

        try {
            const players = await db.collection('leaderboard')
                .where('score', '>', 0)
                .limit(20)
                .get();

            if (players.empty) return null;

            const candidates = [];
            players.forEach(doc => {
                const data = doc.data();
                if (data.id !== window.LeaderboardSystem.getPlayer()?.id) {
                    candidates.push({ id: doc.id, ...data });
                }
            });

            if (candidates.length === 0) return null;

            return candidates[Math.floor(Math.random() * candidates.length)];
        } catch (error) {
            console.error('Error fetching opponents:', error);
            return null;
        }
    },

    createAIOpponent: function () {
        const names = ['سيف الظلام', 'محارب النار', 'فارس البرق', 'حامي الأرواح', 'قاهر التنانين'];
        const name = names[Math.floor(Math.random() * names.length)];

        const myPower = this.calculatePowerScore(gameState.equipment);
        const opponentPower = Math.floor(myPower * (0.7 + Math.random() * 0.6));

        const opponent = {
            name: name,
            power: opponentPower,
            isAI: true
        };

        this.showBattleModal(opponent);
    },

    showBattleModal: function (opponent) {
        const myPower = this.calculatePowerScore(gameState.equipment);
        const opponentPower = opponent.power || Math.floor(myPower * (0.8 + Math.random() * 0.4));

        const winChance = this.calculateWinChance(myPower, opponentPower);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>⚔️ تحدي الساحة</h3>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; align-items: center; margin-bottom: 20px;">
                        <div style="text-align: center; padding: 15px; background: rgba(46,204,113,0.1); border: 2px solid #2ecc71; border-radius: 10px;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">🧙‍♂️</div>
                            <div style="font-weight: bold; color: #2ecc71;">${window.LeaderboardSystem.getPlayer()?.name || 'أنت'}</div>
                            <div style="font-size: 0.9rem; color: #aaa;">القوة: ${myPower}</div>
                        </div>
                        <div style="font-size: 2rem;">⚔️</div>
                        <div style="text-align: center; padding: 15px; background: rgba(231,76,60,0.1); border: 2px solid #e74c3c; border-radius: 10px;">
                            <div style="font-size: 2rem; margin-bottom: 5px;">👹</div>
                            <div style="font-weight: bold; color: #e74c3c;">${opponent.name}</div>
                            <div style="font-size: 0.9rem; color: #aaa;">القوة: ${opponentPower}</div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,215,0,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="text-align: center; margin-bottom: 10px;">
                            <strong style="color: #ffd700;">فرصة الفوز: ${Math.floor(winChance * 100)}%</strong>
                        </div>
                        <div style="font-size: 0.85rem; color: #aaa; text-align: center;">
                            السلسلة الحالية: ${gameState.arenaStats.winStreak} 🔥
                        </div>
                    </div>
                    
                    <div style="background: rgba(231,76,60,0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #e74c3c;">
                        <div style="font-weight: bold; color: #e74c3c; margin-bottom: 8px;">⚠️ المخاطر:</div>
                        <div style="font-size: 0.9rem; color: #fff;">
                            • إذا خسرت: احتمال 25% لخسارة قطعة عشوائية من عدتك<br>
                            • الخصم سيحصل على القطعة المفقودة
                        </div>
                    </div>
                    
                    <div style="background: rgba(46,204,113,0.1); padding: 15px; border-radius: 10px; border: 1px solid #2ecc71;">
                        <div style="font-weight: bold; color: #2ecc71; margin-bottom: 8px;">🎁 المكافآت:</div>
                        <div style="font-size: 0.9rem; color: #fff;">
                            • فوز عادي: +25 نقطة تصنيف<br>
                            • 10 انتصارات متتالية: سلاح نادر مميز 🗡️<br>
                            • 20 انتصار متتالي: سلاح أسطوري قوي ⚔️✨
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; border-top: 1px solid #444; padding-top: 10px;">
                        <input type="text" id="direct-challenge-id" placeholder="أدخل معرف اللاعب للتحدي المباشر" style="width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 5px;">
                        <button onclick="ArenaSystem.sendDirectChallenge()" style="width: 100%; margin-top: 5px; background: #9b59b6; color: white; padding: 8px; border-radius: 5px; border: none;">إرسال تحدي خاص 📩</button>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn" id="accept-challenge-btn" style="background: #2ecc71;">قبول التحدي ⚔️</button>
                    <button class="modal-btn" id="decline-challenge-btn" style="background: #e74c3c;">رفض</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('accept-challenge-btn').onclick = () => {
            document.body.removeChild(modal);
            this.executeBattle(opponent, myPower, opponentPower, winChance);
        };

        document.getElementById('decline-challenge-btn').onclick = () => {
            document.body.removeChild(modal);
        };
    },

    calculateWinChance: function (myPower, opponentPower) {
        const ratio = myPower / (myPower + opponentPower);
        // Add some randomness but keep it skill-based
        return Math.max(0.15, Math.min(0.85, ratio));
    },

    executeBattle: function (opponent, myPower, opponentPower, winChance) {
        const won = Math.random() < winChance;

        if (won) {
            this.handleVictory(opponent);
        } else {
            this.handleDefeat(opponent);
        }
    },

    handleVictory: function (opponent) {
        gameState.arenaStats.winStreak++;
        gameState.arenaStats.totalWins++;
        gameState.arenaRankPoints += 25;

        if (gameState.arenaStats.winStreak > gameState.arenaStats.highestStreak) {
            gameState.arenaStats.highestStreak = gameState.arenaStats.winStreak;
        }

        let bonusReward = '';

        // Check for streak rewards
        if (gameState.arenaStats.winStreak === 10) {
            const reward = this.generateStreakReward('rare');
            gameState.inventory.push(reward);
            bonusReward = `\n\n🎉 مكافأة السلسلة!\nحصلت على: ${reward.name}`;
        } else if (gameState.arenaStats.winStreak === 20) {
            const reward = this.generateStreakReward('legendary');
            gameState.inventory.push(reward);
            bonusReward = `\n\n🎊 مكافأة السلسلة الأسطورية!\nحصلت على: ${reward.name}`;
        }

        gameState.arenaPrepared = false;
        const startBtn = document.getElementById('start-challenge-btn');
        const prepBtn = document.getElementById('prepare-arena-btn');

        if (startBtn) startBtn.disabled = true;
        if (prepBtn) {
            prepBtn.disabled = false;
            prepBtn.textContent = "انضمام للتحدي (50 ⚔️)";
        }

        updateUI();
        saveGame();

        this.showResultModal('🎉 انتصار ساحق!', `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🏆</div>
                <div style="color: #2ecc71; font-weight: bold; margin-bottom: 5px;">+25 نقطة تصنيف</div>
                <div style="color: #e67e22; font-weight: bold;">السلسلة: ${gameState.arenaStats.winStreak} 🔥</div>
                ${bonusReward ? `<div style="margin-top: 10px; padding: 10px; background: rgba(255,215,0,0.1); border-radius: 5px; color: #ffd700;">${bonusReward}</div>` : ''}
            </div>
        `, true);

        // Update Champion Title
        if (db) {
            this.updateChampion(gameState.arenaStats.winStreak);
        }
    },

    handleDefeat: function (opponent) {
        gameState.arenaStats.winStreak = 0;
        gameState.arenaStats.totalLosses++;
        gameState.arenaRankPoints = Math.max(0, gameState.arenaRankPoints - 10);

        let lostItem = null;
        const loseEquipment = Math.random() < 0.25; // 25% chance

        if (loseEquipment) {
            const equippedSlots = ['head', 'body', 'weapon'].filter(slot => gameState.equipment[slot]);
            if (equippedSlots.length > 0) {
                const randomSlot = equippedSlots[Math.floor(Math.random() * equippedSlots.length)];
                lostItem = gameState.equipment[randomSlot];
                gameState.equipment[randomSlot] = null;
            }
        }

        gameState.arenaPrepared = false;
        const startBtn = document.getElementById('start-challenge-btn');
        const prepBtn = document.getElementById('prepare-arena-btn');

        if (startBtn) startBtn.disabled = true;
        if (prepBtn) {
            prepBtn.disabled = false;
            prepBtn.textContent = "انضمام للتحدي (50 ⚔️)";
        }

        updateEquippedUI();
        updateUI();
        saveGame();

        let message = `💔 هزيمة مؤلمة!\n\n-10 نقاط تصنيف\nانقطعت السلسلة`;

        if (lostItem) {
            message += `\n\n⚠️ فقدت: ${lostItem.name}\n${opponent.name} استحوذ عليه!`;
        }

        this.showResultModal('💔 هزيمة مؤلمة!', `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 10px;">☠️</div>
                <div style="color: #e74c3c; font-weight: bold; margin-bottom: 5px;">-10 نقاط تصنيف</div>
                <div style="color: #aaa;">انقطعت السلسلة</div>
                ${lostItem ? `
                    <div style="margin-top: 15px; padding: 10px; background: rgba(231,76,60,0.2); border: 1px solid #c0392b; border-radius: 5px;">
                        <div style="font-weight: bold; color: #e74c3c; margin-bottom: 5px;">⚠️ فقدت معدات!</div>
                        <div style="color: #fff;">${lostItem.name}</div>
                        <div style="font-size: 0.8rem; color: #aaa; margin-top: 5px;">${opponent.name} استحوذ عليه!</div>
                    </div>
                ` : ''}
            </div>
        `, false);
    },

    showResultModal: function (title, contentHTML, isVictory) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px; border: 2px solid ${isVictory ? '#2ecc71' : '#e74c3c'};">
                <div class="modal-header">
                    <h3 style="color: ${isVictory ? '#2ecc71' : '#e74c3c'};">${title}</h3>
                </div>
                <div class="modal-body">
                    ${contentHTML}
                </div>
                <div class="modal-actions">
                    <button class="modal-btn" onclick="this.parentElement.parentElement.parentElement.remove()" style="background: ${isVictory ? '#2ecc71' : '#e74c3c'};">
                        ${isVictory ? 'إغلاق 🎉' : 'إغلاق 😔'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    updateChampion: async function (streak) {
        if (!db) return;
        try {
            const ref = db.collection('system').doc('arena_champion');
            const doc = await ref.get();

            let shouldUpdate = false;

            if (!doc.exists) {
                shouldUpdate = true;
            } else {
                const data = doc.data();
                // Update if it's been more than 24 hours OR if it's me updating my own streak
                const now = Date.now();
                const isExpired = (now - data.timestamp) > 24 * 60 * 60 * 1000;
                const isMe = data.id === LeaderboardSystem.getPlayer().id;

                // Logic: "Winner stays for one day, if someone else wins it changes"
                // Interpretation: Any win overwrites the previous winner regardless of time? 
                // OR: Winner stays for 24 hours locked, unless someone else wins? 
                // "stays for one day and if someone else wins it changes by new name"
                // This implies a "King of the Hill" where the latest winner becomes the champion.
                // But "stays for one day" suggests an expiry.

                // Let's implement: Any win makes you champion. The "one day" is just a duration of display validity.
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                await ref.set({
                    id: LeaderboardSystem.getPlayer().id,
                    name: LeaderboardSystem.getPlayer().name,
                    streak: streak,
                    timestamp: Date.now()
                });
                this.fetchChampion(); // Refresh UI immediately
            }
        } catch (e) { console.error("Champion update failed", e); }
    },

    fetchChampion: async function () {
        if (!db) return;
        try {
            const doc = await db.collection('system').doc('arena_champion').get();
            const banner = document.getElementById('arena-champion-banner');
            const nameEl = document.getElementById('arena-champion-name');

            if (doc.exists && banner && nameEl) {
                const data = doc.data();
                const now = Date.now();
                // Check if expired (24 hours)
                if ((now - data.timestamp) < 24 * 60 * 60 * 1000) {
                    nameEl.textContent = data.name;
                    banner.style.display = 'block';
                } else {
                    banner.style.display = 'none';
                }
            } else {
                if (banner) banner.style.display = 'none';
            }
        } catch (e) { console.error("Champion fetch failed", e); }
    },

    generateStreakReward: function (minRarity) {
        const rarities = minRarity === 'legendary'
            ? ['legendary', 'mythic']
            : ['rare', 'epic', 'legendary'];

        const rarity = rarities[Math.floor(Math.random() * rarities.length)];
        const rarityConfig = RARITY[rarity];

        const tier = minRarity === 'legendary' ? 'dragon' : 'obsidian';
        const tierConfig = MATERIAL_TIERS[tier];

        const activeChar = Characters[gameState.activeCharacter] || Characters.default;
        const typeInfo = ITEM_TYPES.weapon[activeChar.class];

        const spiritBonus = 1 + gameState.swordSpirit;
        const baseDamage = (minRarity === 'legendary' ? 150 : 80) * rarityConfig.multiplier * spiritBonus * tierConfig.damageBonus;
        const baseSpeed = 1.2 * tierConfig.speedBonus;
        const baseCrit = 25 + tierConfig.critBonus;

        const prefixes = minRarity === 'legendary'
            ? ['سيف الأبدية', 'نصل القدر', 'حسام الأساطير']
            : ['سيف البطولة', 'نصل الشرف', 'حسام المجد'];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

        return {
            id: Date.now(),
            name: `${prefix} (مكافأة الساحة)`,
            rarity: rarity,
            tier: tier,
            category: 'weapon',
            subType: typeInfo.type,
            class: activeChar.class,
            icon: typeInfo.icon,
            damage: Math.floor(baseDamage),
            attackSpeed: parseFloat(baseSpeed.toFixed(2)),
            critChance: Math.min(baseCrit, 75),
            sellValue: Math.floor(baseDamage * 5)
        };
    },

    // ALLIANCE SYSTEM
    createAlliance: async function () {
        const nameInput = document.getElementById('alliance-name-input');
        const name = nameInput.value.trim();

        if (!name) {
            alert("⚠️ يرجى إدخال اسم للتحالف");
            return;
        }

        if (gameState.gold < 1000000) {
            alert("⚠️ لا تملك ذهب كافٍ (تحتاج 1,000,000)");
            return;
        }

        if (!db) {
            alert("⚠️ نظام التحالفات يتطلب اتصالاً بالإنترنت.");
            return;
        }
        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
            alert("⚠️ يجب تسجيل الدخول لإنشاء التحالف.");
            return;
        }
        const player = LeaderboardSystem.getPlayer();
        if (!player) {
            alert("⚠️ لم يتم العثور على بيانات اللاعب.");
            return;
        }

        try {
            const existing = await db.collection("alliances").where("name", "==", name).get();
            if (!existing.empty) {
                alert("⚠️ هذا الاسم مستخدم بالفعل.");
                return;
            }

            const allianceRef = await db.collection("alliances").add({
                name: name,
                leaderId: player.id,
                leaderName: player.name,
                level: 1,
                funds: 0,
                gemsFunds: 0,
                upgrades: {
                    gold_shrine: 0,
                    war_temple: 0,
                    guardian_statue: 0,
                    xp_library: 0,
                    crit_chance: 0
                },
                gemUpgrades: {
                    forge_core: 0,
                    rare_forge: 0,
                    spirit_well: 0
                },
                stash: [],
                warHistory: [],
                memberCount: 1,
                members: [player.id],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            gameState.gold -= 1000000;
            gameState.allianceId = allianceRef.id;

            saveGame();
            updateUI();
            alert(`🎊 تم إنشاء تحالف "${name}" بنجاح!`);
        } catch (e) {
            console.error(e);
            alert("⚠️ فشل في إنشاء التحالف.");
        }
    },

    leaveAlliance: async function () {
        if (!confirm("هل أنت متأكد من مغادرة التحالف؟")) return;

        gameState.allianceId = null;
        saveGame();
        updateUI();
        alert("تمت المغادرة.");
    },

    updateAllianceUI: async function () {
        const noAllianceView = document.getElementById('no-alliance-view');
        const activeAllianceView = document.getElementById('active-alliance-view');

        if (!gameState.allianceId) {
            noAllianceView?.classList.remove('hidden');
            activeAllianceView?.classList.add('hidden');
            this.searchAlliances();
        } else {
            noAllianceView?.classList.add('hidden');
            activeAllianceView?.classList.remove('hidden');

            if (db) {
                try {
                    const doc = await db.collection("alliances").doc(gameState.allianceId).get();
                    if (doc.exists) {
                        const data = doc.data();

                        // Header Info
                        document.getElementById('active-alliance-name').textContent = data.name;
                        document.getElementById('alliance-level-val').textContent = data.level;
                        document.getElementById('alliance-members-count').textContent = `${data.memberCount}/20`;
                        document.getElementById('alliance-funds-val').textContent = (data.funds || 0).toLocaleString();
                        const gemsVal = document.getElementById('alliance-gems-val');
                        if (gemsVal) gemsVal.textContent = (data.gemsFunds || 0).toLocaleString();
                        gameState.allianceUpgrades = data.upgrades || {};
                        gameState.allianceGemUpgrades = data.gemUpgrades || {};

                        // Display Leader Name
                        const leaderNameEl = document.getElementById('alliance-leader-name');
                        if (leaderNameEl) {
                            leaderNameEl.textContent = data.leaderName || 'غير معروف';
                        }

                        // War Stats
                        const wins = data.warHistory?.filter(w => w.result === 'win').length || 0;
                        const losses = data.warHistory?.filter(w => w.result === 'loss').length || 0;
                        document.getElementById('war-wins-val').textContent = wins;
                        document.getElementById('war-losses-val').textContent = losses;

                        // Pending Requests Section (Leader Only)
                        const currentPlayer = LeaderboardSystem.getPlayer();
                        const isLeader = currentPlayer && data.leaderId === currentPlayer.id;
                        const requestsContainer = document.getElementById('alliance-pending-requests');

                        if (requestsContainer) {
                            const pendingRequests = data.pendingRequests || [];

                            if (isLeader && pendingRequests.length > 0) {
                                requestsContainer.style.display = 'block';
                                requestsContainer.innerHTML = `
                                    <div style="background: rgba(255,215,0,0.1); border: 1px solid #ffd700; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                                        <h4 style="color: #ffd700; margin: 0 0 10px 0; font-size: 1rem;">📩 طلبات الانضمام (${pendingRequests.length})</h4>
                                        <div id="pending-requests-list" style="max-height: 200px; overflow-y: auto;"></div>
                                    </div>
                                `;

                                const listEl = document.getElementById('pending-requests-list');
                                pendingRequests.forEach(req => {
                                    const reqDiv = document.createElement('div');
                                    reqDiv.style = "display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 5px; margin-bottom: 5px;";
                                    reqDiv.innerHTML = `
                                        <span style="color: #fff;">👤 ${req.playerName}</span>
                                        <div>
                                            <button onclick="ArenaSystem.acceptJoinRequest('${req.playerId}', '${req.playerName}')" style="padding: 5px 10px; border: none; border-radius: 4px; background: #2ecc71; color: white; cursor: pointer; margin-left: 5px;">✅ قبول</button>
                                            <button onclick="ArenaSystem.rejectJoinRequest('${req.playerId}', '${req.playerName}')" style="padding: 5px 10px; border: none; border-radius: 4px; background: #e74c3c; color: white; cursor: pointer;">❌ رفض</button>
                                        </div>
                                    `;
                                    listEl.appendChild(reqDiv);
                                });
                            } else {
                                requestsContainer.style.display = 'none';
                                requestsContainer.innerHTML = '';
                            }
                        }

                        // Upgrades List
                        const upgradesList = document.getElementById('alliance-upgrades-list');
                        if (upgradesList) {
                            upgradesList.innerHTML = '';
                            Object.keys(AllianceConfig.UPGRADES).forEach(key => {
                                const config = AllianceConfig.UPGRADES[key];
                                const currentLevel = data.upgrades?.[key] || 0;
                                const cost = Math.floor(AllianceConfig.UPGRADE_COST_BASE * Math.pow(AllianceConfig.UPGRADE_COST_SCALE, currentLevel));
                                const isMax = currentLevel >= AllianceConfig.MAX_LEVEL;
                                const currentBonus = (currentLevel * config.bonusPerLevel * 100).toFixed(0);
                                const nextBonus = ((currentLevel + 1) * config.bonusPerLevel * 100).toFixed(0);

                                const div = document.createElement('div');
                                div.style.background = 'rgba(0,0,0,0.3)';
                                div.style.padding = '10px';
                                div.style.borderRadius = '8px';
                                div.innerHTML = `
                                    <div style="font-size: 1.5rem; margin-bottom: 5px;">${config.icon}</div>
                                    <div style="font-weight: bold; font-size: 0.9rem;">${config.name}</div>
                                    <div style="font-size: 0.7rem; color: #8ab4f8; margin-bottom: 8px; line-height: 1.3;">${config.desc}</div>
                                    <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 5px;">مستوى ${currentLevel}/${AllianceConfig.MAX_LEVEL}</div>
                                    <div style="font-size: 0.85rem; color: #ffd700; margin-bottom: 8px; font-weight: bold;">⚡ الآن: +${currentBonus}%</div>
                                    ${!isMax ? `
                                        <button onclick="ArenaSystem.buyAllianceUpgrade('${key}')" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #2980b9, #3498db); border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 0.85rem; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                                            تطوير (${cost.toLocaleString()}) 💰 → +${nextBonus}%
                                        </button>
                                    ` : `<div style="color: #2ecc71; font-size: 0.9rem; font-weight: bold;">✅ الحد الأقصى!</div>`}
                                `;
                                upgradesList.appendChild(div);
                            });
                        }

                        const gemUpgradesList = document.getElementById('alliance-gem-upgrades-list');
                        if (gemUpgradesList) {
                            gemUpgradesList.innerHTML = '';
                            Object.keys(AllianceConfig.GEM_UPGRADES).forEach(key => {
                                const config = AllianceConfig.GEM_UPGRADES[key];
                                const currentLevel = data.gemUpgrades?.[key] || 0;
                                const cost = Math.floor(AllianceConfig.GEM_UPGRADE_COST_BASE * Math.pow(AllianceConfig.GEM_UPGRADE_COST_SCALE, currentLevel));
                                const isMax = currentLevel >= AllianceConfig.MAX_LEVEL;
                                const currentBonus = (currentLevel * config.bonusPerLevel * 100).toFixed(0);
                                const nextBonus = ((currentLevel + 1) * config.bonusPerLevel * 100).toFixed(0);

                                const div = document.createElement('div');
                                div.style.background = 'rgba(0,0,0,0.3)';
                                div.style.padding = '10px';
                                div.style.borderRadius = '8px';
                                div.innerHTML = `
                                    <div style="font-size: 1.5rem; margin-bottom: 5px;">${config.icon}</div>
                                    <div style="font-weight: bold; font-size: 0.9rem;">${config.name}</div>
                                    <div style="font-size: 0.7rem; color: #d4a5ff; margin-bottom: 8px; line-height: 1.3;">${config.desc}</div>
                                    <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 5px;">مستوى ${currentLevel}/${AllianceConfig.MAX_LEVEL}</div>
                                    <div style="font-size: 0.85rem; color: #c39bd3; margin-bottom: 8px; font-weight: bold;">⚡ الآن: +${currentBonus}%</div>
                                    ${!isMax ? `
                                        <button onclick="ArenaSystem.buyAllianceGemUpgrade('${key}')" style="width: 100%; padding: 8px; background: linear-gradient(135deg, #8e44ad, #9b59b6); border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 0.85rem; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                                            تطوير (${cost.toLocaleString()} 💎) → +${nextBonus}%
                                        </button>
                                    ` : `<div style="color: #2ecc71; font-size: 0.9rem; font-weight: bold;">✅ الحد الأقصى!</div>`}
                                `;
                                gemUpgradesList.appendChild(div);
                            });
                        }

                        // Stash List
                        const stashList = document.getElementById('alliance-stash-list');
                        if (stashList) {
                            if (!data.stash || data.stash.length === 0) {
                                stashList.innerHTML = '<div style="text-align: center; width: 100%; color: #555; padding-top: 20px;">الخزانة فارغة</div>';
                            } else {
                                stashList.innerHTML = '';
                                data.stash.forEach((item, index) => {
                                    const div = document.createElement('div');
                                    div.style.minWidth = '80px';
                                    div.style.background = 'rgba(255,255,255,0.05)';
                                    div.style.padding = '5px';
                                    div.style.borderRadius = '5px';
                                    div.style.border = '1px solid #444';
                                    div.style.cursor = 'pointer';
                                    div.onclick = () => this.distributeStashItem(index);

                                    div.innerHTML = `
                                        <div style="font-size: 1.5rem; text-align: center;">${item.icon || '⚔️'}</div>
                                        <div style="font-size: 0.7rem; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70px;">${item.name}</div>
                                        <div style="font-size: 0.6rem; text-align: center; color: ${item.rarity === 'legendary' ? '#ffd700' : '#aaa'};">${item.rarity}</div>
                                    `;
                                    stashList.appendChild(div);
                                });
                            }
                        }

                        // Members List (Legacy support)
                        // In real app we might want detailed list, for now basic text list
                        const membersList = document.getElementById('alliance-members-list');
                        if (membersList) {
                            membersList.innerHTML = '';
                            // Note: currentPlayer and isLeader already defined above
                            data.members.forEach(memberId => {
                                // Ideally we fetch names. For now just ID or placeholder if we can't fetch.
                                // Or we assume leaderboard had them. 
                                // Since we don't have easy async access to names here without logic:
                                const div = document.createElement('div');
                                div.style.padding = "5px";
                                div.style.borderBottom = "1px solid #333";
                                const isMemberLeader = memberId === data.leaderId;
                                const displayName = isMemberLeader ? (data.leaderName || 'القائد') : `عضو (${memberId.substr(0, 5)}...)`;
                                div.innerHTML = `
                                    <span>${isMemberLeader ? '👑 ' : '👤 '}${displayName}</span>
                                    ${isLeader && !isMemberLeader ? `<button onclick="ArenaSystem.transferLeadership('${memberId}')" style="margin-inline-start: 8px; padding: 3px 6px; background: #f39c12; border: none; border-radius: 4px; color: #111; font-size: 0.7rem; cursor: pointer;">تحويل القيادة</button>` : ''}
                                `;
                                membersList.appendChild(div);
                            });
                        }

                    }
                } catch (e) { console.error(e); }
            }
        }
    },

    searchAlliances: async function () {
        if (!db) return;
        const list = document.getElementById('alliance-search-list');
        const searchInput = document.getElementById('alliance-search-input');
        if (!list) return;

        list.innerHTML = "جاري البحث...";
        const searchTerm = searchInput ? searchInput.value.trim() : "";

        try {
            let query = db.collection("alliances").limit(20);

            if (searchTerm) {
                // Prefix search
                query = db.collection("alliances")
                    .where('name', '>=', searchTerm)
                    .where('name', '<=', searchTerm + '\uf8ff')
                    .limit(20);
            }

            const snapshot = await query.get();
            list.innerHTML = "";

            if (snapshot.empty) {
                list.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">لا توجد تحالفات حالياً. كن أول من ينشئ تحالفاً!</div>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const isFull = data.memberCount >= 20;
                const div = document.createElement('div');
                div.className = 'alliance-card';
                div.style = "background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.1);";
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 1rem; color: #ffd700; margin-bottom: 4px;">🛡️ ${data.name}</div>
                            <div style="font-size: 0.8rem; color: #aaa;">
                                <span>⭐ المستوى: ${data.level || 1}</span> • 
                                <span>👥 ${data.memberCount}/20</span>
                            </div>
                            <div style="font-size: 0.75rem; color: #8ab4f8; margin-top: 3px;">
                                👑 القائد: ${data.leaderName || 'غير معروف'}
                            </div>
                        </div>
                        <div>
                            ${isFull ?
                        '<span style="color: #e74c3c; font-size: 0.8rem;">ممتلئ</span>' :
                        `<button onclick="ArenaSystem.requestJoinAlliance('${doc.id}')" style="padding: 8px 15px; border-radius: 5px; border: none; background: linear-gradient(135deg, #3498db, #2980b9); color: white; font-weight: bold; cursor: pointer;">📩 طلب انضمام</button>`
                    }
                        </div>
                    </div>
                `;
                list.appendChild(div);
            });
        } catch (e) {
            console.error(e);
            list.innerHTML = "فشل في تحميل التحالفات.";
        }
    },

    // Send a join request to an alliance (not instant join)
    requestJoinAlliance: async function (id) {
        if (gameState.allianceId) {
            alert("⚠️ أنت بالفعل في تحالف!");
            return;
        }
        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
            alert("⚠️ يجب تسجيل الدخول لإرسال طلب انضمام.");
            return;
        }

        const player = LeaderboardSystem.getPlayer();
        if (!player) {
            alert("⚠️ لم يتم العثور على بيانات اللاعب.");
            return;
        }

        try {
            const ref = db.collection("alliances").doc(id);
            const doc = await ref.get();
            const data = doc.data();

            if (data.memberCount >= 20) {
                alert("⚠️ التحالف ممتلئ!");
                return;
            }

            // Check if already requested
            const pendingRequests = data.pendingRequests || [];
            if (pendingRequests.some(r => r.playerId === player.id)) {
                alert("⚠️ لقد أرسلت طلب انضمام بالفعل! انتظر رد القائد.");
                return;
            }

            // Add to pending requests
            await ref.update({
                pendingRequests: firebase.firestore.FieldValue.arrayUnion({
                    playerId: player.id,
                    playerName: player.name,
                    requestedAt: Date.now()
                })
            });

            alert(`📩 تم إرسال طلب انضمام إلى "${data.name}"! انتظر موافقة القائد.`);
        } catch (e) {
            console.error(e);
            alert(`⚠️ فشل إرسال الطلب: ${e.message || e}`);
        }
    },

    // Accept a join request (leader only)
    acceptJoinRequest: async function (playerId, playerName) {
        if (!gameState.allianceId) {
            alert("⚠️ أنت لست في تحالف!");
            return;
        }

        const player = LeaderboardSystem.getPlayer();
        if (!player) return;

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            const doc = await ref.get();
            const data = doc.data();

            // Check if current player is leader
            if (data.leaderId !== player.id) {
                alert("⚠️ فقط القائد يمكنه قبول الطلبات!");
                return;
            }

            if (data.memberCount >= 20) {
                alert("⚠️ التحالف ممتلئ!");
                return;
            }

            // Find and remove the request
            const currentRequests = data.pendingRequests || [];
            const requestToRemove = currentRequests.find(r => r.playerId === playerId);

            if (!requestToRemove) {
                alert("⚠️ لم يتم العثور على الطلب!");
                return;
            }

            // Add player as member and remove from pending
            await ref.update({
                members: firebase.firestore.FieldValue.arrayUnion(playerId),
                memberCount: firebase.firestore.FieldValue.increment(1),
                pendingRequests: firebase.firestore.FieldValue.arrayRemove(requestToRemove)
            });

            alert(`✅ تم قبول ${playerName} في التحالف!`);
            this.updateAllianceUI();
        } catch (e) {
            console.error(e);
            alert(`⚠️ فشل قبول الطلب: ${e.message || e}`);
        }
    },

    // Reject a join request (leader only)
    rejectJoinRequest: async function (playerId, playerName) {
        if (!gameState.allianceId) return;

        const player = LeaderboardSystem.getPlayer();
        if (!player) return;

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            const doc = await ref.get();
            const data = doc.data();

            // Check if current player is leader
            if (data.leaderId !== player.id) {
                alert("⚠️ فقط القائد يمكنه رفض الطلبات!");
                return;
            }

            // Find and remove the request
            const currentRequests = data.pendingRequests || [];
            const requestToRemove = currentRequests.find(r => r.playerId === playerId);

            if (!requestToRemove) {
                return;
            }

            await ref.update({
                pendingRequests: firebase.firestore.FieldValue.arrayRemove(requestToRemove)
            });

            alert(`❌ تم رفض طلب ${playerName}.`);
            this.updateAllianceUI();
        } catch (e) {
            console.error(e);
        }
    },

    // Keep old joinAlliance for backward compatibility but redirect to request
    joinAlliance: async function (id) {
        return this.requestJoinAlliance(id);
    },

    // --- ALLIANCE FEATURES (Donations, Upgrades, War) ---

    donateToAlliance: async function () {
        const amount = parseInt(prompt("كم تريد التبرع؟ (الحد الأدنى 1 ذهب)", "100"));
        if (!amount || amount < 1) return;

        if (gameState.gold < amount) {
            alert("⚠️ لا تملك ذهباً كافياً!");
            return;
        }

        if (!gameState.allianceId) return;
        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
            alert("⚠️ يجب تسجيل الدخول للتبرع للتحالف.");
            return;
        }

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            await ref.update({
                funds: firebase.firestore.FieldValue.increment(amount)
            });

            gameState.gold -= amount;
            saveGame();
            updateUI();
            this.updateAllianceUI();
            alert(`💰 شكراً لتبرعك بـ ${amount} ذهب للتحالف!`);
        } catch (e) {
            console.error(e);
            alert("فشل التبرع.");
        }
    },

    donateGemsToAlliance: async function () {
        const amount = parseInt(prompt("كم تريد التبرع؟ (الحد الأدنى 1 جوهرة)", "10"));
        if (!amount || amount < 1) return;

        if (gameState.gems < amount) {
            alert("⚠️ لا تملك جواهر كافية!");
            return;
        }

        if (!gameState.allianceId) return;
        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
            alert("⚠️ يجب تسجيل الدخول للتبرع بالجواهر.");
            return;
        }

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            await ref.update({
                gemsFunds: firebase.firestore.FieldValue.increment(amount)
            });

            gameState.gems -= amount;
            saveGame();
            updateUI();
            this.updateAllianceUI();
            alert(`💎 شكراً لتبرعك بـ ${amount} جوهرة للتحالف!`);
        } catch (e) {
            console.error(e);
            alert("فشل التبرع بالجواهر.");
        }
    },

    buyAllianceUpgrade: async function (type) {
        if (!gameState.allianceId) return;
        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
            alert("⚠️ يجب تسجيل الدخول لتطوير التحالف.");
            return;
        }

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            const doc = await ref.get();
            const data = doc.data();

            if (data.leaderId !== LeaderboardSystem.getPlayer().id) {
                alert("⚠️ فقط القائد يمكنه تطوير التحالف.");
                return;
            }

            const currentLevel = data.upgrades?.[type] || 0;
            if (currentLevel >= AllianceConfig.MAX_LEVEL) {
                alert("⚠️ وصل هذا التطوير للحد الأقصى!");
                return;
            }

            const cost = Math.floor(AllianceConfig.UPGRADE_COST_BASE * Math.pow(AllianceConfig.UPGRADE_COST_SCALE, currentLevel));

            if ((data.funds || 0) < cost) {
                alert(`⚠️ رصيد التحالف غير كافٍ! (تحتاج ${cost} ذهب)`);
                return;
            }

            const updateData = {};
            updateData[`upgrades.${type}`] = firebase.firestore.FieldValue.increment(1);
            updateData['funds'] = firebase.firestore.FieldValue.increment(-cost);

            await ref.update(updateData);
            this.updateAllianceUI();
            alert(`🆙 تم تطوير ${AllianceConfig.UPGRADES[type].name} إلى م-${currentLevel + 1}!`);
        } catch (e) {
            console.error(e);
            alert(`فشل التطوير: ${e.message || e}`);
        }
    },

    buyAllianceGemUpgrade: async function (type) {
        if (!gameState.allianceId) return;
        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
            alert("⚠️ يجب تسجيل الدخول لتطوير التحالف بالجواهر.");
            return;
        }

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            const doc = await ref.get();
            const data = doc.data();

            if (data.leaderId !== LeaderboardSystem.getPlayer().id) {
                alert("⚠️ فقط القائد يمكنه تطوير التحالف.");
                return;
            }

            const currentLevel = data.gemUpgrades?.[type] || 0;
            if (currentLevel >= AllianceConfig.MAX_LEVEL) {
                alert("⚠️ وصل هذا التطوير للحد الأقصى!");
                return;
            }

            const cost = Math.floor(AllianceConfig.GEM_UPGRADE_COST_BASE * Math.pow(AllianceConfig.GEM_UPGRADE_COST_SCALE, currentLevel));

            if ((data.gemsFunds || 0) < cost) {
                alert(`⚠️ رصيد الجواهر غير كافٍ! (تحتاج ${cost} جوهرة)`);
                return;
            }

            const updateData = {};
            updateData[`gemUpgrades.${type}`] = firebase.firestore.FieldValue.increment(1);
            updateData['gemsFunds'] = firebase.firestore.FieldValue.increment(-cost);

            await ref.update(updateData);
            this.updateAllianceUI();
            alert(`🆙 تم تطوير ${AllianceConfig.GEM_UPGRADES[type].name} إلى م-${currentLevel + 1}!`);
        } catch (e) {
            console.error(e);
            alert(`فشل التطوير: ${e.message || e}`);
        }
    },

    transferLeadership: async function (memberId) {
        if (!gameState.allianceId) return;
        if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
            alert("⚠️ يجب تسجيل الدخول لتحويل القيادة.");
            return;
        }

        if (!confirm("هل تريد تحويل القيادة لهذا العضو؟")) return;

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            const doc = await ref.get();
            const data = doc.data();

            const currentPlayer = LeaderboardSystem.getPlayer();
            if (!currentPlayer || data.leaderId !== currentPlayer.id) {
                alert("⚠️ فقط القائد يمكنه تحويل القيادة.");
                return;
            }

            if (!data.members.includes(memberId)) {
                alert("⚠️ العضو غير موجود في التحالف.");
                return;
            }

            await ref.update({
                leaderId: memberId
            });

            alert("✅ تم تحويل القيادة بنجاح.");
            this.updateAllianceUI();
        } catch (e) {
            console.error(e);
            alert(`فشل تحويل القيادة: ${e.message || e}`);
        }
    },

    // --- ALLIANCE WAR ---

    initiateWarSetup: async function () {
        if (!gameState.allianceId) return;

        const ref = db.collection("alliances").doc(gameState.allianceId);
        const doc = await ref.get();
        const data = doc.data();

        if (data.leaderId !== LeaderboardSystem.getPlayer().id) {
            alert("⚠️ فقط القائد يمكنه إعلان الحرب.");
            return;
        }

        if (data.members.length < 5) {
            alert("⚠️ يجب أن يضم التحالف 5 أعضاء على الأقل للحرب!");
            return;
        }

        // Simple prompt for now, ideal would be a modal checklist
        // Auto-select first 5 for simplicity in this iteration or prompt IDs?
        // Let's make it auto-select the first 5 members for now as "Elite Squad"
        // In a real UI we would have a checklist.
        const confirmWar = confirm(`☠️ إعلان الحرب!\n\nسيتم اختيار أول 5 أعضاء للمعركة.\nالفائز يغنم عتاد الخاسرين!\n\nهل أنت متأكد؟`);
        if (!confirmWar) return;

        this.findWarTarget(data);
    },

    findWarTarget: async function (myAllianceData) {
        // Find random alliance that is NOT me and has >= 5 members
        try {
            const snapshot = await db.collection("alliances")
                .where("memberCount", ">=", 5)
                .limit(10)
                .get();

            const targets = [];
            snapshot.forEach(doc => {
                if (doc.id !== gameState.allianceId) targets.push({ id: doc.id, ...doc.data() });
            });

            if (targets.length === 0) {
                alert("⚠️ لم يتم العثور على تحالفات منافسة مؤهلة حالياً.");
                return;
            }

            const target = targets[Math.floor(Math.random() * targets.length)];
            this.simulateWar(myAllianceData, target);

        } catch (e) {
            console.error("War search error", e);
            alert("خطأ في البحث عن خصم.");
        }
    },

    simulateWar: async function (myAlliance, targetAlliance) {
        alert(`⚔️ بدأت المعركة ضد "${targetAlliance.name}"!\nجاري المحاكاة...`);

        // Get members data (simplified: we assume we can fetch basic stats or use random/avg power)
        // Since we can't easily fetch 10 separate user docs efficiently without a proper backend query or many reads,
        // We will simulate power based on Alliance Level + Randomness for this prototype.

        let myPower = (myAlliance.level * 1000) + (myAlliance.upgrades?.war_temple || 0) * 500;
        let enemyPower = (targetAlliance.level * 1000);

        // Add random variance
        myPower *= (0.8 + Math.random() * 0.4);
        enemyPower *= (0.8 + Math.random() * 0.4);

        const win = myPower > enemyPower;

        if (win) {
            // Generate Loot for Stash
            const loot = [];
            for (let i = 0; i < 5; i++) {
                loot.push(this.generateStreakReward('rare')); // Simulate looting gear
            }

            // Update My Alliance
            await db.collection("alliances").doc(gameState.allianceId).update({
                stash: firebase.firestore.FieldValue.arrayUnion(...loot),
                warHistory: firebase.firestore.FieldValue.arrayUnion({
                    result: 'win',
                    enemy: targetAlliance.name,
                    date: new Date().toISOString(),
                    loot: loot.length
                })
            });

            alert(`🎉 نصر ساحق!\n\nهزمتم تحالف ${targetAlliance.name}!\nغنمتم ${loot.length} قطع عتاد وتم وضعها في خزانة التحالف.`);
        } else {
            await db.collection("alliances").doc(gameState.allianceId).update({
                warHistory: firebase.firestore.FieldValue.arrayUnion({
                    result: 'loss',
                    enemy: targetAlliance.name,
                    date: new Date().toISOString()
                })
            });
            alert(`☠️ هزيمة...\n\nخسرتم المعركة ضد ${targetAlliance.name}.`);
        }
    },

    sendDirectChallenge: function () {
        const targetId = document.getElementById('direct-challenge-id')?.value;
        if (!targetId) {
            alert("يرجى إدخال معرف اللاعب");
            return;
        }
        // In a real-time app, this would push a notification.
        // Here we will just simulate finding them.
        alert(`📨 تم إرسال تحدي إلى اللاعب ${targetId}!\n(محاكاة: انتظر القبول)`);
    },

    distributeStashItem: async function (index) {
        if (!gameState.allianceId) return;

        const recipientId = prompt("أدخل معرف اللاعب (ID) الذي سيستلم القطعة:");
        if (!recipientId) return;

        // In real app: Verify user exists.
        // Here: We remove from array and assume Leader knows IDs.
        // Limitation: We can't push to THEIR inventory directly if they are offline without Cloud Functions.
        // Workaround: We delete from stash, and maybe notify them?
        // OR: We only allow Leader to take to OWN inventory, then he can trade (if trading existed).
        // Let's allow Leader to take it.

        if (recipientId !== LeaderboardSystem.getPlayer().id) {
            alert("⚠️ حالياً يمكن للقائد فقط سحب العتاد وتوزيعه يدوياً (نظام البريد غير مفعل).");
            return;
        }

        try {
            const ref = db.collection("alliances").doc(gameState.allianceId);
            const doc = await ref.get();
            const stash = doc.data().stash || [];

            if (!stash[index]) return;
            const item = stash[index];

            // Remove from stash
            const newStash = stash.filter((_, i) => i !== index);

            await ref.update({ stash: newStash });

            // Add to Leader Inventory
            gameState.inventory.push(item);
            saveGame();
            alert(`📦 تم سحب ${item.name} إلى حقيبتك.`);
            this.updateAllianceUI();
        } catch (e) {
            console.error(e);
        }
    }
};

window.ArenaSystem = ArenaSystem;
window.AllianceConfig = AllianceConfig;
