// Motion Clinic — Service Worker (Network-First)
// يضمن وصول آخر تحديث دائماً، ويعمل أوفلاين عند انقطاع الإنترنت.
const CACHE = 'mc-v10';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // نداءات البيانات الحيّة: شبكة فقط — لا تُخزَّن أبداً
  if (url.includes('supabase.co') || url.includes('anthropic.com')) return;

  // باقي الملفات: الشبكة أولاً، والكاش احتياطي عند انقطاع الإنترنت
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
