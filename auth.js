/**
 * BLADE WEAVER: Authentication & Cloud Sync
 */

const AuthService = {
    init: function () {
        console.log("AuthService: Initializing...");
        if (typeof firebase === 'undefined') {
            console.error("AuthService: Firebase not found!");
            return;
        }

        // Use global SAVE_KEY or default
        this.saveKey = window.SAVE_KEY || 'bladeWeaver_save';

        firebase.auth().onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });

        // Event Listeners for Login Overlay
        const googleBtn = document.getElementById('login-overlay-google-btn');
        if (googleBtn) googleBtn.onclick = () => this.loginWithGoogle();

        const emailLoginBtn = document.getElementById('login-overlay-signin-btn');
        if (emailLoginBtn) emailLoginBtn.onclick = () => this.loginWithEmail();

        const emailSignupBtn = document.getElementById('login-overlay-signup-btn');
        if (emailSignupBtn) emailSignupBtn.onclick = () => this.signUpWithEmail();

        // Settings / Account Panel Listeners (for logout)
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.onclick = () => this.logout();

        // Initialize Messaging
        this.initMessaging();
    },

    handleAuthStateChange: function (user) {
        const loginOverlay = document.getElementById('login-overlay');
        const loggedInView = document.getElementById('auth-logged-in');

        if (user) {
            console.log("AuthService: User logged in:", user.uid);
            if (loginOverlay) loginOverlay.style.display = 'none'; // Hide overlay
            if (loggedInView) loggedInView.classList.remove('hidden');

            this.updateAuthUI(user);
            this.loadCloudData(user.uid);
            this.listenForGifts(user.uid);
        } else {
            if (this.giftListener) {
                this.giftListener(); // Unsubscribe
                this.giftListener = null;
            }
            console.log("AuthService: User logged out");
            if (loginOverlay) loginOverlay.style.display = 'flex'; // Show overlay
            if (loggedInView) loggedInView.classList.add('hidden');

            // Should clear game data or reset generic UI?
            // For now, overlay blocks access.
        }
    },

    initMessaging: async function () {
        if (typeof firebase !== 'undefined' && firebase.messaging) {
            try {
                if (!window.gameState || !window.gameState.settings || !window.gameState.settings.notificationsEnabled) {
                    console.log("AuthService: Notifications disabled in game settings.");
                    return;
                }
                const messaging = firebase.messaging();
                console.log("AuthService: Requesting notification permission...");

                // Request Permission (Browser prompt)
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('AuthService: Notification permission granted.');

                    // Get Token
                    const token = await messaging.getToken({ vapidKey: 'BMD2vO_p_sI13vR9O_u_R6Y_...' }); // Optional: Add VAPID key if needed
                    if (token) {
                        console.log('AuthService: FCM Token:', token);
                        // Save token to user profile if logged in
                        this.fcmToken = token;
                        const user = firebase.auth().currentUser;
                        if (user) {
                            this.saveTokenToDatabase(user.uid, token);
                        }
                    } else {
                        console.log('AuthService: No registration token available.');
                    }
                } else {
                    console.log('AuthService: Unable to get permission to notify.');
                }

                // Handle foreground messages
                messaging.onMessage((payload) => {
                    console.log('AuthService: Message received. ', payload);
                    // Customize UI for foreground notification
                    const notificationTitle = payload.notification.title;
                    const notificationOptions = {
                        body: payload.notification.body,
                        icon: '/icon-192.png'
                    };

                    // Show in-game notification using AdminSystem style if available
                    if (window.AdminSystem && window.AdminSystem.sendNotification) {
                        window.AdminSystem.sendNotification(`${notificationTitle}: ${notificationOptions.body}`, 'info');
                    } else {
                        alert(`${notificationTitle}\n${notificationOptions.body}`);
                    }
                });

            } catch (err) {
                console.log('AuthService: An error occurred while retrieving token. ', err);
            }
        }
    },

    saveTokenToDatabase: async function (uid, token) {
        if (!db) return;
        try {
            await db.collection("users").doc(uid).set({
                fcmToken: token,
                lastTokenUpdate: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log("AuthService: FCM Token saved to database.");
        } catch (error) {
            console.error("AuthService: Error saving FCM token:", error);
        }
    },

    updateAuthUI: function (user) {
        if (user) {
            document.getElementById('user-display-name').textContent = user.displayName || user.email.split('@')[0];
            document.getElementById('user-email').textContent = user.email;
            if (user.photoURL) {
                document.getElementById('user-avatar').innerHTML = `<img src="${user.photoURL}" alt="avatar" style="width: 50px; height: 50px; border-radius: 50%;">`;
            }

            // Save token if we have it pending
            if (this.fcmToken) {
                this.saveTokenToDatabase(user.uid, this.fcmToken);
            }
        }
    },

    loginWithGoogle: async function () {
        console.log("AuthService: loginWithGoogle clicked");
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await firebase.auth().signInWithPopup(provider);
            // Auth listener will handle next steps
        } catch (error) {
            console.error(error);
            alert("خطأ في تسجيل الدخول عبر Google");
        }
    },

    loginWithEmail: async function () {
        const email = document.getElementById('login-overlay-email').value;
        const password = document.getElementById('login-overlay-password').value;
        if (!email || !password) return;

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            alert("خطأ: " + error.message);
        }
    },

    signUpWithEmail: async function () {
        const email = document.getElementById('login-overlay-email').value;
        const password = document.getElementById('login-overlay-password').value;
        if (!email || !password) return;

        try {
            // New account
            await firebase.auth().createUserWithEmailAndPassword(email, password);
        } catch (error) {
            alert("خطأ: " + error.message);
        }
    },

    logout: function () {
        firebase.auth().signOut().then(() => {
            console.log("User signed out. Reloading to force login.");
            window.location.reload();
        });
    },

    loadCloudData: async function (uid) {
        if (!db) return;
        try {
            const doc = await db.collection("users").doc(uid).get();
            let cloudData = null;

            if (doc.exists) {
                cloudData = doc.data().gameData;
            }

            // Get name from auth account (displayName or email prefix)
            const authUser = firebase.auth().currentUser;
            const accountName = authUser?.displayName || authUser?.email?.split('@')[0] || 'لاعب';

            if (cloudData) {
                console.log("AuthService: Cloud data loaded successfully");

                // Deep merge/overwrite critical game state fields
                // We use Object.assign for simple fields, but for arrays/objects we want to be sure
                // In this case, we trust the cloud data implicitly for the 'restore' action.

                // 1. Basic Stats
                window.gameState.gold = cloudData.gold || 0;
                window.gameState.gems = cloudData.gems || 0;
                window.gameState.wave = cloudData.wave || 1;
                window.gameState.swordSpirit = cloudData.swordSpirit || 0;
                window.gameState.arenaCoins = cloudData.arenaCoins || 0;

                // 2. Upgrades & Materials (Objects)
                window.gameState.upgrades = cloudData.upgrades || { hammer: 1, bellows: 0, sharpener: 0, furnace: 0, pickaxe: 1 };
                window.gameState.materials = cloudData.materials || { iron: 0, steel: 0, obsidian: 0, dragonBone: 0, starMetal: 0 };

                // 3. Inventory & Equipment (Arrays/Objects)
                // Important: Completely overwrite to avoid duplicates or ghost items
                window.gameState.inventory = cloudData.inventory || [];
                window.gameState.equipment = cloudData.equipment || { head: null, body: null, weapon: null };
                window.gameState.allianceId = cloudData.allianceId || null;

                // 4. Characters
                window.gameState.ownedCharacters = cloudData.ownedCharacters || ['default'];
                window.gameState.characterLevels = cloudData.characterLevels || {};
                window.gameState.activeCharacter = cloudData.activeCharacter || 'default';

                // 5. Stats Object
                window.gameState.stats = cloudData.stats || window.gameState.stats;

                // Use saved name if exists, otherwise use account name
                const playerName = cloudData.playerName || accountName;
                window.gameState.playerName = playerName;

                if (window.LeaderboardSystem) {
                    window.LeaderboardSystem.initPlayer(playerName, uid);
                }
                if (window.setLocalPlayerName) window.setLocalPlayerName(playerName);

                console.log("AuthService: Game state restored. Level:", window.gameState.wave, "Items:", window.gameState.inventory.length);

                if (window.updateUI) window.updateUI();
                if (window.saveGame) window.saveGame();
            } else {
                console.log("No cloud data found for this user. Treating as new user.");

                // New user - use account name automatically (no name modal)
                window.gameState.playerName = accountName;
                if (window.LeaderboardSystem) {
                    window.LeaderboardSystem.initPlayer(accountName, uid);
                }
                if (window.setLocalPlayerName) window.setLocalPlayerName(accountName);
                if (window.saveGame) window.saveGame();
            }
        } catch (error) {
            console.error("Cloud load error:", error);
        }
    },

    saveCloudData: async function (uid, data) {
        if (!db) return;
        try {
            await db.collection("users").doc(uid).set({
                gameData: data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Cloud save error:", error);
        }
    },

    listenForGifts: function (uid) {
        if (!db) return;

        // Listen for new gifts
        this.giftListener = db.collection("users").doc(uid).collection("gifts")
            .where("claimed", "==", false)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === "added") {
                        const gift = change.doc.data();
                        const giftId = change.doc.id;

                        console.log("Gift received:", gift);

                        // Apply gift to game state
                        if (gift.gold) {
                            window.gameState.gold += gift.gold;
                        }
                        if (gift.gems) {
                            window.gameState.gems += gift.gems;
                        }
                        if (gift.arenaCoins) {
                            window.gameState.arenaCoins += gift.arenaCoins;
                        }
                        if (gift.item) {
                            window.gameState.inventory.push(gift.item);
                        }

                        // Mark gift as claimed
                        try {
                            await db.collection("users").doc(uid).collection("gifts").doc(giftId).update({
                                claimed: true,
                                claimedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        } catch (e) {
                            console.error("Error marking gift as claimed:", e);
                        }

                        // Update UI and save
                        if (window.updateUI) window.updateUI();
                        if (window.saveGame) window.saveGame();

                        // Show notification
                        let msg = "🎁 هدية جديدة! ";
                        if (gift.gold) msg += `+${gift.gold} ذهب `;
                        if (gift.gems) msg += `+${gift.gems} جوهرة `;
                        if (gift.item) msg += `قطعة جديدة! `;
                        alert(msg);
                    }
                });
            }, (error) => {
                console.error("Gift listener error:", error);
            });
    }
};

window.AuthService = AuthService;

// Update player name everywhere - leaderboard, Firebase, alliance leader
window.updatePlayerNameEverywhere = async function (newName) {
    if (!newName || newName.length < 2) {
        console.error("Invalid name for update");
        return false;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        console.error("No user logged in");
        return false;
    }

    try {
        // 1. Update gameState
        window.gameState.playerName = newName;

        // 2. Update LeaderboardSystem
        if (window.LeaderboardSystem) {
            const player = window.LeaderboardSystem.getPlayer();
            if (player) {
                player.name = newName;
                // Update in Firebase leaderboard
                if (db) {
                    await db.collection("leaderboard").doc(player.id).update({
                        name: newName
                    });
                }
            }
        }

        // 3. Update local display
        if (window.setLocalPlayerName) {
            window.setLocalPlayerName(newName);
        }

        // 4. Update alliance leaderName if player is leader
        if (window.gameState.allianceId && db) {
            const allianceDoc = await db.collection("alliances").doc(window.gameState.allianceId).get();
            if (allianceDoc.exists) {
                const allianceData = allianceDoc.data();
                const player = window.LeaderboardSystem?.getPlayer();
                if (player && allianceData.leaderId === player.id) {
                    await db.collection("alliances").doc(window.gameState.allianceId).update({
                        leaderName: newName
                    });
                    console.log("Alliance leader name updated to:", newName);
                }
            }
        }

        // 5. Save game to cloud
        if (window.saveGame) {
            window.saveGame(true);
        }

        console.log("Player name updated everywhere to:", newName);
        return true;
    } catch (error) {
        console.error("Error updating player name:", error);
        return false;
    }
};

// Request Name Change Function
window.requestNameChange = function (type) {
    if (type === 'gems') {
        if (gameState.gems >= 50) {
            const newName = prompt("أدخل اسمك الجديد (حرفين على الأقل):");
            if (newName && newName.trim().length >= 2) {
                // Check if name is available first
                window.LeaderboardSystem.isNameTaken(newName.trim()).then(isTaken => {
                    if (isTaken) {
                        alert("⚠️ هذا الاسم مستخدم من قبل!");
                    } else {
                        gameState.gems -= 50;
                        window.updatePlayerNameEverywhere(newName.trim()).then(success => {
                            if (success) {
                                alert("✅ تم تغيير اسمك بنجاح إلى: " + newName.trim());
                                if (window.updateUI) window.updateUI();
                            } else {
                                gameState.gems += 50; // Refund on failure
                                alert("⚠️ حدث خطأ في تغيير الاسم");
                            }
                        });
                    }
                });
            } else if (newName !== null) {
                alert("⚠️ الاسم يجب أن يكون حرفين على الأقل");
            }
        } else {
            alert("ليس لديك ما يكفي من الجواهر! (مطلوب 50 💎)");
        }
    } else if (type === 'ad') {
        if (window.AdSystem) {
            // Watch ad then prompt for name change
            window.AdSystem.watchAd('change_name');
        }
    }
};

// Callback for ad-based name change
window.onNameChangeAdComplete = function () {
    const newName = prompt("أدخل اسمك الجديد (حرفين على الأقل):");
    if (newName && newName.trim().length >= 2) {
        window.LeaderboardSystem.isNameTaken(newName.trim()).then(isTaken => {
            if (isTaken) {
                alert("⚠️ هذا الاسم مستخدم من قبل!");
            } else {
                window.updatePlayerNameEverywhere(newName.trim()).then(success => {
                    if (success) {
                        alert("✅ تم تغيير اسمك بنجاح إلى: " + newName.trim());
                        if (window.updateUI) window.updateUI();
                    } else {
                        alert("⚠️ حدث خطأ في تغيير الاسم");
                    }
                });
            }
        });
    } else if (newName !== null) {
        alert("⚠️ الاسم يجب أن يكون حرفين على الأقل");
    }
};
