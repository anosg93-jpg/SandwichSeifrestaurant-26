const CACHE_NAME = 'seef-sandwich-v11'; // غير رقم الـ v1 إلى v2 أو v3 كل ما ترفع تعديل كبير لتجبر الكاش على التحديث فوراً
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  'images/logoseef.png'
];

// تثبيت السيرفر وركر وحفظ الملفات الأساسية في الكاش ليكون سريع جداً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // تفعيل السيرفر وركر الجديد فوراً بدون انتظار إغلاق التطبيق
  self.skipWaiting();
});

// تنظيف الكاش القديم عند تفعيل السيرفر وركر الجديد
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('جاري حذف الكاش القديم...', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // السيطرة على العميل (الزبون) فوراً
  self.clients.claim();
});

// استراتيجية جلب البيانات (عرض من الكاش سريعاً، ثم التحديث من السيرفر في الخلفية لضمان وصول الجديد للزبون)
self.addEventListener('fetch', (event) => {
  // عدم عمل كاش لطلبات الـ CSV (المنيو المربوط بجوجل شيت) أو الـ WhatsApp عشان يفضلوا دايماً لايف ومتحدثين
  if (event.request.url.includes('docs.google.com') || event.request.url.includes('wa.me')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // إذا كانت الاستجابة صالحة، احفظ نسخة محدثة في الكاش للخلفية
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // في حال انقطاع الإنترنت تماماً
          return cachedResponse;
        });

        // رجّع الكاش فوراً للسرعة، وفي الخلفية الكود اللي فوق هيجيب الجديد من السيرفر
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
