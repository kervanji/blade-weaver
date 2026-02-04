/**
 * BLADE WEAVER: Missions System
 * Daily missions and achievements
 */

const MISSIONS_KEY = 'bladeWeaver_missions';

const MissionsSystem = {
    // Available mission templates
    missionTemplates: [
        {
            id: 'forge_swords',
            nameAr: 'صانع السيوف',
            descAr: 'اصنع {target} سيوف',
            icon: '⚔️',
            type: 'swords',
            targets: [3, 5, 10],
            rewards: [1, 1, 1]
        },
        {
            id: 'defeat_enemies',
            nameAr: 'صائد الوحوش',
            descAr: 'اهزم {target} عدو',
            icon: '👹',
            type: 'enemies',
            targets: [10, 25, 50],
            rewards: [1, 1, 1]
        },
        {
            id: 'reach_wave',
            nameAr: 'محارب الموجات',
            descAr: 'وصل للموجة {target}',
            icon: '🌊',
            type: 'wave',
            targets: [10, 25, 50],
            rewards: [1, 1, 1]
        },
        {
            id: 'collect_gold',
            nameAr: 'جامع الذهب',
            descAr: 'اجمع {target} ذهب',
            icon: '🪙',
            type: 'gold',
            targets: [500, 1000, 5000],
            rewards: [1, 1, 1]
        },
        {
            id: 'click_anvil',
            nameAr: 'الحداد المثابر',
            descAr: 'انقر على السندان {target} مرة',
            icon: '🔨',
            type: 'clicks',
            targets: [100, 250, 500],
            rewards: [1, 1, 1]
        },
        {
            id: 'mine_materials',
            nameAr: 'عامل المناجم',
            descAr: 'اجمع {target} مواد من التعدين',
            icon: '⛏️',
            type: 'mining',
            targets: [10, 25, 50],
            rewards: [1, 1, 1]
        },
        {
            id: 'forge_rare',
            nameAr: 'صانع الأساطير',
            descAr: 'اصنع سيف نادر أو أفضل',
            icon: '💎',
            type: 'rare_sword',
            targets: [1],
            rewards: [1]
        },
        {
            id: 'prestige',
            nameAr: 'الصعود الأسطوري',
            descAr: 'قم بالصعود مرة واحدة',
            icon: '🌟',
            type: 'prestige',
            targets: [1],
            rewards: [1]
        }
    ],

    // Get saved missions state
    getMissionsState: function () {
        const saved = localStorage.getItem(MISSIONS_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            // Check if missions are from today
            const today = new Date().toDateString();
            if (state.date === today) {
                return state;
            }
        }
        // Generate new missions for today
        return this.generateDailyMissions();
    },

    // Save missions state
    saveMissionsState: function (state) {
        localStorage.setItem(MISSIONS_KEY, JSON.stringify(state));
    },

    // Generate daily missions
    generateDailyMissions: function () {
        const today = new Date().toDateString();
        const missions = [];

        // Select 4 random missions
        const shuffled = [...this.missionTemplates].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);

        selected.forEach(template => {
            const difficultyIndex = Math.floor(Math.random() * Math.min(template.targets.length, 2));
            const target = template.targets[difficultyIndex];
            const reward = template.rewards[difficultyIndex];

            missions.push({
                id: template.id + '_' + target,
                templateId: template.id,
                nameAr: template.nameAr,
                descAr: template.descAr.replace('{target}', target),
                icon: template.icon,
                type: template.type,
                target: target,
                progress: 0,
                reward: reward,
                completed: false,
                claimed: false
            });
        });

        const state = {
            date: today,
            missions: missions,
            totalClaimed: 0
        };

        this.saveMissionsState(state);
        return state;
    },

    // Update mission progress
    updateProgress: function (type, amount = 1, absolute = false) {
        const state = this.getMissionsState();
        let updated = false;

        state.missions.forEach(mission => {
            if (mission.type === type && !mission.completed) {
                if (absolute) {
                    mission.progress = amount;
                } else {
                    mission.progress += amount;
                }

                if (mission.progress >= mission.target) {
                    mission.progress = mission.target;
                    mission.completed = true;
                    updated = true;
                }
            }
        });

        if (updated) {
            this.saveMissionsState(state);
        }
        return state;
    },

    // Claim mission reward
    claimReward: function (missionId) {
        const state = this.getMissionsState();
        const mission = state.missions.find(m => m.id === missionId);

        if (mission && mission.completed && !mission.claimed) {
            mission.claimed = true;
            state.totalClaimed += mission.reward;
            this.saveMissionsState(state);
            return mission.reward;
        }
        return 0;
    },

    // Get daily missions
    getDailyMissions: function () {
        const state = this.getMissionsState();
        return state.missions;
    },

    // Calculate score based on game state
    calculateScore: function (gameState) {
        let score = 0;
        score += gameState.stats.totalGold * 1;
        score += gameState.stats.totalSwords * 50;
        score += gameState.stats.totalEnemies * 10;
        score += gameState.stats.highestWave * 100;
        score += gameState.swordSpirit * 500;
        score += gameState.stats.bestSwordDamage * 5;
        return Math.floor(score);
    }
};

// Export for use
window.MissionsSystem = MissionsSystem;
