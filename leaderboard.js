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
        console.log('Player created and saved:', player);
        return player;
    },

    // Initialize player from cloud data (for sync)
    initPlayer: function (name, id) {
        const player = {
            id: id || (Date.now().toString(36) + Math.random().toString(36).substr(2)),
            name: name,
            createdAt: Date.now()
        };
        this.savePlayer(player);
        console.log('Player initialized from cloud:', player);
        return player;
    },

    // Submit score to global Firebase Firestore
    submitScore: async function (playerName, score, wave, swordsForged, equipment, activeCharacter, inventory) {
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
                swordSpirit: gameState.swordSpirit || 0, // نقاط الصعود
                equipment: equipment || { head: null, body: null, weapon: null },
                activeCharacter: activeCharacter || 'default',
                inventory: inventory || [],
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
            // Fetch more players than needed to account for duplicates
            const snapshot = await db.collection("leaderboard")
                .orderBy("swordSpirit", "desc") // ترتيب حسب نقاط الصعود أولاً
                .orderBy("score", "desc") // ثم حسب النقاط
                .limit(limit * 3) // Fetch 3x the limit to be safe
                .get();

            const players = [];
            snapshot.forEach(doc => {
                players.push(doc.data());
            });

            // Process to get unique players with their highest score
            const uniquePlayers = {};
            for (const player of players) {
                if (!uniquePlayers[player.name] || player.score > uniquePlayers[player.name].score) {
                    uniquePlayers[player.name] = player;
                }
            }

            // Convert back to an array, sort by score, and take the top players
            const sortedUniquePlayers = Object.values(uniquePlayers)
                .sort((a, b) => {
                    // ترتيب حسب نقاط الصعود أولاً
                    if ((b.swordSpirit || 0) !== (a.swordSpirit || 0)) {
                        return (b.swordSpirit || 0) - (a.swordSpirit || 0);
                    }
                    // ثم حسب النقاط
                    return b.score - a.score;
                })
                .slice(0, limit);

            return sortedUniquePlayers;
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return [];
        }
    },

    // Get player rank (Simulated locally among top players or fetched)
    getPlayerRank: async function (playerName) {
        // لجلب الترتيب الفعلي نحتاج لاستعلام إضافي، للتبسيط سنكتفي بالرتبة من ضمن التوب 10 حالياً
        return null;
    },

    // Check if name is already taken in Firebase
    isNameTaken: async function (name) {
        if (!db) return false;
        try {
            const snapshot = await db.collection("leaderboard")
                .where("name", "==", name)
                .limit(1)
                .get();
            return !snapshot.empty;
        } catch (error) {
            console.error("Error checking name uniqueness:", error);
            return false;
        }
    }
};

// Export for use
window.LeaderboardSystem = LeaderboardSystem;
