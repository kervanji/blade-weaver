/**
 * BLADE WEAVER: Advertising & Reward System
 */

const AdSystem = {
    COOLDOWN_TIME: 30 * 60 * 1000, // 30 minutes in milliseconds

    init: function () {
        this.updateCooldownUI();
        setInterval(() => this.updateCooldownUI(), 1000);

        const watchBtn = document.getElementById('watch-ad-btn');
        if (watchBtn) {
            watchBtn.addEventListener('click', () => this.watchAd());
        }
    },

    // Check if player can watch an ad for reward
    canWatchAd: function () {
        if (!gameState.lastAdRewardTime) return true;
        const now = Date.now();
        return (now - gameState.lastAdRewardTime) >= this.COOLDOWN_TIME;
    },

    // Get remaining cooldown time in seconds
    getRemainingCooldown: function () {
        if (!gameState.lastAdRewardTime) return 0;
        const now = Date.now();
        const elapsed = now - gameState.lastAdRewardTime;
        return Math.max(0, Math.ceil((this.COOLDOWN_TIME - elapsed) / 1000));
    },

    // Simulate watching an ad
    watchAd: function () {
        if (!this.canWatchAd()) {
            alert("⚠️ يرجى الانتظار حتى انتهاء الوقت المتبقي!");
            return;
        }

        // Show a loading/watching state (optional simulation)
        const watchBtn = document.getElementById('watch-ad-btn');
        const originalText = watchBtn.innerHTML;
        watchBtn.disabled = true;
        watchBtn.innerHTML = "⏳ جاري عرض الإعلان...";

        setTimeout(() => {
            this.rewardPlayer();
            watchBtn.innerHTML = originalText;
            this.updateCooldownUI();
        }, 2000); // 2 second simulation
    },

    // Give reward to player
    rewardPlayer: function () {
        gameState.lastAdRewardTime = Date.now();

        // Random reward: 70% Gold (1000), 30% Gem (1)
        const isGem = Math.random() < 0.3;
        let message = "";

        if (isGem) {
            gameState.gems += 1;
            message = "🎁 رائع! حصلت على 1 حجر أسطوري 💎 بدعمك لنا!";
        } else {
            const goldAmt = 1000;
            gameState.gold += goldAmt;
            gameState.stats.totalGold += goldAmt;
            message = `🎁 شكراً لك! حصلت على ${goldAmt} ذهبة 🪙 تقديراً لدعمك!`;
        }

        saveGame();
        updateUI();
        alert(message);
    },

    // Update the UI elements related to ad cooldown
    updateCooldownUI: function () {
        const watchBtn = document.getElementById('watch-ad-btn');
        const timerContainer = document.getElementById('ad-cooldown-timer');
        const timeDisplay = document.getElementById('cooldown-time');

        if (!this.canWatchAd()) {
            if (watchBtn) watchBtn.classList.add('hidden');
            if (timerContainer) timerContainer.classList.remove('hidden');

            const remaining = this.getRemainingCooldown();
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            if (timeDisplay) {
                timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        } else {
            if (watchBtn) watchBtn.classList.remove('hidden');
            if (timerContainer) timerContainer.classList.add('hidden');
        }
    }
};

window.AdSystem = AdSystem;
