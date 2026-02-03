/**
 * BLADE WEAVER: Referral System
 */

const ReferralSystem = {
    // جلب رابط الدعوة الخاص باللاعب
    getReferralLink: function () {
        const player = LeaderboardSystem.getPlayer();
        if (!player) return null;

        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?ref=${player.id}`;
    },

    // التحقق إذا كان اللاعب دخل عبر رابط دعوة
    checkReferralOnLoad: async function () {
        const urlParams = new URLSearchParams(window.location.search);
        const refId = urlParams.get('ref');

        if (refId) {
            // حفظ كود الداعي في localStorage مؤقتاً حتى يقوم اللاعب بإنشاء حساب
            localStorage.setItem('pending_referral', refId);
            console.log("Found referral code:", refId);
        }
    },

    // معالجة المكافأة عند إنشاء الحساب لأول مرة
    processNewPlayerReferral: async function (newPlayerId) {
        if (!db) return;

        const referrerId = localStorage.getItem('pending_referral');
        if (!referrerId || referrerId === newPlayerId) return;

        try {
            // 1. تسجيل عملية الإحالة في Firebase
            await db.collection("referrals").add({
                referrerId: referrerId,
                newPlayerId: newPlayerId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                claimed: false
            });

            // 2. إعطاء مكافأة ترحيبية للاعب الجديد فوراً
            gameState.gold += 500;
            gameState.stats.totalGold += 500;

            // تنبيه اللاعب
            alert("✨ مرحباً بك! حصلت على 500 ذهبة كهدية ترحيبية بفضل صديقك!");

            // إزالة الكود المعلق
            localStorage.removeItem('pending_referral');

            saveGame();
            updateUI();
        } catch (error) {
            console.error("Error processing referral:", error);
        }
    },

    // جلب وإعطاء الجوائز للداعي (عندما يفتح اللعبة)
    checkRewardsForReferrer: async function () {
        if (!db) return;
        const player = LeaderboardSystem.getPlayer();
        if (!player) return;

        try {
            // البحث عن إحالات لم يتم استلام جوائزها بعد
            const snapshot = await db.collection("referrals")
                .where("referrerId", "==", player.id)
                .where("claimed", "==", false)
                .get();

            if (!snapshot.empty) {
                let totalGold = 0;
                let totalSpirits = 0;
                let count = 0;

                const batch = db.batch();

                snapshot.forEach(doc => {
                    totalGold += 1000;
                    totalSpirits += 5;
                    count++;
                    // تحديث الحالة إلى "تم الاستلام"
                    batch.update(doc.ref, { claimed: true });
                });

                await batch.commit();

                // إضافة الجوائز للاعب
                gameState.gold += totalGold;
                gameState.stats.totalGold += totalGold;
                gameState.swordSpirit += totalSpirits;

                // تحديث UI وحفظ
                saveGame();
                updateUI();

                // رسالة نجاح
                alert(`🎊 أخبار رائعة! انضم ${count} من أصدقائك بفضلك!\nحصلت على ${totalGold} ذهبة و ${totalSpirits} روح سيف!`);
            }
        } catch (error) {
            console.error("Error checking referral rewards:", error);
        }
    }
};

window.ReferralSystem = ReferralSystem;
