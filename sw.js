const CACHE_NAME = 'blade-weaver-v1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './game.js',
    './admin.js',
    './ads.js',
    './arena.js',
    './auth.js',
    './leaderboard.js',
    './missions.js',
    './nameModal.js',
    './referral.js',
    './rewards.js',
    './tutorial.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cairo:wght@400;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
