
// Give the service worker access to Firebase Messaging.
// Note: These scripts (firebase-app and firebase-messaging) must be imported in the service worker.
// Using the same versions as in index.html is good practice.
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "AIzaSyAt9btmSvevwIwq1w-3-KTAj-4AwNP2Nwg",
    authDomain: "bladeweaver-01.firebaseapp.com",
    projectId: "bladeweaver-01",
    storageBucket: "bladeweaver-01.firebasestorage.app",
    messagingSenderId: "594542811468",
    appId: "1:594542811468:web:096481dd93575c4c8e57e9",
    measurementId: "G-08113D2VM5"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192.png' // Ensure this icon exists or use a valid path
    };

    // In-game notifications are disabled to avoid interrupting gameplay.
    return;
});
