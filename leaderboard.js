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
const SEASON_KEY = 'bladeWeaver_season';

function getISOWeek(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNr = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const diff = target - firstThursday;
    return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

const LeaderboardSystem = {
    getCurrentSeasonKey: function () {
        const now = new Date();
        const year = now.getFullYear();
        const week = getISOWeek(now);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    },

    getPreviousSeasonKey: function () {
        const now = new Date();
        const prev = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const year = prev.getFullYear();
        const week = getISOWeek(prev);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    },
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
                season: this.getCurrentSeasonKey(),
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
            const season = this.getCurrentSeasonKey();
            const fetchAndSort = async (query) => {
                const snapshot = await query.get();
                const players = [];
                snapshot.forEach(doc => {
                    players.push(doc.data());
                });

                const uniquePlayers = {};
                for (const player of players) {
                    if (!uniquePlayers[player.name] || player.score > uniquePlayers[player.name].score) {
                        uniquePlayers[player.name] = player;
                    }
                }

                return Object.values(uniquePlayers)
                    .sort((a, b) => {
                        if ((b.swordSpirit || 0) !== (a.swordSpirit || 0)) {
                            return (b.swordSpirit || 0) - (a.swordSpirit || 0);
                        }
                        return b.score - a.score;
                    })
                    .slice(0, limit);
            };

            // Try current season first (may require a composite index)
            try {
                const seasonQuery = db.collection("leaderboard")
                    .where("season", "==", season)
                    .orderBy("swordSpirit", "desc")
                    .orderBy("score", "desc")
                    .limit(limit * 3);

                const seasonPlayers = await fetchAndSort(seasonQuery);
                if (seasonPlayers.length > 0) return seasonPlayers;
            } catch (e) {
                console.warn("Season query failed, falling back to legacy leaderboard.", e);
            }

            // Fallback to legacy records without season
            const legacyQuery = db.collection("leaderboard")
                .orderBy("swordSpirit", "desc")
                .orderBy("score", "desc")
                .limit(limit * 3);

            return await fetchAndSort(legacyQuery);
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return [];
        }
    },

    // Get top players for a specific season
    getTopPlayersBySeason: async function (season, limit = 10) {
        if (!db) return [];
        try {
            const snapshot = await db.collection("leaderboard")
                .where("season", "==", season)
                .orderBy("swordSpirit", "desc")
                .orderBy("score", "desc")
                .limit(limit * 3)
                .get();

            const players = [];
            snapshot.forEach(doc => {
                players.push(doc.data());
            });

            const uniquePlayers = {};
            for (const player of players) {
                if (!uniquePlayers[player.name] || player.score > uniquePlayers[player.name].score) {
                    uniquePlayers[player.name] = player;
                }
            }

            return Object.values(uniquePlayers)
                .sort((a, b) => {
                    if ((b.swordSpirit || 0) !== (a.swordSpirit || 0)) {
                        return (b.swordSpirit || 0) - (a.swordSpirit || 0);
                    }
                    return b.score - a.score;
                })
                .slice(0, limit);
        } catch (error) {
            console.error("Error getting leaderboard by season:", error);
            return [];
        }
    },

    // Get player rank within top list
    getPlayerRankTop10: function (playerName, topPlayers) {
        if (!playerName || !Array.isArray(topPlayers)) return null;
        const idx = topPlayers.findIndex(p => p.name === playerName);
        return idx >= 0 ? idx + 1 : null;
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
