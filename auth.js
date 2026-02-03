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
            this.updateAuthUI(user);
            if (user) {
                this.loadCloudData(user.uid);
            }
        });

        // Event Listeners with safety checks
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) googleBtn.onclick = () => this.loginWithGoogle();

        const emailLoginBtn = document.getElementById('email-login-btn');
        if (emailLoginBtn) emailLoginBtn.onclick = () => this.loginWithEmail();

        const emailSignupBtn = document.getElementById('email-signup-btn');
        if (emailSignupBtn) emailSignupBtn.onclick = () => this.signUpWithEmail();

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.onclick = () => this.logout();

        // Initialize Messaging
        this.initMessaging();
    },

    initMessaging: async function () {
        if (typeof firebase !== 'undefined' && firebase.messaging) {
            try {
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
        const loggedInView = document.getElementById('auth-logged-in');
        const loggedOutView = document.getElementById('auth-logged-out');

        if (user) {
            loggedInView.classList.remove('hidden');
            loggedOutView.classList.add('hidden');
            document.getElementById('user-display-name').textContent = user.displayName || user.email.split('@')[0];
            document.getElementById('user-email').textContent = user.email;
            if (user.photoURL) {
                document.getElementById('user-avatar').innerHTML = `<img src="${user.photoURL}" alt="avatar" style="width: 50px; height: 50px; border-radius: 50%;">`;
            }

            // Save token if we have it pending
            if (this.fcmToken) {
                this.saveTokenToDatabase(user.uid, this.fcmToken);
            }
        } else {
            loggedInView.classList.add('hidden');
            loggedOutView.classList.remove('hidden');
        }
    },

    loginWithGoogle: async function () {
        console.log("AuthService: loginWithGoogle clicked");
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await firebase.auth().signInWithPopup(provider);
            this.handleFirstTimeSync(result.user);
        } catch (error) {
            console.error(error);
            alert("خطأ في تسجيل الدخول عبر Google");
        }
    },

    loginWithEmail: async function () {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        if (!email || !password) return;

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            alert("خطأ: " + error.message);
        }
    },

    signUpWithEmail: async function () {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        if (!email || !password) return;

        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            this.handleFirstTimeSync(result.user);
        } catch (error) {
            alert("خطأ: " + error.message);
        }
    },

    logout: function () {
        firebase.auth().signOut();
    },

    handleFirstTimeSync: async function (user) {
        console.log("AuthService: Handling first time sync for", user.uid);
        const localData = localStorage.getItem(this.saveKey || 'bladeWeaver_save');
        if (!localData) {
            this.loadCloudData(user.uid);
            return;
        }

        const cloudDoc = await db.collection("users").doc(user.uid).get();
        if (!cloudDoc.exists) {
            // No cloud data, just save local to cloud
            this.saveCloudData(user.uid, JSON.parse(localData));
            return;
        }

        const cloudData = cloudDoc.data().gameData;

        // Show conflict modal
        const modal = document.getElementById('conflict-modal');
        modal.classList.remove('hidden');

        const cloudStats = `الذهب: ${cloudData.gold} | الموجة: ${cloudData.wave}`;
        document.getElementById('cloud-stats-preview').textContent = cloudStats;

        const localObj = JSON.parse(localData);
        const localStats = `الذهب: ${localObj.gold} | الموجة: ${localObj.wave}`;
        document.getElementById('local-stats-preview').textContent = localStats;

        document.getElementById('restore-cloud-btn').onclick = () => {
            Object.assign(window.gameState, cloudData);

            // Sync player name if exists in cloud
            if (cloudData.playerName && window.LeaderboardSystem) {
                window.LeaderboardSystem.initPlayer(cloudData.playerName);
                if (window.setLocalPlayerName) window.setLocalPlayerName(cloudData.playerName);
            }

            if (window.updateUI) window.updateUI();
            if (window.saveGame) window.saveGame();
            modal.classList.add('hidden');
            document.getElementById('name-modal').classList.add('hidden'); // Close name modal too
            alert("✅ تم استعادة البيانات من السحابة!");
        };

        document.getElementById('overwrite-cloud-btn').onclick = () => {
            if (confirm("⚠️ هل أنت متأكد؟ سيتم حذف بيانات السحابة القديمة نهائياً!")) {
                this.saveCloudData(user.uid, localObj);
                modal.classList.add('hidden');
                alert("✅ تم ربط الحساب وحفظ التقدم الحالي!");
            }
        };
    },

    saveCloudData: async function (uid, data) {
        if (!db) return;
        try {
            await db.collection("users").doc(uid).set({
                gameData: data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log("Cloud data saved!");
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.warn("AuthService: Cloud save permission denied.");
            } else {
                console.error("Cloud save error:", error);
            }
        }
    },

    loadCloudData: async function (uid) {
        if (!db) return;
        try {
            const doc = await db.collection("users").doc(uid).get();
            if (doc.exists) {
                const cloudData = doc.data().gameData;
                if (cloudData) {
                    console.log("AuthService: Cloud data loaded successfully");
                    Object.assign(window.gameState, cloudData);

                    // Sync player name if exists in cloud
                    if (cloudData.playerName && window.LeaderboardSystem) {
                        window.LeaderboardSystem.initPlayer(cloudData.playerName);
                        if (window.setLocalPlayerName) window.setLocalPlayerName(cloudData.playerName);
                    }

                    if (window.updateUI) window.updateUI();
                    if (window.saveGame) window.saveGame();

                    // If we are on the name modal, close it
                    const nameModal = document.getElementById('name-modal');
                    if (nameModal) nameModal.classList.add('hidden');
                }
            }
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.warn("AuthService: Cloud permissions missing. This is normal if you are not logged in or if the game is running locally without Firebase Admin access.");
                console.warn("Please log in to load cloud data.");
            } else {
                console.error("Cloud load error:", error);
            }
        }
    }
};

window.AuthService = AuthService;
