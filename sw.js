// Nama cache unik untuk aplikasi Anda. Ubah jika Anda melakukan pembaruan besar.
const CACHE_NAME = 'database-aps-cache-v1';

// Daftar file yang akan disimpan di cache untuk penggunaan offline.
const urlsToCache = [
  '/',
  'databaseaps.html', // File HTML utama Anda
  'favicon/site.webmanifest',
  'favicon/favicon.ico',
  'favicon/apple-touch-icon.png',
  'favicon/web-app-manifest-192x192.png',
  'favicon/web-app-manifest-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
];

// Event 'install': Dipanggil saat service worker pertama kali diinstal.
self.addEventListener('install', event => {
  // Tunggu sampai proses caching selesai sebelum melanjutkan.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka');
        // Menambahkan semua URL yang ditentukan ke dalam cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// Event 'fetch': Dipanggil setiap kali halaman meminta sebuah resource (file, gambar, dll).
self.addEventListener('fetch', event => {
  event.respondWith(
    // Coba cari resource yang diminta di dalam cache terlebih dahulu.
    caches.match(event.request)
      .then(response => {
        // Jika resource ditemukan di cache, kembalikan dari cache.
        if (response) {
          return response;
        }
        // Jika tidak ada di cache, coba ambil dari jaringan (internet).
        return fetch(event.request);
      })
  );
});

// Event 'activate': Membersihkan cache lama.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

