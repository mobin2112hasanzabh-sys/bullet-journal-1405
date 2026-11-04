const CACHE_VERSION = 'bullet-journal-shell-v3';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(SHELL_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('bullet-journal-') && key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // درخواست‌های ورود، ثبت‌نام و اطلاعات کاربر هرگز cache نمی‌شوند.
  if (url.hostname === 'bj-api.mobin2112hasanzabh.workers.dev' || url.pathname.includes('/data/')) return;

  // برای صفحه اصلی: شبکه در اولویت، نسخه cache شده در زمان قطع اینترنت.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put('./index.html', response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  // فایل‌های ثابت: cache-first و ذخیره پاسخ موفق برای مراجعه بعدی.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        return new Response('این بخش در حالت آفلاین در دسترس نیست.', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }

  // کتابخانه‌ها و فونت‌های CDN پس از اولین بارگذاری موفق برای استفاده بعدی cache می‌شوند.
  if (['fonts.googleapis.com', 'fonts.gstatic.com', 'code.jquery.com', 'cdn.jsdelivr.net'].includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
        return response;
      } catch (_) {
        return cached || new Response('', {status: 503});
      }
    })());
  }
});
