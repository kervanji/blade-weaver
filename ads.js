/**
 * BLADE WEAVER: Advertising & Reward System (V2)
 */

const AdSystem = {
    COOLDOWNS: {
        daily: 30 * 60 * 1000,       // 30 minutes
        upgrade: 60 * 60 * 1000,     // 1 hour
        mega_chest: 120 * 60 * 1000  // 2 hours
    },

    init: function () {
        this.updateAllUI();
        setInterval(() => this.updateAllUI(), 1000);

        // Daily Reward
        const watchBtn = document.getElementById('watch-ad-btn');
        if (watchBtn) watchBtn.onclick = () => this.watchAd('daily');

        // Free Upgrade
        const upgradeBtn = document.getElementById('watch-upgrade-ad-btn');
        if (upgradeBtn) upgradeBtn.onclick = () => this.watchAd('upgrade');

        // Mega Ad Chest
        const megaBtn = document.getElementById('watch-mega-ad-btn');
        if (megaBtn) megaBtn.onclick = () => this.watchAd('mega_chest');
    },

    canWatch: function (type) {
        let lastTime = 0;
        if (type === 'daily') lastTime = gameState.lastAdRewardTime;
        else if (type === 'upgrade') lastTime = gameState.lastFreeUpgradeTime;
        else if (type === 'mega_chest') lastTime = gameState.lastMegaAdChestTime;

        if (!lastTime) return true;
        return (Date.now() - lastTime) >= this.COOLDOWNS[type];
    },

    getRemaining: function (type) {
        let lastTime = 0;
        if (type === 'daily') lastTime = gameState.lastAdRewardTime;
        else if (type === 'upgrade') lastTime = gameState.lastFreeUpgradeTime;
        else if (type === 'mega_chest') lastTime = gameState.lastMegaAdChestTime;

        if (!lastTime) return 0;
        const elapsed = Date.now() - lastTime;
        return Math.max(0, Math.ceil((this.COOLDOWNS[type] - elapsed) / 1000));
    },

    watchAd: function (type) {
        if (!this.canWatch(type)) {
            alert("⚠️ يرجى الانتظار حتى انتهاء وقت الانتظار!");
            return;
        }

        let btnId = '';
        if (type === 'daily') btnId = 'watch-ad-btn';
        else if (type === 'upgrade') btnId = 'watch-upgrade-ad-btn';
        else if (type === 'mega_chest') btnId = 'watch-mega-ad-btn';

        const btn = document.getElementById(btnId);
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = "⏳...";

        setTimeout(() => {
            this.giveReward(type);
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.updateAllUI();
        }, 2000);
    },

    giveReward: function (type) {
        let message = "";

        if (type === 'daily') {
            gameState.lastAdRewardTime = Date.now();
            const isGem = Math.random() < 0.3;
            if (isGem) {
                gameState.gems += 1;
                message = "🎁 حصلت على 1 حجر أسطوري 💎!";
            } else {
                gameState.gold += 1000;
                gameState.stats.totalGold += 1000;
                message = "🎁 حصلت على 1000 ذهبة 🪙!";
            }
        }
        else if (type === 'upgrade') {
            gameState.lastFreeUpgradeTime = Date.now();
            const upgradeKeys = Object.keys(gameState.upgrades);
            const randomKey = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
            gameState.upgrades[randomKey]++;

            const names = { hammer: 'المطرقة', bellows: 'المنفاخ', sharpener: 'المسن', furnace: 'الفرن', pickaxe: 'المعول' };
            message = `✨ مبروك! حصلت على ترقية مجانية لـ ${names[randomKey] || randomKey}!`;
        }
        else if (type === 'mega_chest') {
            gameState.lastMegaAdChestTime = Date.now();
            const isGem = Math.random() < 0.4;
            if (isGem) {
                gameState.gems += 5;
                message = "🔥 مذهل! فتحت صندوق الإدارة وحصلت على 5 أحجار أساطير 💎💎💎!";
            } else {
                gameState.gold += 5000;
                gameState.stats.totalGold += 5000;
                message = "🔥 رائع! فتحت صندوق الإدارة وحصلت على 5000 ذهبة 🪙!";
            }
        }

        saveGame();
        updateUI();
        alert(message);
    },

    updateAllUI: function () {
        this.updateTypeUI('daily', 'watch-ad-btn', 'ad-cooldown-timer', 'cooldown-time');
        this.updateTypeUI('upgrade', 'free-upgrade-ad-box', 'upgrade-ad-cooldown', 'upgrade-ad-cooldown');
        this.updateTypeUI('mega_chest', 'watch-mega-ad-btn', 'mega-ad-cooldown', 'mega-ad-cooldown');
    },

    updateTypeUI: function (type, boxId, timerId, spanId) {
        const canWatch = this.canWatch(type);
        const box = document.getElementById(boxId);
        const timer = document.getElementById(timerId);

        if (canWatch) {
            if (timer) timer.classList.add('hidden');
            if (type === 'upgrade' || type === 'daily') {
                if (box) box.classList.remove('hidden');
            } else if (type === 'mega_chest') {
                if (box) box.classList.remove('hidden');
                const btn = document.getElementById('watch-mega-ad-btn');
                if (btn) btn.classList.remove('hidden');
            }
        } else {
            if (timer) {
                timer.classList.remove('hidden');
                const remaining = this.getRemaining(type);
                const min = Math.floor(remaining / 60);
                const sec = remaining % 60;
                const timeText = `${min}:${sec.toString().padStart(2, '0')}`;

                // Find span within timer or use the timer itself
                const span = timer.querySelector('.time') || timer;
                span.textContent = timeText;
            }
            if (type === 'upgrade') {
                // In upgrade we might want to keep the box but hide the button
                const btn = document.getElementById('watch-upgrade-ad-btn');
                if (btn) btn.classList.add('hidden');
            } else if (type === 'mega_chest' || type === 'daily') {
                const btn = document.getElementById(boxId);
                if (btn && btn.tagName === 'BUTTON') btn.classList.add('hidden');
            }
        }
    }
};

window.AdSystem = AdSystem;
