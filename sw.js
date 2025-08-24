// Nama cache unik. Ubah nama ini jika Anda membuat perubahan besar pada file aplikasi.
const CACHE_NAME = 'database-aps-soetta-v1';

// Daftar file yang akan disimpan di cache saat pertama kali dibuka.
const URLS_TO_CACHE = [
  '/', // Ini akan merujuk ke file HTML utama Anda jika namanya index.html
  'index.html', // Tambahkan nama file HTML Anda secara eksplisit
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Event 'install': Dipanggil saat Service Worker pertama kali diinstal.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then((cache) => {
      console.log('Cache dibuka, menambahkan file inti aplikasi');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Event 'fetch': Dipanggil setiap kali aplikasi meminta sebuah resource (file, gambar, dll).
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 1. Coba cari resource di cache terlebih dahulu.
    caches.match(event.request)
    .then((response) => {
      // Jika resource ditemukan di cache, kembalikan dari cache.
      if (response) {
        return response;
      }
      
      // 2. Jika tidak ada di cache, coba ambil dari jaringan (internet).
      return fetch(event.request);
    })
  );
});