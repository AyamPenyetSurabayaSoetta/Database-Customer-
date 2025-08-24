// Nama cache unik. Ubah nama ini jika Anda membuat perubahan besar pada file aplikasi.
const CACHE_NAME = 'database-aps-soetta-v2';

// Daftar lengkap file yang akan disimpan di cache untuk penggunaan offline.
const URLS_TO_CACHE = [
  '/',
  'index.html', // Nama file HTML utama Anda
  
  // File dari folder 'favicon'
  'favicon/site.webmanifest',
  'favicon/favicon.ico',
  'favicon/favicon.svg',
  'favicon/apple-touch-icon.png',
  'favicon/favicon-96x96.png',
  'favicon/web-app-manifest-192x192.png',
  'favicon/web-app-manifest-512x512.png',

  // File eksternal (CDN) yang digunakan aplikasi Anda
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
];

// Event 'install': Dipanggil saat Service Worker pertama kali diinstal.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('Cache dibuka, menambahkan file inti aplikasi');
      // fetch(request, { cache: "reload" }) digunakan untuk memastikan file dari CDN selalu yang terbaru saat instalasi.
      const cachePromises = URLS_TO_CACHE.map(url => {
          const request = new Request(url, { cache: 'reload' });
          return fetch(request).then(response => {
              if (response.status === 200) {
                  return cache.put(url, response);
              }
          }).catch(err => console.warn(`Gagal cache ${url}:`, err));
      });
      return Promise.all(cachePromises);
    })
  );
});

// Event 'fetch': Dipanggil setiap kali aplikasi meminta sebuah resource.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
    .then((response) => {
      // Jika resource ditemukan di cache, kembalikan dari cache.
      // Jika tidak, ambil dari jaringan.
      return response || fetch(event.request);
    })
  );
});

// Event 'activate': Membersihkan cache lama yang tidak digunakan lagi.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});