/**
 * BLADE WEAVER: Admin Reward System
 * Handles global rewards distributed by the game owner
 */

const AdminRewardSystem = {
    // Check and claim rewards for the current player
    checkRewards: async function () {
        if (!db) return;
        const player = LeaderboardSystem.getPlayer();
        if (!player) return;

        try {
            // 1. Get all active rewards from Firestore
            const snapshot = await db.collection("admin_rewards").get();
            if (snapshot.empty) return;

            // Initialize claimed list in gameState if it doesn't exist
            if (!gameState.claimedRewards) {
                gameState.claimedRewards = [];
            }

            let rewardsClaimed = 0;
            let rewardSummary = [];

            // 2. Filter rewards for this player
            for (const doc of snapshot.docs) {
                const reward = doc.data();
                const rewardId = doc.id;

                // Skip if already claimed
                if (gameState.claimedRewards.includes(rewardId)) continue;

                let isEligible = false;

                // Match by name
                if (reward.targetType === "name" && reward.targetValue === player.name) {
                    isEligible = true;
                }
                // Match by ranking (Requires top players list)
                else if (reward.targetType === "top_rank") {
                    const topPlayers = await LeaderboardSystem.getTopPlayers(reward.targetValue);
                    const isTop = topPlayers.some(p => p.name === player.name);
                    if (isTop) isEligible = true;
                }
                // Match everyone
                else if (reward.targetType === "all") {
                    isEligible = true;
                }

                if (isEligible) {
                    this.applyReward(reward);
                    gameState.claimedRewards.push(rewardId);
                    rewardsClaimed++;
                    rewardSummary.push(`${reward.message || 'جائزة خاصة'}: 🪙${reward.gold || 0} 💎${reward.gems || 0} ✨${reward.spirits || 0}`);
                }
            }

            if (rewardsClaimed > 0) {
                saveGame();
                updateUI();
                alert(`🎊 تهانينا! لقد تلقيت ${rewardsClaimed} جائزة من الإدارة:\n\n${rewardSummary.join('\n')}`);
            }

        } catch (error) {
            console.error("Error checking admin rewards:", error);
        }
    },

    // Apply the reward values to gameState
    applyReward: function (reward) {
        if (reward.gold) {
            gameState.gold += reward.gold;
            gameState.stats.totalGold += reward.gold;
        }
        if (reward.gems) {
            gameState.gems += reward.gems;
        }
        if (reward.spirits) {
            gameState.swordSpirit += reward.spirits;
        }
    }
};

window.AdminRewardSystem = AdminRewardSystem;
