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

        // Security check: Must be authenticated to read referrals
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return; // Silent return if not logged in

        const player = LeaderboardSystem.getPlayer();
        if (!player) return;

        // Ensure we are querying for our OWN auth ID, otherwise rules will fail
        if (player.id !== currentUser.uid) {
            console.log("ReferralSystem: Player ID mismatch with Auth ID, skipping check.");
            // Optionally we could force sync here, but let's just skip to avoid errors
            return;
        }

        try {
            // البحث عن إحالات لم يتم استلام جوائزها بعد
            const snapshot = await db.collection("referrals")
                .where("referrerId", "==", player.id)
                .where("claimed", "==", false)
                .get();

            if (!snapshot.empty) {
                let totalGold = 0;
                let totalSpirits = 0;
                let totalArenaCoins = 0;
                let count = 0;

                const batch = db.batch();

                snapshot.forEach(doc => {
                    totalGold += 1000;
                    totalSpirits += 5;
                    totalArenaCoins += 20;
                    count++;
                    // تحديث الحالة إلى "تم الاستلام"
                    batch.update(doc.ref, { claimed: true });
                });

                await batch.commit();

                // إضافة الجوائز للاعب
                gameState.gold += totalGold;
                gameState.stats.totalGold += totalGold;
                gameState.swordSpirit += totalSpirits;
                gameState.arenaCoins += totalArenaCoins;

                // تحديث UI وحفظ
                saveGame();
                updateUI();

                // رسالة نجاح
                alert(`🎊 أخبار رائعة! انضم ${count} من أصدقائك بفضلك!\nحصلت على ${totalGold} ذهبة و ${totalSpirits} روح سيف و ${totalArenaCoins} عملة ساحة!`);
            }
        } catch (error) {
            console.error("Error checking referral rewards:", error);
        }
    },

    // مكافأة الانستغرام والمشاركة
    claimInstagramReward: function () {
        const INSTA_KEY = 'bladeWeaver_insta_claimed';

        // جلب البيانات للمشاركة
        const rank = gameState.arenaRankPoints || 0;
        const power = gameState.stats.bestSwordDamage || 0;
        const playerName = LeaderboardSystem.getPlayer()?.name || "بطل مجهول";

        const message = `⚔️ أنا بطل في Blade Weaver!\n🏰 ترتيبي في الساحة: ${rank}\n🔥 أقوى ضربة لي: ${power}\n🛡️ هيا بنا نبني أقوى تحالف! انضم إليّ أو بارزني!\n\nلعب الآن: ${window.location.origin}`;

        // محاولة استخدام Web Share API إذا كان متاحاً
        if (navigator.share) {
            navigator.share({
                title: 'Blade Weaver',
                text: message,
                url: window.location.origin
            }).then(() => {
                this.giveInstaReward(INSTA_KEY);
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard and open Instagram
            navigator.clipboard.writeText(message).then(() => {
                alert("📋 تم نسخ رسالة التحدي! شاركها في الستوري الخاص بك واحصل على جائزتك.");
                window.open('https://www.instagram.com/reels/create/', '_blank');
                this.giveInstaReward(INSTA_KEY);
            });
        }
    },

    giveInstaReward: function (key) {
        if (!localStorage.getItem(key)) {
            gameState.gold += 2000;
            gameState.arenaCoins += 50;
            localStorage.setItem(key, 'true');
            saveGame();
            updateUI();
            alert("📸 شكراً للمشاركة! حصلت على 2000 ذهبة و 50 عملة ساحة! ✨");
        }
    }
};

window.ReferralSystem = ReferralSystem;
