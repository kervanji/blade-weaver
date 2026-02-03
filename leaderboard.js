/**
 * BLADE WEAVER: Global Leaderboard System (Firebase)
 */

// =====================================================
// FIREBASE CONFIGURATION
// =====================================================
// ستحتاج لاستبدال هذه البيانات ببيانات مشروعك من Firebase Console
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAt9btmSvevwIwq1w-3-KTAj-4AwNP2Nwg",
    authDomain: "bladeweaver-01.firebaseapp.com",
    projectId: "bladeweaver-01",
    storageBucket: "bladeweaver-01.firebasestorage.app",
    messagingSenderId: "594542811468",
    appId: "1:594542811468:web:096481dd93575c4c8e57e9",
    measurementId: "G-08113D2VM5"
};

// تهيئة Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
} else {
    console.error("Firebase SDK not loaded!");
}

const PLAYER_KEY = 'bladeWeaver_player';

const LeaderboardSystem = {
    // Get or create player profile (Locally)
    getPlayer: function () {
        const saved = localStorage.getItem(PLAYER_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    },

    // Save player profile (Locally)
    savePlayer: function (player) {
        localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
    },

    // Create new player
    createPlayer: function (name) {
        const player = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: name,
            createdAt: Date.now()
        };
        this.savePlayer(player);
        return player;
    },

    // Submit score to global Firebase Firestore
    submitScore: async function (playerName, score, wave, swordsForged) {
        if (!db) return;

        try {
            const player = this.getPlayer();
            if (!player) return;

            // تحديث أو إضافة السكور في قاعدة البيانات
            await db.collection("leaderboard").doc(player.id).set({
                name: playerName,
                score: score,
                wave: wave,
                swordsForged: swordsForged,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log("Score submitted to Firebase!");
        } catch (error) {
            console.error("Error submitting score:", error);
        }
    },

    // Get top players from Firebase
    getTopPlayers: async function (limit = 10) {
        if (!db) return [];

        try {
            const snapshot = await db.collection("leaderboard")
                .orderBy("score", "desc")
                .limit(limit)
                .get();

            const players = [];
            snapshot.forEach(doc => {
                players.push(doc.data());
            });
            return players;
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return [];
        }
    },

    // Get player rank (Simulated locally among top players or fetched)
    getPlayerRank: async function (playerName) {
        // لجلب الترتيب الفعلي نحتاج لاستعلام إضافي، للتبسيط سنكتفي بالرتبة من ضمن التوب 10 حالياً
        return null;
    }
};

// Export for use
window.LeaderboardSystem = LeaderboardSystem;
