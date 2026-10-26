const CACHE_NAME = 'bj-cache-v3'; // نسخه رو تغییر دادم تا کش قدیمی پاک بشه
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/css/persian-datepicker.min.css',
  'https://cdn.jsdelivr.net/npm/persian-date@1.1.0/dist/persian-date.min.js',
  'https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/js/persian-datepicker.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // دانلود تک تک فایل‌ها به صورت جداگانه (اگر یکی خراب بود، بقیه لود بشن)
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn('Failed to cache:', url, err);
          });
        })
      );
    }).then(() => self.skipWaiting()) // فعال‌سازی فوری
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // درخواست‌های مربوط به API یا متدهای غیر GET (مثل ذخیره داده‌ها) کش نشن
  if (event.request.method !== 'GET' || event.request.url.includes('workers.dev')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      // اگر در کش بود، از کش بیار (سرعت بالا)، اگر نبود از اینترنت بگیر
      return response || fetch(event.request);
    })
  );
});