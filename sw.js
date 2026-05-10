// Self-unregistering service worker — rimuove se stesso e lascia passare tutto
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(self.registration.unregister());
});
