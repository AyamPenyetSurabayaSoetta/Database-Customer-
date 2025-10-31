        let displayedDate = new Date();
        const updateMonthDisplay = () => {
            const displayEl = document.getElementById('month-display');
            const nextBtn = document.getElementById('next-month-btn');
            if (!displayEl || !nextBtn) return;
            
            displayEl.textContent = displayedDate.toLocaleDateString('id-ID', {
                month: 'long',
                year: 'numeric'
            });
            
            const now = new Date();
            const isCurrentOrFutureMonth = displayedDate.getFullYear() > now.getFullYear() ||
                (displayedDate.getFullYear() === now.getFullYear() && displayedDate.getMonth() >= now.getMonth());
            
            nextBtn.disabled = isCurrentOrFutureMonth;
            nextBtn.classList.toggle('opacity-50', isCurrentOrFutureMonth);
            nextBtn.classList.toggle('cursor-not-allowed', isCurrentOrFutureMonth);
        };
        const HIGH_QUALITY_LOGO_URL = "favicon/logo-faktur.png";
        
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
        import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
        import { getFirestore, collection, onSnapshot, doc, addDoc, setDoc, deleteDoc, updateDoc, query, orderBy, serverTimestamp, writeBatch, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
        
        const firebaseConfig = {
            apiKey: "AIzaSyDqvDqNWOu80VwrtJCnUgPewztWXDEx52o",
            authDomain: "database-f3684.firebaseapp.com",
            projectId: "database-f3684",
            storageBucket: "database-f3684.firebasestorage.app",
            messagingSenderId: "378595640412",
            appId: "1:378595640412:web:c18e3ccde798cad320d299",
            measurementId: "G-Z67FJLC8X3"
        };
        
        const companyInfo = { name: "Ayam Penyet Surabaya", address: "Jl. Soekarno Hatta no. 725A", city: "Kota Bandung, 40286", phone: "0811-6594-527", email: "ayampenyetsurabaya725@gmail.com" };
        // 
        const companyLogoUrl = "favicon/logo-faktur.png";
        const ATTENDANCE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMEmykWQdLjTOEvqwRpbNcoK9fXHrE6reNIBMrP27JajZ7A_X9Yj3mAsO0Fm5EiCBW/exec";
        let state = { contacts: [], inventory: [], transactions: [], customerOrders: [], monthlyExpenses: [], checklistHistory: [], dailyReports: [], reservations: [] };
        let salesChart, expensesChart;
        let omsetTrendChart;
        let monthlyTurnoverChart;
        let toastTimer;
        let turnoverChartSelectedWeek = 0;
        let calculatedDailyData = {};
        let reservationFilter = { date: null, status: '', searchTerm: '' };
        
        const OFFICE_COORDS = { lat: -6.9385360, lon: 107.6662661 };
        
        const ALLOWED_RADIUS_KM = 0.1;
        const SHIFT_TIMES = {
            'PAGI': { hour: 7, minute: 40, grace: 0 },
            'SIANG': { hour: 12, minute: 5, grace: 0 },
            'MALAM': { hour: 13, minute: 40, grace: 0 }
        };
        
        /**
         * Fungsi untuk menghitung jarak antara dua koordinat GPS (Haversine Formula).
         * @returns {number} Jarak dalam kilometer.
         */
        const haversineDistance = (coords1, coords2) => {
            const toRad = (x) => x * Math.PI / 180;
            const R = 6371; // Radius bumi dalam km
            
            const dLat = toRad(coords2.lat - coords1.lat);
            const dLon = toRad(coords2.lon - coords1.lon);
            const lat1 = toRad(coords1.lat);
            const lat2 = toRad(coords2.lat);
            
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            
            return R * c;
        };
        
        
        let broadcastQueue = [];
        let currentBroadcastIndex = 0;
        let broadcastMessageTemplate = '';
        
        const getWeekOfMonth = (date) => {
            const day = date.getDate();
            if (day <= 7) return 1;
            if (day <= 14) return 2;
            if (day <= 21) return 3;
            return 4;
        };
        let chartSelectedWeek = getWeekOfMonth(new Date());
        
        const monthMap = {
            "Januari": 0,
            "Februari": 1,
            "Maret": 2,
            "April": 3,
            "Mei": 4,
            "Juni": 5,
            "Juli": 6,
            "Agustus": 7,
            "September": 8,
            "Oktober": 9,
            "November": 10,
            "Desember": 11
            
        };
        const formatCompactNumber = (value) => {
            if (value >= 1000000) {
                return (value / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt';
            }
            if (value >= 1000) {
                return (value / 1000).toLocaleString('id-ID') + 'rb';
            }
            return value.toString();
        };
        const formatCurrencyShort = (amount) => {
            if (amount >= 1000000) {
                return 'Rp ' + (amount / 1000000).toFixed(1).replace('.', ',') + ' jt';
            }
            if (amount >= 1000) {
                return 'Rp ' + (amount / 1000).toFixed(1).replace('.', ',') + ' rb';
            }
            return formatCurrency(amount);
        };
        const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
        const formatDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
        const formatFullDate = (timestamp) => timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const showToast = (message) => {
            const toast = document.getElementById('toast');
            if (toastTimer) clearTimeout(toastTimer);
            toast.textContent = message;
            toast.classList.add('show');
            toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
        };
        
        const formatWhatsappNumber = (phone) => {
            if (!phone) return '';
            let formatted = phone.replace(/\D/g, '');
            if (formatted.startsWith('0')) {
                formatted = '62' + formatted.substring(1);
            } else if (!formatted.startsWith('62')) {
                if (formatted.length > 5) {
                    formatted = '62' + formatted;
                }
            }
            return formatted;
        };
        
        const exportToCsv = (filename, headers, data) => {
            let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
            csvContent += data.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        };
        
        const parseDailyReport = (rawText) => {
            const report = {
                date: null,
                grandTotal: 0,
                totalNaskot: 0,
                restaurants: {
                    "Ayam Penyet Surabaya": { total: 0, phones: {} },
                    "Mie Jogja": { total: 0, phones: {} }
                }
            };
            
            const lines = rawText.trim().split('\n').map(line => line.trim()).filter(Boolean);
            const parseNumber = (str) => parseInt(String(str).replace(/[.,Rp\sbox]/g, ''), 10) || 0;
            
            let dateFound = false;
            lines.forEach(line => {
                if (!dateFound) {
                    const dateMatch = line.match(/(\d{1,2}\s\w+\s\d{4})/);
                    if (dateMatch) {
                        const [day, monthName, year] = dateMatch[1].split(' ');
                        const monthIndex = Object.keys(monthMap).findIndex(m => m.toLowerCase() === monthName.toLowerCase());
                        if (monthIndex > -1) {
                            const jsDate = new Date(year, monthIndex, day);
                            report.date = Timestamp.fromDate(jsDate);
                            dateFound = true;
                        }
                    }
                }
                const totalMatch = line.match(/^\*Total\s*:\s*\*\s*([\d.,]+)/i);
                if (totalMatch) {
                    report.grandTotal = parseNumber(totalMatch[1]);
                }
                const naskotMatch = line.match(/^\*total naskot\*\s*:\s*(\d+)/i);
                if (naskotMatch) {
                    report.totalNaskot = parseNumber(naskotMatch[1]);
                }
            });
            
            if (!dateFound) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                report.date = Timestamp.fromDate(today);
            }
            
            let currentRestaurantKey = null;
            let currentPhoneKey = null;
            
            for (const line of lines) {
                if (line.toLowerCase().includes('ayam penyet surabaya')) {
                    currentRestaurantKey = "Ayam Penyet Surabaya";
                    currentPhoneKey = null;
                    continue;
                }
                if (line.toLowerCase().includes('mie jogja')) {
                    currentRestaurantKey = "Mie Jogja";
                    currentPhoneKey = null;
                    continue;
                }
                
                if (!currentRestaurantKey) {
                    continue;
                }
                
                const hpMatch = line.match(/^(Hp\d+)\s*:\s*([\d.,]+)/);
                if (hpMatch) {
                    currentPhoneKey = hpMatch[1];
                    const phoneTotal = parseNumber(hpMatch[2]);
                    report.restaurants[currentRestaurantKey].phones[currentPhoneKey] = {
                        total: phoneTotal,
                        "Makan ditempat": 0,
                        "Naskot": 0,
                        "Online": 0
                    };
                    continue;
                }
                
                const categoryMatch = line.match(/^-\s*([A-Za-z\s]+)\s*:\s*([\d.,]+)/);
                if (categoryMatch) {
                    if (!currentPhoneKey) continue;
                    
                    const categoryName = categoryMatch[1].trim();
                    const categoryValue = parseNumber(categoryMatch[2]);
                    
                    if (report.restaurants[currentRestaurantKey].phones[currentPhoneKey].hasOwnProperty(categoryName)) {
                        report.restaurants[currentRestaurantKey].phones[currentPhoneKey][categoryName] = categoryValue;
                    }
                }
            }
            
            for (const key in report.restaurants) {
                const restaurant = report.restaurants[key];
                restaurant.total = Object.values(restaurant.phones).reduce((sum, phone) => sum + phone.total, 0);
            }
            
            const hasAyamPenyetData = report.restaurants["Ayam Penyet Surabaya"].total > 0;
            const hasMieJogjaData = report.restaurants["Mie Jogja"].total > 0;
            if (!hasAyamPenyetData && !hasMieJogjaData) {
                throw new Error("Tidak ada data penjualan yang dapat dibaca. Cek kembali format teks Anda.");
            }
            
            return report;
        };
        
        const renderFunctions = {
            renderReservations: () => {
                const listEl = document.getElementById('reservation-list');
                if (!listEl) return;
                
                const selectedDate = reservationFilter.date;
                let filteredReservations = state.reservations;
                
                if (selectedDate) {
                    const startOfDay = new Date(selectedDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(selectedDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    filteredReservations = state.reservations.filter(res => {
                        const resDate = res.reservationDate.toDate();
                        return resDate >= startOfDay && resDate <= endOfDay;
                    });
                }
                
                filteredReservations.sort((a, b) => b.reservationDate.seconds - a.reservationDate.seconds);
                
                listEl.innerHTML = '';
                if (filteredReservations.length === 0) {
                    listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Reservasi Tidak Ditemukan</h3><p class="mt-1 text-sm text-gray-500">Tidak ada data untuk tanggal yang dipilih.</p></div>`;
                } else {
                    filteredReservations.forEach(res => {
                        const el = document.createElement('div');
                        el.className = 'p-4 border rounded-lg';
                        const resDate = res.reservationDate.toDate();
                        const dateString = resDate.toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                        const timeString = res.reservationTime || '';
                        const statusStyles = { confirmed: 'bg-blue-100 text-blue-800', arrived: 'bg-green-100 text-green-800', completed: 'bg-gray-200 text-gray-700', cancelled: 'bg-red-100 text-red-800' };
                        const statusText = { confirmed: 'Dikonfirmasi', arrived: 'Telah Tiba', completed: 'Selesai', cancelled: 'Dibatalkan' };
                        const statusBadge = `<span class="px-2 py-1 text-xs font-medium rounded-full ${statusStyles[res.status] || ''}">${statusText[res.status] || res.status}</span>`;
                        let actionButtons = '';
                        if (res.status === 'confirmed') { actionButtons = `<button data-id="${res.id}" class="mark-arrived-btn w-full bg-green-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold">Tandai Tiba</button>`; }
                        else if (res.status === 'arrived') { actionButtons = `<button data-id="${res.id}" class="mark-completed-btn w-full bg-gray-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold">Tandai Selesai</button>`; }
                        let managementButtons = '';
                        if (res.status === 'confirmed' || res.status === 'arrived') { managementButtons = `<button data-id="${res.id}" class="edit-reservation-btn text-sm font-bold text-blue-600">EDIT</button><button data-id="${res.id}" class="cancel-reservation-btn text-sm font-bold text-orange-600">BATAL</button>`; }
                        el.innerHTML = `<div class="flex justify-between items-start"><div><p class="font-bold text-lg">${res.customerName}</p><p class="text-sm text-gray-600">${res.customerPhone || 'No. Tlp tidak ada'}</p><p class="text-sm text-gray-600 mt-1">${res.numberOfGuests} orang</p></div><div class="text-right flex-shrink-0 ml-4"><p class="font-semibold">${dateString}</p><p class="text-sm font-medium text-emerald-600">${timeString}</p><div class="mt-2">${statusBadge}</div></div></div>${res.notes ? `<div class="mt-2 pt-2 border-t text-sm text-gray-500"><strong>Catatan:</strong> ${res.notes}</div>` : ''}<div class="mt-4 pt-3 border-t flex items-center justify-between"><div class="flex-grow pr-4">${actionButtons}</div><div class="flex-shrink-0 flex gap-3">${managementButtons}<button data-id="${res.id}" class="delete-reservation-btn text-sm font-bold text-red-600">HAPUS</button></div></div>`;
                        listEl.appendChild(el);
                    });
                }
            },
            renderContactList: () => {
                const listEl = document.getElementById('contact-list');
                listEl.innerHTML = '';
                const whatsappSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 16 16" fill="currentColor"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>`;
                const searchTerm = document.getElementById('contactSearchInput')?.value.toLowerCase() || '';
                const filteredContacts = state.contacts.filter(contact => {
                    const nameMatch = contact.name.toLowerCase().includes(searchTerm);
                    const phoneMatch = contact.phone && contact.phone.toLowerCase().includes(searchTerm);
                    const addressMatch = contact.address && contact.address.toLowerCase().includes(searchTerm);
                    return nameMatch || phoneMatch || addressMatch;
                });
                if (filteredContacts.length === 0) {
                    listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a4 4 0 110-5.292" /></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Pelanggan tidak ditemukan</h3><p class="mt-1 text-sm text-gray-500">Coba kata kunci lain atau tambahkan pelanggan baru.</p></div>`;
                } else {
                    filteredContacts.forEach(contact => {
                        const item = document.createElement('div');
                        item.className = 'p-3 border rounded-lg flex justify-between items-center';
                        const whatsappNumber = formatWhatsappNumber(contact.phone);
                        const whatsappButton = whatsappNumber ? `<a href="https://wa.me/${whatsappNumber}" target="_blank" class="text-green-600 hover:text-green-700" title="Kirim WhatsApp">${whatsappSvgIcon}</a>` : '';
                        item.innerHTML = `
                            <div class="flex-grow flex items-center gap-3">
                                <input type="checkbox" data-id="${contact.id}" class="contact-checkbox h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0">
                                <div class="flex-grow">
                                    <p class="font-bold">${contact.name}</p>
                                    <p class="text-sm text-gray-500">${contact.phone || '-'}</p>
                                    <p class="text-xs text-gray-400 mt-1">${contact.address || 'Alamat tidak tersedia'}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3 flex-shrink-0">
                                ${whatsappButton}
                                <button data-id="${contact.id}" class="edit-contact-btn text-blue-500 font-semibold text-sm">Edit</button>
                                <button data-id="${contact.id}" class="delete-contact-btn text-red-500 font-semibold text-sm">Hapus</button>
                            </div>`;
                        listEl.appendChild(item);
                    });
                }
            },
            renderInventoryList: () => {
                const listEl = document.getElementById('inventory-list');
                listEl.innerHTML = '';
                if (state.inventory.length === 0) { listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Menu kosong</h3><p class="mt-1 text-sm text-gray-500">Tambahkan item untuk mengelolanya.</p></div>`; } else {
                    state.inventory.forEach(item => {
                        const el = document.createElement('div');
                        el.className = 'p-3 border rounded-lg flex justify-between items-center';
                        el.innerHTML = `<div><p class="font-bold">${item.name}</p></div><div class="text-right"><p class="font-semibold">${formatCurrency(item.price)}</p><div class="space-x-2"><button data-id="${item.id}" class="edit-item-btn text-xs text-blue-500 font-semibold">Edit</button><button data-id="${item.id}" class="delete-item-btn text-xs text-red-500 font-semibold">Hapus</button></div></div>`;
                        listEl.appendChild(el);
                    });
                }
            },
            renderSalesReport: () => {
                const listEl = document.getElementById('sales-report-list');
                const monthFilterEl = document.getElementById('salesMonthFilter');
                listEl.innerHTML = '';
                const sales = state.transactions.filter(tx => tx.type === 'sale');
                const availableMonths = [...new Set(sales.map(sale => new Date(sale.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' })))].sort((a, b) => new Date(b.split(' ')[1], monthMap[b.split(' ')[0]]) - new Date(a.split(' ')[1], monthMap[a.split(' ')[0]]));
                const currentFilterValue = monthFilterEl.value;
                monthFilterEl.innerHTML = '<option value="">Semua Bulan</option>';
                availableMonths.forEach(month => monthFilterEl.add(new Option(month, month)));
                monthFilterEl.value = currentFilterValue;
                const searchTerm = document.getElementById('salesSearchInput').value.toLowerCase();
                const selectedMonth = monthFilterEl.value;
                const filteredSales = sales.filter(tx => (!selectedMonth || new Date(tx.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth) && (!searchTerm || (tx.contactName && tx.contactName.toLowerCase().includes(searchTerm))));
                if (filteredSales.length === 0) { listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada penjualan</h3><p class="mt-1 text-sm text-gray-500">Tidak ada data yang cocok dengan filter Anda.</p></div>`; return; }
                const salesByMonth = filteredSales.reduce((acc, sale) => {
                    const monthYear = new Date(sale.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                    if (!acc[monthYear]) { acc[monthYear] = { sales: [], total: 0 }; } acc[monthYear].sales.push(sale);
                    acc[monthYear].total += sale.total;
                    return acc;
                }, {});
                Object.keys(salesByMonth).sort((a, b) => new Date(b.split(' ')[1], monthMap[b.split(' ')[0]]) - new Date(a.split(' ')[1], monthMap[a.split(' ')[0]])).forEach(month => {
                    const monthData = salesByMonth[month];
                    const monthEl = document.createElement('div');
                    monthEl.className = 'border rounded-lg';
                    const salesHtml = monthData.sales.map(sale => `<li class="flex justify-between items-start py-3 px-3 border-b last:border-b-0"><div class="flex-1"><p class="font-medium">Penjualan ke ${sale.contactName}</p><p class="text-xs text-gray-500">${formatDate(sale.date)}</p><div class="mt-2 space-x-2"><button data-id="${sale.id}" class="invoice-btn text-xs font-bold text-green-600">FAKTUR</button><button data-id="${sale.id}" class="invoice-paid-btn text-xs font-bold text-blue-600">FAKTUR (LUNAS)</button><button data-id="${sale.id}" class="delete-tx-btn text-xs font-bold text-red-600">HAPUS</button></div></div><p class="font-semibold text-green-600 ml-4 whitespace-nowrap">${formatCurrency(sale.total)}</p></li>`).join('');
                    monthEl.innerHTML = `<header class="bg-gray-50 p-3 rounded-t-lg flex justify-between items-center"><h3 class="font-bold text-lg">${month}</h3><p class="font-bold text-green-700">${formatCurrency(monthData.total)}</p></header><ul class="divide-y">${salesHtml}</ul>`;
                    listEl.appendChild(monthEl);
                });
            },
            renderOrderList: () => {
                const listEl = document.getElementById('order-list');
                listEl.innerHTML = '';
                const pendingOrders = state.customerOrders.filter(o => o.status === 'pending');
                if (pendingOrders.length === 0) {
                    listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada pesanan aktif</h3><p class="mt-1 text-sm text-gray-500">Tambahkan pesanan pelanggan baru.</p></div>`;
                } else {
                    pendingOrders.forEach(order => {
                        const itemsHtml = order.items.map(item => `<li>${item.qty}x ${item.name}</li>`).join('');
                        const item = document.createElement('div');
                        item.className = 'p-4 border rounded-lg space-y-3';
                        
                        const discountInfo = order.discountAmount > 0 ?
                            ` <div class="flex justify-between items-center text-sm">
                        <p class="text-red-600">Diskon</p>
                        <p class="font-semibold text-red-600">-${formatCurrency(order.discountAmount)}</p>
                    </div>` :
                            '';
                        
                        const totalSectionHtml = `
                <div class="space-y-1 pt-3 border-t">
                    <div class="flex justify-between items-center text-sm">
                        <p class="text-gray-600">Subtotal</p>
                        <p class="font-semibold">${formatCurrency(order.subtotal || order.total)}</p>
                    </div>
                    ${discountInfo}
                    <div class="flex justify-between items-center pt-1 mt-1 border-t">
                        <p class="font-bold text-lg">Total</p>
                        <p class="font-bold text-lg">${formatCurrency(order.total)}</p>
                    </div>
                </div>
            `;
                        
                        item.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold text-lg">${order.contactName}</p>
                        <p class="text-sm text-gray-600">Alamat: ${order.alamat || '-'}</p>
                    </div>
                    <p class="text-xs text-gray-500">${formatDate(order.orderDate)}</p>
                </div>
                <div class="text-sm space-y-1 pt-2 border-t">
                    <p class="font-medium">Detail Pesanan:</p>
                    <ul class="list-disc pl-5 text-gray-700">${itemsHtml}</ul>
                </div>
                ${totalSectionHtml} 
                <div class="text-right space-x-2">
                    <button data-id="${order.id}" class="delete-order-btn text-xs font-bold text-red-600">HAPUS</button>
                    <button data-id="${order.id}" class="create-invoice-from-order-btn text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-md">BUAT FAKTUR</button>
                </div>`;
                        listEl.appendChild(item);
                    });
                }
            },
            renderExpenseReport: () => {
                const listEl = document.getElementById('expense-report-list');
                const monthFilterEl = document.getElementById('expenseMonthFilter');
                listEl.innerHTML = '';
                const availableMonths = [...new Set(state.monthlyExpenses.map(ex => new Date(ex.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' })))].sort((a, b) => new Date(b.split(' ')[1], monthMap[b.split(' ')[0]]) - new Date(a.split(' ')[1], monthMap[a.split(' ')[0]]));
                const currentFilterValue = monthFilterEl.value;
                monthFilterEl.innerHTML = '<option value="">Semua Bulan</option>';
                availableMonths.forEach(month => monthFilterEl.add(new Option(month, month)));
                monthFilterEl.value = currentFilterValue;
                const selectedMonth = monthFilterEl.value;
                const filteredExpenses = state.monthlyExpenses.filter(ex => !selectedMonth || new Date(ex.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth);
                if (filteredExpenses.length === 0) { listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada belanja</h3><p class="mt-1 text-sm text-gray-500">Catat item belanja baru melalui tombol (+).</p></div>`; return; }
                const expensesByMonth = filteredExpenses.reduce((acc, expense) => {
                    const date = new Date(expense.date.seconds * 1000);
                    const monthYear = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                    if (!acc[monthYear]) { acc[monthYear] = { items: [], total: 0 }; } acc[monthYear].items.push(expense);
                    acc[monthYear].total += expense.total;
                    return acc;
                }, {});
                Object.keys(expensesByMonth).sort((a, b) => new Date(b.split(' ')[1], monthMap[b.split(' ')[0]]) - new Date(a.split(' ')[1], monthMap[a.split(' ')[0]])).forEach(month => {
                    const monthData = expensesByMonth[month];
                    const monthEl = document.createElement('div');
                    monthEl.className = 'border rounded-lg';
                    const itemsHtml = monthData.items.map(item => `<li class="flex justify-between items-center py-2 border-b last:border-b-0"><div><p class="font-medium">${item.itemName} (${item.quantity})</p><p class="text-xs text-gray-500">${formatDate(item.date)} - <strong>${item.storeName || 'N/A'}</strong></p></div><div class="flex items-center gap-4"><p class="font-semibold text-red-600">${formatCurrency(item.total)}</p><button data-id="${item.id}" class="delete-expense-btn text-red-500 text-2xl font-bold">&times;</button></div></li>`).join('');
                    monthEl.innerHTML = `<header class="bg-gray-50 p-3 rounded-t-lg flex justify-between items-center"><h3 class="font-bold text-lg">${month}</h3><p class="font-bold text-red-700">${formatCurrency(monthData.total)}</p></header><ul class="p-3">${itemsHtml}</ul>`;
                    listEl.appendChild(monthEl);
                });
            },
            renderCustomerSummary: () => {
                const listEl = document.getElementById('customer-summary-list');
                const monthFilterEl = document.getElementById('customer-summary-month-filter');
                if (!listEl || !monthFilterEl) return;
                
                listEl.innerHTML = '';
                const allSales = state.transactions.filter(tx => tx.type === 'sale');
                
                const availableMonths = [...new Set(allSales.map(sale => new Date(sale.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' })))].sort((a, b) => new Date(b.split(' ')[1], monthMap[b.split(' ')[0]]) - new Date(a.split(' ')[1], monthMap[a.split(' ')[0]]));
                const currentFilterValue = monthFilterEl.value;
                monthFilterEl.innerHTML = '<option value="">Tampilkan Semua Bulan</option>';
                availableMonths.forEach(month => monthFilterEl.add(new Option(month, month)));
                monthFilterEl.value = currentFilterValue;
                
                const selectedMonth = monthFilterEl.value;
                const salesToProcess = selectedMonth ?
                    allSales.filter(tx => new Date(tx.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth) :
                    allSales;
                
                if (salesToProcess.length === 0) {
                    listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Belum ada data penjualan</h3><p class="mt-1 text-sm text-gray-500">Tidak ada data penjualan pada periode yang dipilih.</p></div>`;
                    return;
                }
                
                const summary = salesToProcess.reduce((acc, sale) => {
                    const id = sale.contactId;
                    if (!acc[id]) {
                        acc[id] = { id: id, name: sale.contactName, purchaseCount: 0, totalSpent: 0, lastPurchaseDate: null };
                    }
                    acc[id].purchaseCount += 1;
                    acc[id].totalSpent += sale.total;
                    if (!acc[id].lastPurchaseDate || sale.date.seconds > acc[id].lastPurchaseDate.seconds) {
                        acc[id].lastPurchaseDate = sale.date;
                    }
                    return acc;
                }, {});
                
                const sortedSummary = Object.values(summary).sort((a, b) => b.totalSpent - a.totalSpent);
                sortedSummary.forEach((customer, index) => {
                    const el = document.createElement('div');
                    el.className = 'p-3 border rounded-lg';
                    el.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                               <span class="font-bold text-gray-400 w-6 text-center">${index + 1}</span>
                               <div>
                                   <p class="font-bold">${customer.name}</p>
                                   <p class="text-sm text-gray-500">Terakhir beli: ${formatDate(customer.lastPurchaseDate)}</p>
                               </div>
                            </div>
                            <div class="text-right">
                               <p class="font-semibold text-green-600">${formatCurrency(customer.totalSpent)}</p>
                               <p class="text-xs text-gray-500">${customer.purchaseCount}x transaksi</p>
                            </div>
                        </div>
                        <div class="text-right mt-2 pt-2 border-t">
                            <button data-id="${customer.id}" class="view-customer-details-btn text-xs font-bold text-blue-600">LIHAT DETAIL</button>
                        </div>`;
                    listEl.appendChild(el);
                });
            },
            renderCompletedOrderList: () => {
                const listEl = document.getElementById('completed-orders-list');
                if (!listEl) return;
                listEl.innerHTML = '';
                let completedOrders = state.customerOrders.filter(o => o.status === 'completed');
                const searchTerm = document.getElementById('completedOrderSearchInput')?.value.toLowerCase() || '';
                if (searchTerm) {
                    completedOrders = completedOrders.filter(order => {
                        const nameMatch = order.contactName.toLowerCase().includes(searchTerm);
                        const itemMatch = order.items.some(item => item.name.toLowerCase().includes(searchTerm));
                        return nameMatch || itemMatch;
                    });
                }
                if (completedOrders.length === 0) {
                    listEl.innerHTML = `<div class="text-center py-8"><p class="text-sm text-gray-500">Tidak ada pesanan selesai yang cocok.</p></div>`;
                    return;
                }
                completedOrders.forEach(order => {
                    const matchingTransaction = state.transactions.find(tx => tx.type === 'sale' && tx.contactId === order.contactId && tx.total === order.total && tx.date && order.orderDate && tx.date.seconds === order.orderDate.seconds);
                    const itemsHtml = order.items.map(item => `<li>${item.qty}x ${item.name}</li>`).join('');
                    const item = document.createElement('div');
                    item.className = 'p-3 border rounded-lg bg-gray-50/70';
                    item.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold">${order.contactName}</p>
                    <p class="text-sm text-gray-500">${formatCurrency(order.total)}</p>
                </div>
                <p class="text-xs text-gray-500">${formatDate(order.orderDate)}</p>
            </div>
            <div class="text-sm space-y-1 mt-2 pt-2 border-t">
                <ul class="list-disc pl-5 text-gray-600 text-xs">${itemsHtml}</ul>
            </div>
            ${matchingTransaction ?
            `<div class="text-right mt-3 pt-3 border-t flex justify-end items-center gap-4">
                <button data-id="${matchingTransaction.id}" class="reprint-invoice-btn text-xs font-bold text-blue-600">Faktur Tagihan</button>
                <button data-id="${matchingTransaction.id}" class="reprint-invoice-paid-btn text-xs font-bold text-green-600">Faktur Lunas</button>
                <button data-order-id="${order.id}" data-transaction-id="${matchingTransaction.id}" class="delete-completed-order-btn text-xs font-bold text-red-600">HAPUS</button>
            </div>`
            : ''}
        `;
                    listEl.appendChild(item);
                });
            },
            renderCompletedOrderFilters: () => {
                const monthFilterEl = document.getElementById('completedOrderMonthFilter');
                if (!monthFilterEl) return;
                const completedOrders = state.customerOrders.filter(o => o.status === 'completed');
                const availableMonths = [...new Set(completedOrders.map(order => new Date(order.orderDate.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' })))].sort((a, b) => new Date(b.split(' ')[1], monthMap[b.split(' ')[0]]) - new Date(a.split(' ')[1], monthMap[a.split(' ')[0]]));
                const currentFilterValue = monthFilterEl.value;
                monthFilterEl.innerHTML = '<option value="">Ekspor Semua Bulan</option>';
                availableMonths.forEach(month => {
                    const option = new Option(month, month);
                    monthFilterEl.add(option);
                });
                monthFilterEl.value = currentFilterValue;
            },
            renderDashboard: () => {
                const currentMonth = displayedDate.getMonth();
                const currentYear = displayedDate.getFullYear();
                const monthlySales = state.transactions.filter(tx => tx.date && tx.type === 'sale' && new Date(tx.date.seconds * 1000).getMonth() === currentMonth && new Date(tx.date.seconds * 1000).getFullYear() === currentYear).reduce((sum, tx) => sum + tx.total, 0);
                const monthlyExpensesTotal = state.monthlyExpenses.filter(ex => ex.date && new Date(ex.date.seconds * 1000).getMonth() === currentMonth && new Date(ex.date.seconds * 1000).getFullYear() === currentYear).reduce((sum, ex) => sum + ex.total, 0);
                document.getElementById('monthly-sales-card').textContent = formatCurrency(monthlySales);
                document.getElementById('monthly-expenses-card').textContent = formatCurrency(monthlyExpensesTotal);
                const pendingOrders = state.customerOrders.filter(o => o.status === 'pending');
                document.getElementById('active-orders-count').textContent = `${pendingOrders.length} Pesanan`;
                document.getElementById('active-orders-total').textContent = formatCurrency(pendingOrders.reduce((sum, order) => sum + order.total, 0));
                document.querySelectorAll('.chart-week-btn').forEach(btn => {
                    const week = parseInt(btn.dataset.week);
                    if (week === chartSelectedWeek) {
                        btn.classList.add('bg-emerald-100', 'text-emerald-800');
                        btn.classList.remove('text-gray-500');
                    }
                    else {
                        btn.classList.remove('bg-emerald-100', 'text-emerald-800');
                        btn.classList.add('text-gray-500');
                    }
                });
                const labels = [];
                const salesData = [];
                const expensesData = [];
                let startDate, endDate;
                switch (chartSelectedWeek) {
                    case 1:
                        startDate = new Date(currentYear, currentMonth, 1);
                        endDate = new Date(currentYear, currentMonth, 7);
                        break;
                    case 2:
                        startDate = new Date(currentYear, currentMonth, 8);
                        endDate = new Date(currentYear, currentMonth, 14);
                        break;
                    case 3:
                        startDate = new Date(currentYear, currentMonth, 15);
                        endDate = new Date(currentYear, currentMonth, 21);
                        break;
                    case 4:
                        startDate = new Date(currentYear, currentMonth, 22);
                        endDate = new Date(currentYear, currentMonth + 1, 0);
                        break;
                }
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    if (d.getMonth() !== currentMonth) continue;
                    const startOfDay = new Date(d);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(d);
                    endOfDay.setHours(23, 59, 59, 999);
                    const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
                    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);
                    const dailySales = state.transactions.filter(tx => tx.type === 'sale' && tx.date && tx.date >= startOfDayTimestamp && tx.date <= endOfDayTimestamp).reduce((sum, tx) => sum + tx.total, 0);
                    const dailyExpenses = state.monthlyExpenses.filter(ex => ex.date && ex.date >= startOfDayTimestamp && ex.date <= endOfDayTimestamp).reduce((sum, ex) => sum + ex.total, 0);
                    labels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
                    salesData.push(dailySales);
                    expensesData.push(dailyExpenses);
                }
                renderFunctions.updateSalesChart(labels, salesData);
                renderFunctions.updateExpensesChart(labels, expensesData);
            },
            renderProfile: () => {},
            updateSalesChart: (labels, data) => {
                const ctx = document.getElementById('sales-chart').getContext('2d');
                if (salesChart) {
                    salesChart.destroy();
                }
                salesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Uang Masuk',
                            data: data,
                            backgroundColor: 'rgba(16, 185, 129, 0.5)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return formatCompactNumber(value);
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            },
            updateExpensesChart: (labels, data) => {
                const ctx = document.getElementById('expenses-chart').getContext('2d');
                if (expensesChart) {
                    expensesChart.destroy();
                }
                expensesChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Uang Keluar',
                            data: data,
                            backgroundColor: 'rgba(239, 68, 68, 0.5)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        
                                        return formatCompactNumber(value);
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            },
            
            generateInvoice: async (purchaseId, addWatermark = false) => {
                const purchase = state.transactions.find(p => p.id === purchaseId);
                if (!purchase) {
                    showToast("Error: Data transaksi tidak ditemukan.");
                    return;
                }
                
                if (!purchase.items || !Array.isArray(purchase.items) || purchase.items.length === 0) {
                    showToast("Error: Transaksi ini tidak memiliki item untuk dibuatkan faktur.");
                    return;
                }
                
                const getLogoBase64 = () => {
                    return new Promise((resolve, reject) => {
                        if (!HIGH_QUALITY_LOGO_URL) { return resolve(null); }
                        const img = new Image();
                        img.crossOrigin = "Anonymous";
                        img.src = HIGH_QUALITY_LOGO_URL;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const dataURL = canvas.toDataURL('image/jpeg', 0.90);
                            resolve(dataURL);
                        };
                        img.onerror = () => { reject(new Error("Gagal memuat gambar logo.")); };
                    });
                };
                
                showToast('Mempersiapkan faktur...');
                
                let logoBase64 = null;
                try {
                    logoBase64 = await getLogoBase64();
                } catch (error) {
                    console.warn(error.message);
                }
                
                try {
                    const contact = state.contacts.find(c => c.id === purchase.contactId);
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
                    
                    const pageHeight = doc.internal.pageSize.height;
                    const pageWidth = doc.internal.pageSize.width;
                    const margin = 30;
                    
                    
                    // 1. HEADER
                    if (logoBase64) {
                        doc.addImage(logoBase64, 'JPEG', margin, margin, 70, 70);
                    }
                    doc.setFontSize(18);
                    doc.setFont("helvetica", "bold");
                    doc.text("INVOICE", pageWidth - margin, margin + 10, { align: 'right' });
                    
                    
                    const d = purchase.date.toDate();
                    
                    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
                    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                    endOfMonth.setHours(23, 59, 59, 999);
                    
                    const salesInMonth = state.transactions.filter(tx => {
                        if (!tx.date || tx.type !== 'sale') return false;
                        const txDate = tx.date.toDate();
                        return txDate >= startOfMonth && txDate <= endOfMonth;
                    });
                    
                    salesInMonth.sort((a, b) => a.date.seconds - b.date.seconds);
                    
                    const invoiceIndexInMonth = salesInMonth.findIndex(tx => tx.id === purchaseId);
                    
                    const monthlySequence = (invoiceIndexInMonth >= 0 ? invoiceIndexInMonth + 1 : salesInMonth.length + 1).toString().padStart(3, '0');
                    
                    const numericInvoiceId = `INV/${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}/${monthlySequence}`;
                    
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "normal");
                    doc.text(numericInvoiceId, pageWidth - margin, margin + 25, { align: 'right' });
                    
                    // 2. INFORMASI PENJUAL & PEMBELI
                    let yPos = margin + 90;
                    let sellerY = yPos;
                    doc.setFontSize(9);
                    doc.setTextColor(100);
                    doc.text("DITERBITKAN ATAS NAMA", margin, sellerY);
                    sellerY += 12;
                    doc.setFontSize(10);
                    doc.setTextColor(0);
                    doc.setFont("helvetica", "bold");
                    doc.text(companyInfo.name, margin, sellerY);
                    sellerY += 12;
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9);
                    doc.text(companyInfo.address, margin, sellerY);
                    sellerY += 10;
                    doc.text(`Email: ${companyInfo.email}`, margin, sellerY);
                    sellerY += 10;
                    doc.text(`No. Tlpn: ${companyInfo.phone}`, margin, sellerY);
                    
                    let buyerY = yPos;
                    const rightColX = pageWidth / 2;
                    doc.setFontSize(9);
                    doc.setTextColor(100);
                    doc.text("UNTUK", rightColX, buyerY);
                    doc.setFontSize(10);
                    doc.setTextColor(0);
                    doc.setFont("helvetica", "normal");
                    const addBuyerInfo = (label, value, y) => {
                        doc.setTextColor(100);
                        doc.text(label, rightColX, y);
                        doc.setTextColor(0);
                        doc.text(`: ${value}`, rightColX + 85, y);
                        return y + 14;
                    };
                    buyerY = yPos + 12;
                    const phone = contact ? (contact.phone || '-') : '-';
                    buyerY = addBuyerInfo("Nama", purchase.contactName, buyerY);
                    buyerY = addBuyerInfo("Tlpn", phone, buyerY);
                    buyerY = addBuyerInfo("Tanggal Pembelian", formatDate(purchase.date), buyerY);
                    doc.setTextColor(100);
                    doc.text("Alamat Pengiriman", rightColX, buyerY);
                    doc.setTextColor(0);
                    const address = purchase.address || (contact ? contact.address : 'Tidak ada alamat');
                    const addressLines = doc.splitTextToSize(address, 180);
                    doc.text(`: ${addressLines.join('\n')}`, rightColX + 85, buyerY);
                    buyerY += (addressLines.length * 12);
                    const tableStartY = Math.max(sellerY, buyerY) + 20;
    // --- BLOK WATERMARK ---
                    if (addWatermark) {
                        doc.saveGraphicsState();
                        
                        // 1. PENGATURAN TRANSPARANSI (FILL & STROKE)
                        // Atur isi (fill) ke 10% dan garis (stroke/border) ke 30%
                        doc.setGState(new doc.GState({ fillOpacity: 0.1, strokeOpacity: 0.3 }));
                        
                        // 2. PENGATURAN BORDER
                        doc.setLineWidth(1); // Atur ketebalan border (0.5px)
                        
                        doc.setFontSize(90);
                        doc.setFont("helvetica", "bold");
                        doc.setTextColor(160, 220, 160); // Warna hijau muda (untuk fill & border)
                        
                        // 3. POSISI
                        const yPosWatermark = pageHeight * 0.65;
                        const xPosWatermark = (pageWidth / 2) + 50;
                        
                        doc.text(
                            "L U N A S",
                            xPosWatermark,
                            yPosWatermark,
                            {
                                align: 'center',
                                angle: 45,
                                baseline: 'middle',
                                renderingMode: 'fillStroke' // <-- KUNCI: Render isi & border
                            }
                        );
                        
                        doc.restoreGraphicsState(); // Mengembalikan GState (transparansi, dll)
                    }
                    // --- AKHIR BLOK WATERMARK ---
                    // 3. TABEL PRODUK
                    const tableHead = [
                        ['INFO PRODUK', 'JUMLAH', 'HARGA SATUAN', 'TOTAL HARGA']
                    ];
                    const tableBody = purchase.items.map(item => [
                        item.name, item.qty, formatCurrency(item.price), formatCurrency(item.qty * item.price)
                    ]);
                    doc.autoTable({
                        head: tableHead,
                        body: tableBody,
                        startY: tableStartY,
                        theme: 'plain',
                        margin: { left: margin, right: margin },
                        styles: { fontSize: 10, cellPadding: { top: 8, bottom: 8, left: 4, right: 4 } },
                        headStyles: { fillColor: false, textColor: 100, fontStyle: 'bold', lineWidth: { top: 1.5, bottom: 1.5 }, lineColor: [220, 220, 220] },
                        columnStyles: { 0: { cellWidth: 'auto', fontStyle: 'bold', textColor: [5, 150, 105] }, 1: { halign: 'center', cellWidth: 50 }, 2: { halign: 'right', cellWidth: 80 }, 3: { halign: 'right', cellWidth: 80 } }
                    });
                    
                    // 4. RINCIAN TOTAL TAGIHAN
                    let finalY = doc.autoTable.previous.finalY;
                    const addTotalLine = (label, value, y, isBold = false) => {
                        doc.setFont("helvetica", isBold ? "bold" : "normal");
                        doc.text(label, pageWidth - margin - 150, y);
                        doc.text(value, pageWidth - margin, y, { align: 'right' });
                        return y + 15;
                    };
                    
                    const subtotal = purchase.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
                    const discountAmount = purchase.discountAmount || 0;
                    const total = purchase.total;
                    
                    let totalY = finalY + 20;
                    totalY = addTotalLine("Subtotal", formatCurrency(subtotal), totalY);
                    
                    if (discountAmount > 0) {
                        let discountLabel = "Diskon";
                        if (purchase.discountType === 'percent') {
                            discountLabel += ` (${purchase.discountValue}%)`;
                        }
                        doc.setTextColor(239, 68, 68);
                        totalY = addTotalLine(discountLabel, `-${formatCurrency(discountAmount)}`, totalY);
                        doc.setTextColor(0);
                    }
                    
                    doc.setLineDashPattern([2, 2], 0);
                    doc.line(pageWidth - margin - 150, totalY, pageWidth - margin, totalY);
                    doc.setLineDashPattern([], 0);
                    totalY += 10;
                    doc.setFontSize(12);
                    addTotalLine("TOTAL TAGIHAN", formatCurrency(total), totalY, true);
                    
                    // 5. FOOTER
                    const footerY = pageHeight - 50;
                    doc.setLineWidth(0.5);
                    doc.line(margin, footerY, pageWidth - margin, footerY);
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "normal");
                    doc.text("Metode Pembayaran:", margin, footerY + 15);
                    doc.setFont("helvetica", "bold");
                    doc.text("Transfer atau COD", margin, footerY + 25);
                    const updateDate = new Date().toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(150);
                    doc.text(`Terakhir diupdate: ${updateDate} WIB`, pageWidth - margin, pageHeight - margin, { align: 'right' });
                    
                    
                    const fileName = `faktur${addWatermark ? '-LUNAS' : ''}-${purchase.contactName.replace(/\s/g, '_')}-${numericInvoiceId}.pdf`;
                    doc.save(fileName);
                } catch (error) {
                    console.error("Gagal membuat faktur (setelah memuat logo):", error);
                    showToast(`Gagal: ${error.message || 'Terjadi kesalahan saat membuat PDF.'}`);
                }
            },
            renderChecklistReport: () => {
                const listEl = document.getElementById('checklist-report-list');
                const monthFilterEl = document.getElementById('checklistMonthFilter');
                if (!listEl || !monthFilterEl) return;
                listEl.innerHTML = '';
                const availableMonths = [...new Set(state.checklistHistory.map(report => report.tanggal ? new Date(report.tanggal.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) : null).filter(Boolean))].sort((a, b) => new Date(b.split(' ')[1], monthMap[b.split(' ')[0]]) - new Date(a.split(' ')[1], monthMap[a.split(' ')[0]]));
                const currentFilterValue = monthFilterEl.value;
                monthFilterEl.innerHTML = '<option value="">Semua Bulan</option>';
                availableMonths.forEach(month => monthFilterEl.add(new Option(month, month)));
                monthFilterEl.value = currentFilterValue;
                const selectedMonth = monthFilterEl.value;
                const filteredReports = state.checklistHistory.filter(report => !selectedMonth || (report.tanggal && new Date(report.tanggal.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth));
                if (filteredReports.length === 0) {
                    listEl.innerHTML = `<div class="text-center py-16"><svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada laporan</h3><p class="mt-1 text-sm text-gray-500">Tidak ada data laporan kebersihan yang cocok dengan filter Anda.</p></div>`;
                    return;
                }
                filteredReports.forEach(report => {
                    const dateEl = document.createElement('div');
                    const reportDate = report.tanggal ? new Date(report.tanggal.seconds * 1000).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal Tidak Valid';
                    const tasks = report.tasks;
                    let tasksArray = [];
                    if (Array.isArray(tasks)) {
                        tasksArray = tasks;
                    }
                    else if (tasks && typeof tasks === 'object') {
                        tasksArray = Object.values(tasks);
                    }
                    const tasksHtml = tasksArray.filter(task => task && task.done).map((task, index) => {
                        const taskId = Object.keys(report.tasks).find(key => report.tasks[key].text === task.text && report.tasks[key].completedBy === task.completedBy);
                        
                        const imageHtml = task.proofUrl ? `<a href="${task.proofUrl}" target="_blank" rel="noopener noreferrer" title="Lihat gambar penuh"><img src="${task.proofUrl}" alt="${task.text}" class="w-16 h-16 object-cover rounded-md bg-gray-200"></a>` : `<div class="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">Tdk ada gbr</div>`;
                        
                        const staffReviewHtml = `
                    <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <label class="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" 
                                   class="staff-check-task w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" 
                                   data-report-id="${report.id}" 
                                   data-task-id="${taskId}" 
                                   ${task.isChecked ? 'checked' : ''}>
                            Tandai sudah dicek
                        </label>
                        <div class="flex items-center gap-2">
                            <input type="text" 
                                   class="staff-comment-input flex-grow border-gray-300 rounded-md shadow-sm text-sm p-1.5" 
                                   placeholder="Beri komentar..." 
                                   data-report-id="${report.id}" 
                                   data-task-id="${taskId}"
                                   value="${task.staffComment || ''}">
                             <button 
                                class="save-comment-btn bg-indigo-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-indigo-600"
                                data-report-id="${report.id}"
                                data-task-id="${taskId}">
                                Simpan
                             </button>
                        </div>
                    </div>
                `;
                        
                        return `<li class="flex items-start gap-3 py-3 border-b last:border-b-0">
                            ${imageHtml}
                            <div class="flex-1">
                                <p class="font-medium">${task.text}</p>
                                <p class="text-sm text-gray-600">Oleh: <strong>${task.completedBy || 'N/A'}</strong></p>
                                ${staffReviewHtml}
                            </div>
                        </li>`;
                    }).join('');
                    if (tasksHtml) {
                        dateEl.innerHTML = `<div class="border rounded-lg mb-4"><header class="bg-gray-50 p-3 rounded-t-lg"><h3 class="font-bold text-lg">${reportDate}</h3></header><ul class="px-3">${tasksHtml}</ul></div>`;
                        listEl.appendChild(dateEl);
                    }
                });
            },
            renderDailyReportHistory: () => {
                const listEl = document.getElementById('daily-report-history-list');
                const yearFilterEl = document.getElementById('daily-report-year-filter');
                const monthFilterEl = document.getElementById('daily-report-month-filter');
                if (!listEl || !yearFilterEl || !monthFilterEl) return;
                
                const now = new Date();
                const availableYears = [...new Set(state.dailyReports.map(r => r.date.toDate().getFullYear()))].sort((a, b) => b - a);
                
                const currentYearValue = yearFilterEl.value;
                yearFilterEl.innerHTML = '<option value="">Semua Tahun</option>';
                availableYears.forEach(year => yearFilterEl.add(new Option(year, year)));
                
                if (!currentYearValue && availableYears.includes(now.getFullYear())) {
                    yearFilterEl.value = now.getFullYear();
                } else {
                    yearFilterEl.value = currentYearValue;
                }
                
                const selectedYear = yearFilterEl.value;
                monthFilterEl.innerHTML = '<option value="">Semua Bulan</option>';
                if (selectedYear) {
                    const availableMonths = [...new Set(state.dailyReports
                        .filter(r => r.date.toDate().getFullYear() == selectedYear)
                        .map(r => r.date.toDate().getMonth())
                    )].sort((a, b) => a - b);
                    
                    availableMonths.forEach(monthIndex => {
                        const monthName = new Date(selectedYear, monthIndex).toLocaleString('id-ID', { month: 'long' });
                        monthFilterEl.add(new Option(monthName, monthIndex));
                    });
                }
                
                const currentMonthValue = monthFilterEl.value;
                if (selectedYear == now.getFullYear() && !currentMonthValue) {
                    monthFilterEl.value = now.getMonth();
                } else {
                    monthFilterEl.value = currentMonthValue;
                }
                monthFilterEl.disabled = !selectedYear;
                
                // --- Melakukan Filter Data ---
                const selectedMonth = monthFilterEl.value;
                let filteredReports = state.dailyReports;
                if (selectedYear) {
                    filteredReports = filteredReports.filter(r => r.date.toDate().getFullYear() == selectedYear);
                    if (selectedMonth !== '') {
                        filteredReports = filteredReports.filter(r => r.date.toDate().getMonth() == selectedMonth);
                    }
                }
                
                // --- Menampilkan Hasil (Sisa kode sama seperti sebelumnya) ---
                listEl.innerHTML = '';
                if (filteredReports.length === 0) {
                    listEl.innerHTML = `<div class="text-center py-10"><p class="text-sm text-gray-500">Tidak ada laporan yang cocok dengan filter.</p></div>`;
                    return;
                }
                
                filteredReports.forEach(report => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'p-3 border rounded-lg flex justify-between items-center';
                    itemEl.innerHTML = `
            <div data-id="${report.id}" class="flex-grow cursor-pointer hover:bg-gray-50 flex justify-between items-center view-daily-report-btn">
                <div><p class="font-bold">${formatFullDate(report.date)}</p><p class="text-sm text-gray-500">${Object.keys(report.restaurants).length} Restoran</p></div>
                <div class="text-right"><p class="font-semibold text-green-600">${formatCurrency(report.grandTotal)}</p><p class="text-xs text-gray-500">${report.totalNaskot} Nasi Kotak</p></div>
            </div>
            <button data-id="${report.id}" class="delete-daily-report-btn ml-4 text-gray-400 hover:text-red-500 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
        `;
                    itemEl.querySelector('.view-daily-report-btn').addEventListener('click', (e) => {
                        const reportId = e.currentTarget.dataset.id;
                        const reportData = state.dailyReports.find(r => r.id === reportId);
                        if (!reportData) return;
                        const detailModal = document.getElementById('daily-report-detail-modal');
                        const detailContent = document.getElementById('daily-report-detail-content');
                        let contentHtml = `<h4 class="font-bold text-lg mb-2">${formatFullDate(reportData.date)}</h4>`;
                        for (const [name, data] of Object.entries(reportData.restaurants)) {
                            contentHtml += `<div class="mt-4 border-t pt-2"><div class="flex justify-between items-center"><h5 class="font-bold">${name}</h5><p class="font-semibold">${formatCurrency(data.total)}</p></div>`;
                            for (const [phone, phoneData] of Object.entries(data.phones)) {
                                contentHtml += `<div class="pl-4 mt-2"><p class="font-medium text-sm">${phone}: ${formatCurrency(phoneData.total)}</p><ul class="list-disc pl-5 text-xs text-gray-600"><li>Makan ditempat: ${formatCurrency(phoneData['Makan ditempat'])}</li><li>Naskot: ${formatCurrency(phoneData['Naskot'])}</li><li>Online: ${formatCurrency(phoneData['Online'])}</li></ul></div>`;
                            }
                            contentHtml += `</div>`;
                        }
                        contentHtml += `<div class="mt-6 border-t pt-4 text-center space-y-2"><p>Total Nasi Kotak: <strong class="text-lg">${reportData.totalNaskot}</strong></p><p>Grand Total: <strong class="text-2xl text-green-700">${formatCurrency(reportData.grandTotal)}</strong></p></div>`;
                        detailContent.innerHTML = contentHtml;
                        detailModal.classList.remove('hidden');
                    });
                    listEl.appendChild(itemEl);
                });
            },
            renderOmsetTrendChart: (labels, makanData, naskotData, onlineData) => {
                const chartContainer = document.getElementById('omset-trend-chart-container');
                if (!chartContainer) return;
                
                const ctx = document.getElementById('omset-trend-chart').getContext('2d');
                if (omsetTrendChart) {
                    omsetTrendChart.destroy();
                }
                omsetTrendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: 'Dine In', data: makanData, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.2 },
                            { label: 'Naskot', data: naskotData, borderColor: 'rgb(234, 179, 8)', backgroundColor: 'rgba(234, 179, 8, 0.1)', fill: true, tension: 0.2 },
                            { label: 'Online', data: onlineData, borderColor: 'rgb(16, 185, 129)', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.2 }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return formatCompactNumber(value);
                                    }
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                            }
                        }
                    }
                });
                chartContainer.classList.remove('hidden');
            },
            
            renderMonthlyTurnoverReport: () => {
                const yearFilter = document.getElementById('monthly-report-year-filter');
                if (yearFilter.options.length === 0) {
                    const availableYears = [...new Set(state.dailyReports.map(r => r.date.toDate().getFullYear()))].sort((a, b) => b - a);
                    availableYears.forEach(year => yearFilter.add(new Option(year, year)));
                }
                const selectedYear = yearFilter.value ? parseInt(yearFilter.value) : new Date().getFullYear();
                
                const reportsInYear = state.dailyReports.filter(r => r.date.toDate().getFullYear() === selectedYear);
                
                const monthlyData = {};
                for (let i = 0; i < 12; i++) {
                    monthlyData[i] = {
                        total: 0,
                        label: new Date(selectedYear, i).toLocaleString('id-ID', { month: 'short' }),
                        fullName: new Date(selectedYear, i).toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
                        categories: { 'Makan ditempat': 0, 'Naskot': 0, 'Online': 0 },
                        restaurants: { 'Ayam Penyet Surabaya': 0, 'Mie Jogja': 0 }
                    };
                }
                
                reportsInYear.forEach(report => {
                    const month = report.date.toDate().getMonth();
                    monthlyData[month].total += report.grandTotal || 0;
                    
                    for (const restoName in report.restaurants) {
                        monthlyData[month].restaurants[restoName] += report.restaurants[restoName].total || 0;
                        for (const phone of Object.values(report.restaurants[restoName].phones)) {
                            monthlyData[month].categories['Makan ditempat'] += phone['Makan ditempat'] || 0;
                            monthlyData[month].categories['Naskot'] += phone['Naskot'] || 0;
                            monthlyData[month].categories['Online'] += phone['Online'] || 0;
                        }
                    }
                });
                
                const processedMonths = Object.values(monthlyData).filter(m => m.total > 0);
                
                const totalTurnover = processedMonths.reduce((sum, val) => sum + val.total, 0);
                const avgTurnover = processedMonths.length > 0 ? totalTurnover / processedMonths.length : 0;
                
                let maxTurnover = 0;
                let bestMonthName = '-';
                processedMonths.forEach(m => {
                    if (m.total > maxTurnover) {
                        maxTurnover = m.total;
                        bestMonthName = m.label + " " + selectedYear;
                    }
                });
                
                let momGrowth = 0;
                if (processedMonths.length >= 2) {
                    const currentMonthTotal = processedMonths[processedMonths.length - 1].total;
                    const prevMonthTotal = processedMonths[processedMonths.length - 2].total;
                    if (prevMonthTotal > 0) {
                        momGrowth = ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
                    }
                }
                document.getElementById('avg-monthly-turnover').textContent = formatCurrencyShort(Math.round(avgTurnover));
                document.getElementById('best-month-name').textContent = bestMonthName;
                const momEl = document.getElementById('mom-growth');
                momEl.textContent = `${momGrowth.toFixed(1)}%`;
                momEl.className = `font-bold text-lg ${momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`;
                
                const yearlyRestoTotals = { 'Ayam Penyet Surabaya': 0, 'Mie Jogja': 0 };
                Object.values(monthlyData).forEach(m => {
                    yearlyRestoTotals['Ayam Penyet Surabaya'] += m.restaurants['Ayam Penyet Surabaya'];
                    yearlyRestoTotals['Mie Jogja'] += m.restaurants['Mie Jogja'];
                });
                document.getElementById('aps-yearly-total').textContent = formatCurrency(yearlyRestoTotals['Ayam Penyet Surabaya']);
                document.getElementById('mj-yearly-total').textContent = formatCurrency(yearlyRestoTotals['Mie Jogja']);
                
                
                const ctx = document.getElementById('monthly-turnover-chart').getContext('2d');
                if (monthlyTurnoverChart) monthlyTurnoverChart.destroy();
                
                const monthsWithData = Object.values(monthlyData).filter(m => m.total > 0);
                
                monthlyTurnoverChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: monthsWithData.map(m => m.label),
                        datasets: [
                        {
                            label: 'Dine In',
                            data: monthsWithData.map(m => m.categories['Makan ditempat']),
                            backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        },
                        {
                            label: 'Naskot',
                            data: monthsWithData.map(m => m.categories['Naskot']),
                            backgroundColor: 'rgba(251, 146, 60, 0.7)',
                        },
                        {
                            label: 'Online',
                            data: monthsWithData.map(m => m.categories['Online']),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            x: { stacked: true },
                            y: { stacked: true, beginAtZero: true }
                        },
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }
        };
        const pages = document.querySelectorAll('.page');
        const navButtons = document.querySelectorAll('.nav-button');
        const fabContainer = document.getElementById('fab-container');
        
        // main.js
        
        const navigateTo = (pageId) => {
            // ID halaman target yang benar selalu "page-" + nama halaman
            const targetPageId = `page-${pageId}`;
            
            pages.forEach(page => page.classList.toggle('hidden', page.id !== targetPageId));
            
            navButtons.forEach(btn => {
                // Cocokkan data-target dengan pageId tanpa awalan
                const isActive = btn.dataset.target === pageId;
                btn.classList.toggle('nav-active', isActive);
                
                // Logika untuk ikon beranda (sudah benar)
                const berandaIcon = btn.querySelector('.beranda-icon');
                if (berandaIcon) berandaIcon.style.fill = isActive ? '#D1FAE5' : 'none';
            });
            
            // Kirim pageId tanpa awalan ke fungsi FAB
            updateFAB(pageId);
            
            if (pageId !== 'pihak') { // Gunakan nama dasar
                document.getElementById('broadcast-controls').classList.add('hidden');
                document.querySelectorAll('.contact-checkbox').forEach(cb => cb.checked = false);
            }
            
            // Simpan ID halaman yang lengkap
            localStorage.setItem('lastActivePage', targetPageId);
        };
        
        // main.js
        
        const updateFAB = (pageId) => {
            fabContainer.innerHTML = '';
            let fabHTML = '';
            const baseFabClass = "w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-600 transition-all";
            const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            
            // DIPERBAIKI: Menghapus awalan 'page-' dari semua kondisi
            if (pageId === 'pihak') {
                fabHTML = `<button title="Tambah Pelanggan" id="fab-add-contact" class="${baseFabClass}">${plusIcon}</button>`;
            } else if (pageId === 'inventaris') {
                fabHTML = `<button title="Tambah Barang" id="fab-add-item" class="${baseFabClass}">${plusIcon}</button>`;
            } else if (pageId === 'penjualan') {
                fabHTML = `<button title="Buat Faktur Penjualan" id="fab-add-sale" class="${baseFabClass}">${plusIcon}</button>`;
            } else if (pageId === 'pesanan') {
                fabHTML = `<button title="Tambah Pesanan" id="fab-add-order" class="${baseFabClass}">${plusIcon}</button>`;
            } else if (pageId === 'laporan') {
                fabHTML = `<button title="Catat Belanja Baru" id="fab-add-expense" class="${baseFabClass}">${plusIcon}</button>`;
            } else if (pageId === 'reservasi') {
                fabHTML = `<button title="Tambah Reservasi" id="fab-add-reservation" class="${baseFabClass}">${plusIcon}</button>`;
            }
            
            fabContainer.innerHTML = fabHTML;
        };
        
        function initializeApplication(db) {
            document.getElementById('daily-report-year-filter').addEventListener('change', renderFunctions.renderDailyReportHistory);
            document.getElementById('daily-report-month-filter').addEventListener('change', renderFunctions.renderDailyReportHistory);
            document.getElementById('daily-report-reset-filter').addEventListener('click', () => {
                document.getElementById('daily-report-year-filter').value = '';
                document.getElementById('daily-report-month-filter').value = '';
                renderFunctions.renderDailyReportHistory();
            });
            document.getElementById('reservation-search-input').addEventListener('input', (e) => {
                reservationFilter.searchTerm = e.target.value;
                renderFunctions.renderReservations();
            });
            document.getElementById('customer-summary-month-filter').addEventListener('change', renderFunctions.renderCustomerSummary);
            document.getElementById('customer-summary-reset-filter').addEventListener('click', () => {
                document.getElementById('customer-summary-month-filter').value = '';
                renderFunctions.renderCustomerSummary();
            });
            document.getElementById('monthly-report-year-filter').addEventListener('change', () => {
                renderFunctions.renderMonthlyTurnoverReport();
            });
            
            document.getElementById('export-monthly-report-csv').addEventListener('click', () => {
                const selectedYear = document.getElementById('monthly-report-year-filter').value;
                const headers = ["Bulan", "Total Omset", "Makan di Tempat", "Naskot", "Online", "Omset APS", "Omset MJ"];
                
                const dataToExport = [];
                const monthlyDataForExport = {};
                for (let i = 0; i < 12; i++) {
                    monthlyDataForExport[i] = {
                        total: 0,
                        fullName: new Date(selectedYear, i).toLocaleString('id-ID', { month: 'long' }),
                        categories: { 'Makan ditempat': 0, 'Naskot': 0, 'Online': 0 },
                        restaurants: { 'Ayam Penyet Surabaya': 0, 'Mie Jogja': 0 }
                    };
                }
                state.dailyReports.filter(r => r.date.toDate().getFullYear() == selectedYear).forEach(report => {
                    const month = report.date.toDate().getMonth();
                    monthlyDataForExport[month].total += report.grandTotal || 0;
                    for (const restoName in report.restaurants) {
                        monthlyDataForExport[month].restaurants[restoName] += report.restaurants[restoName].total || 0;
                        for (const phone of Object.values(report.restaurants[restoName].phones)) {
                            monthlyDataForExport[month].categories['Makan ditempat'] += phone['Makan ditempat'] || 0;
                            monthlyDataForExport[month].categories['Naskot'] += phone['Naskot'] || 0;
                            monthlyDataForExport[month].categories['Online'] += phone['Online'] || 0;
                        }
                    }
                });
                
                Object.values(monthlyDataForExport).forEach(m => {
                    if (m.total > 0) { // Hanya ekspor bulan yang ada datanya
                        dataToExport.push([
                            m.fullName,
                            m.total,
                            m.categories['Makan ditempat'],
                            m.categories['Naskot'],
                            m.categories['Online'],
                            m.restaurants['Ayam Penyet Surabaya'],
                            m.restaurants['Mie Jogja']
                        ]);
                    }
                });
                
                if (dataToExport.length === 0) {
                    showToast("Tidak ada data untuk diekspor pada tahun ini.");
                    return;
                }
                
                const filename = `laporan_omset_bulanan_${selectedYear}.csv`;
                exportToCsv(filename, headers, dataToExport);
                showToast('Laporan sedang diunduh...');
            });
            document.getElementById('prev-month-btn').addEventListener('click', () => {
                displayedDate.setMonth(displayedDate.getMonth() - 1);
                updateMonthDisplay();
                renderFunctions.renderDashboard();
            });
            
            document.getElementById('next-month-btn').addEventListener('click', () => {
                if (document.getElementById('next-month-btn').disabled) return;
                displayedDate.setMonth(displayedDate.getMonth() + 1);
                updateMonthDisplay();
                renderFunctions.renderDashboard();
            });
            
            updateMonthDisplay();
            const modalContainer = document.getElementById('modal-container');
            const createModal = (id, title, content, onSubmit) => {
                const lastButtonIndex = content.lastIndexOf('<button type="submit"');
                const formFields = content.substring(0, lastButtonIndex);
                const submitButton = content.substring(lastButtonIndex);
                const modalHTML = ` <div id="${id}" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 hidden"> <div class="modal-content bg-white w-full rounded-t-2xl relative"> <header class="p-4 border-b flex justify-between items-center"> <h3 class="font-bold text-lg">${title}</h3> <button class="close-modal-btn text-gray-500 text-2xl font-bold">&times;</button> </header> <form autocomplete="off"> <div class="p-4 max-h-[65vh] overflow-y-auto">${formFields}</div> <div class="p-4 border-t">${submitButton}</div> </form> </div> </div>`;
                modalContainer.insertAdjacentHTML('beforeend', modalHTML);
                const modalEl = document.getElementById(id);
                const formEl = modalEl.querySelector('form');
                const show = (data = {}) => {
                    formEl.reset();
                    formEl.dataset.id = data.id || '';
                    Object.keys(data).forEach(key => { const input = formEl.elements[key]; if (input) input.value = data[key]; });
                    modalEl.classList.remove('hidden');
                };
                const hide = () => modalEl.classList.add('hidden');
                modalEl.addEventListener('click', (e) => { if (e.target === modalEl) hide(); });
                modalEl.querySelector('.close-modal-btn').addEventListener('click', hide);
                formEl.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const submitBtn = formEl.querySelector('button[type="submit"]');
                    if (!submitBtn) return;
                    const originalBtnHTML = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Menyimpan...`;
                    const formData = new FormData(formEl);
                    const data = Object.fromEntries(formData.entries());
                    data.id = formEl.dataset.id;
                    try { const successMessage = await onSubmit(data, formEl); if (successMessage) { showToast(successMessage); } hide(); } catch (error) {
                        console.error("Error submitting form: ", error);
                        if (typeof error === 'string' || error instanceof String || error.message) showToast(error.message || error);
                        else showToast("Gagal menyimpan data. Cek konsol.");
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnHTML;
                    }
                });
                return { show, hide, formEl, modalEl };
            };
            const createConfirmationModal = (id, title, message, confirmText = 'Hapus', confirmClass = 'bg-red-600') => {
                const modalHTML = `<div id="${id}" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] hidden"><div class="modal-content bg-white w-11/12 max-w-sm rounded-lg p-6 text-center" style="animation: none;"><h3 class="font-bold text-lg mb-2">${title}</h3><p class="text-gray-600 mb-6">${message}</p><div class="flex justify-center gap-4"><button class="cancel-btn px-6 py-2 rounded-lg border">Batal</button><button class="confirm-btn px-6 py-2 rounded-lg text-white ${confirmClass}">${confirmText}</button></div></div></div>`;
                modalContainer.insertAdjacentHTML('beforeend', modalHTML);
                const modalEl = document.getElementById(id);
                let resolvePromise;
                const show = () => { modalEl.classList.remove('hidden'); return new Promise(resolve => { resolvePromise = resolve; }); };
                const hide = () => modalEl.classList.add('hidden');
                modalEl.querySelector('.confirm-btn').addEventListener('click', () => { hide(); if (resolvePromise) resolvePromise(true); });
                modalEl.querySelector('.cancel-btn').addEventListener('click', () => { hide(); if (resolvePromise) resolvePromise(false); });
                modalEl.addEventListener('click', (e) => { if (e.target === modalEl) { hide(); if (resolvePromise) resolvePromise(false); } });
                return { show };
            };
            
            const dailyReportDetailModalHTML = `<div id="daily-report-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-[60] hidden"><div class="modal-content bg-white w-full rounded-t-2xl relative"><header class="p-4 border-b flex justify-between items-center"><h3 class="font-bold text-lg">Detail Laporan Harian</h3><button class="close-modal-btn text-gray-500 text-2xl font-bold">&times;</button></header><div id="daily-report-detail-content" class="p-4 max-h-[65vh] overflow-y-auto"></div></div></div>`;
            modalContainer.insertAdjacentHTML('beforeend', dailyReportDetailModalHTML);
            const dailyReportDetailModal = document.getElementById('daily-report-detail-modal');
            dailyReportDetailModal.querySelector('.close-modal-btn').addEventListener('click', () => dailyReportDetailModal.classList.add('hidden'));
            dailyReportDetailModal.addEventListener('click', (e) => { if (e.target === dailyReportDetailModal) dailyReportDetailModal.classList.add('hidden'); });
            
            
            const contactModalContent = `<div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700">Nama</label><input type="text" name="name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></div><div><label class="block text-sm font-medium text-gray-700">No. Telepon</label><input type="tel" name="phone" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div><div><label class="block text-sm font-medium text-gray-700">Alamat</label><textarea name="address" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea></div></div><button type="submit" class="mt-6 w-full bg-emerald-600 text-white py-2 px-4 rounded-md shadow-sm font-medium">Simpan Pelanggan</button>`;
            const itemModalContent = `<div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700">Nama Barang</label><input type="text" name="name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></div><div><label class="block text-sm font-medium text-gray-700">Harga Jual</label><input type="number" name="price" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></div></div><button type="submit" class="mt-6 w-full bg-emerald-600 text-white py-2 px-4 rounded-md shadow-sm font-medium">Simpan Barang</button>`;
            const expenseModalContent = `<div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700">Tanggal Pembelian</label><input type="date" name="purchaseDate" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></div><div><label class="block text-sm font-medium text-gray-700">Nama Toko</label><input type="text" name="storeName" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></div><div><label class="block text-sm font-medium text-gray-700">Nama Barang</label><input type="text" name="itemName" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></div><div><label class="block text-sm font-medium text-gray-700">Jumlah/Satuan</label><input type="text" name="quantity" value="1" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></div><div><label class="block text-sm font-medium text-gray-700">Total Harga</label><input type="number" name="total" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></div></div><button type="submit" class="mt-6 w-full bg-emerald-600 text-white py-2 px-4 rounded-md shadow-sm font-medium">Simpan Belanja</button>`;
            const saleModalContent = `<div class="space-y-4"><div><label class="block text-sm font-medium text-gray-700">Pilih Pelanggan</label><select name="contactId" id="sale-contact-select" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required></select></div><div class="border-t pt-4"><h4 class="font-medium mb-2">Barang yang Dibeli</h4><div id="sale-items-container" class="space-y-2"></div><button type="button" id="add-sale-item-btn" class="mt-2 text-sm text-emerald-600 font-semibold">+ Tambah Barang</button></div><div class="border-t pt-4 text-right"><p class="text-gray-600">Total Tagihan:</p><p id="sale-total-amount" class="font-bold text-2xl">${formatCurrency(0)}</p></div></div><button type="submit" class="mt-6 w-full bg-emerald-600 text-white py-2 px-4 rounded-md shadow-sm font-medium">Buat Faktur</button>`;
            const customerOrderModalContent = `
    <div class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-gray-700">Tanggal Pesanan</label>
            <input type="date" name="orderDate" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
        </div>
        <div class="relative">
            <label class="block text-sm font-medium text-gray-700">Nama Pelanggan</label>
            <input type="text" name="customerName" id="customer-name-input" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required autocomplete="off">
            <div id="customer-suggestions-box" class="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto hidden"></div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">No. Telepon (Opsional)</label>
            <input type="tel" name="customerPhone" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Alamat Pengiriman</label>
            <textarea name="alamat" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
        </div>
        <div class="border-t pt-4">
            <h4 class="font-medium mb-2">Barang yang Dipesan</h4>
            <div id="order-items-container" class="space-y-2"></div>
            <button type="button" id="add-order-item-btn" class="mt-2 text-sm text-emerald-600 font-semibold">+ Tambah Barang</button>
        </div>

        <div class="border-t pt-4 space-y-3">
            <h4 class="font-medium">Diskon / Potongan Harga</h4>
            <div class="flex items-center gap-2">
                <div class="flex-grow">
                     <input type="number" id="order-discount-value" placeholder="Masukkan nilai" class="w-full border border-gray-300 rounded-md py-2 px-3 text-sm">
                </div>
                <div class="flex-shrink-0">
                     <div class="flex items-center border border-gray-300 rounded-md text-sm font-semibold">
                        <button type="button" data-type="percent" class="order-discount-type-btn px-4 py-2 text-gray-500 rounded-l-md bg-emerald-100 text-emerald-800">%</button>
                        <button type="button" data-type="amount" class="order-discount-type-btn px-4 py-2 text-gray-500 rounded-r-md border-l">Rp</button>
                     </div>
                     <input type="hidden" id="order-discount-type" value="percent">
                </div>
            </div>
        </div>
        <div class="border-t pt-4 space-y-2 text-right">
             <div>
                <span class="text-sm text-gray-600">Subtotal:</span>
                <span id="order-subtotal-amount" class="text-sm font-semibold text-gray-800">${formatCurrency(0)}</span>
             </div>
             <div>
                <span class="text-sm text-red-600">Diskon:</span>
                <span id="order-discount-amount-display" class="text-sm font-semibold text-red-600">${formatCurrency(0)}</span>
             </div>
             <div class="mt-1">
                <span class="text-gray-600 font-medium">Total Pesanan:</span>
                <span id="order-total-amount" class="font-bold text-2xl">${formatCurrency(0)}</span>
             </div>
        </div>
    </div>
    <button type="submit" class="mt-6 w-full bg-emerald-600 text-white py-2 px-4 rounded-md shadow-sm font-medium">Simpan Pesanan</button>
`;
            const customerDetailModalContent = `<div id="customer-item-details"></div><button type="submit" class="hidden">OK</button>`;
            const broadcastModalContent = `<div class="space-y-4"><div><label for="broadcast-message" class="block text-sm font-medium text-gray-700">Pesan Broadcast</label><textarea name="message" id="broadcast-message" rows="6" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="Ketik pesan Anda di sini... (cth: Halo {nama}, ...)" required></textarea><p class="mt-2 text-xs text-gray-500">Gunakan <code class="bg-gray-200 px-1 rounded">{nama}</code> untuk menyisipkan nama pelanggan.</p></div></div><button type="submit" class="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-md shadow-sm font-medium">Lanjutkan & Mulai Kirim</button>`;
            const reservationModalContent = `
    <div class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-gray-700">Nama Pelanggan</label>
            <input type="text" name="customerName" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Nomor Telepon (Opsional)</label>
            <input type="tel" name="customerPhone" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Jumlah Orang</label>
            <input type="number" name="numberOfGuests" min="1" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Tanggal</label>
            <input type="date" name="reservationDate" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Waktu</label>
            <input type="time" name="reservationTime" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
            <textarea name="notes" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"></textarea>
        </div>
    </div>
    <button type="submit" class="mt-6 w-full bg-emerald-600 text-white py-2 px-4 rounded-md shadow-sm font-medium">Simpan Reservasi</button>
`;
            
            
            const reservationModal = createModal('reservation-modal', 'Buat/Edit Reservasi', reservationModalContent, async (data, formEl) => {
                const reservationDateTime = new Date(`${data.reservationDate}T${data.reservationTime}`);
                
                const payload = {
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    numberOfGuests: Number(data.numberOfGuests),
                    reservationDate: Timestamp.fromDate(reservationDateTime),
                    reservationTime: data.reservationTime,
                    notes: data.notes,
                };
                
                if (formEl.dataset.id) {
                    await updateDoc(doc(db, 'reservations', formEl.dataset.id), payload);
                    return 'Reservasi berhasil diperbarui!';
                } else {
                    payload.status = 'confirmed';
                    payload.createdAt = serverTimestamp();
                    await addDoc(collection(db, 'reservations'), payload);
                    return 'Reservasi baru berhasil disimpan!';
                }
            });
            
            
            const contactModal = createModal('contact-modal', 'Tambah/Edit Pelanggan', contactModalContent, async (data) => { const payload = { name: data.name, phone: data.phone, address: data.address }; if (data.id) { await updateDoc(doc(db, 'contacts', data.id), payload); return 'Pelanggan berhasil diperbarui!'; } else { await addDoc(collection(db, 'contacts'), payload); return 'Pelanggan baru berhasil ditambahkan!'; } });
            const itemModal = createModal('item-modal', 'Tambah/Edit Barang', itemModalContent, async (data) => { const payload = { name: data.name, price: Number(data.price) }; if (data.id) { await updateDoc(doc(db, 'inventory', data.id), payload); return 'Barang berhasil diperbarui!'; } else { await addDoc(collection(db, 'inventory'), payload); return 'Barang baru berhasil ditambahkan!'; } });
            const expenseModal = createModal('expense-modal', 'Catat Belanja Baru', expenseModalContent, async (data) => {
                const purchaseDate = data.purchaseDate ? Timestamp.fromDate(new Date(data.purchaseDate)) : serverTimestamp();
                const payload = { itemName: data.itemName, quantity: data.quantity, total: Number(data.total), storeName: data.storeName, date: purchaseDate };
                await addDoc(collection(db, 'monthly_expenses'), payload);
                return 'Item belanja berhasil dicatat!';
            });
            const confirmDeleteModal = createConfirmationModal('confirm-delete-modal', 'Konfirmasi Hapus', 'Apakah Anda yakin ingin menghapus item ini?', 'Ya, Hapus', 'bg-red-600');
            const confirmInvoiceModal = createConfirmationModal('confirm-invoice-modal', 'Konfirmasi Pembuatan Faktur', 'Buat faktur untuk pesanan ini? Aksi ini akan membuat catatan transaksi baru.', 'Ya, Buat Faktur', 'bg-green-600');
            const confirmCancelReservationModal = createConfirmationModal('confirm-cancel-modal', 'Konfirmasi Pembatalan', 'Apakah Anda yakin ingin membatalkan reservasi ini?', 'Ya, Batalkan', 'bg-red-600');
            const dateFilterModal = createModal('date-filter-modal', 'Pilih Periode', '<div id="date-filter-content" class="p-4"></div>', () => {});
            const saleModal = createModal('sale-modal', 'Faktur Penjualan Baru', saleModalContent, async (data, form) => {
                const items = [];
                form.querySelectorAll('.sale-item-row').forEach(row => { const itemId = row.querySelector('select[name="itemId"]').value; const itemData = state.inventory.find(i => i.id === itemId); const qty = Number(row.querySelector('input[name="qty"]').value); if (itemData && qty > 0) { items.push({ id: itemId, name: itemData.name, price: itemData.price, qty: qty }); } });
                if (items.length === 0) { throw new Error("Tambahkan minimal satu barang."); }
                if (!data.contactId) { throw new Error("Pilih pelanggan terlebih dahulu."); }
                const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                const contact = state.contacts.find(c => c.id === data.contactId);
                const salePayload = { contactId: data.contactId, contactName: contact.name, items, total, type: 'sale', date: serverTimestamp() };
                await addDoc(collection(db, 'transactions'), salePayload);
                return 'Faktur penjualan berhasil dibuat!';
            });
            const customerOrderModal = createModal('customer-order-modal', 'Pesanan Baru', customerOrderModalContent, async (data, form) => {
                const customerName = data.customerName.trim();
                const customerPhone = data.customerPhone.trim();
                const customerAddress = form.elements['alamat'].value.trim();
                if (!customerName) {
                    throw new Error("Nama pelanggan harus diisi.");
                }
                let contactId;
                let contactName = customerName;
                const existingContact = state.contacts.find(c => c.name.toLowerCase() === customerName.toLowerCase());
                if (existingContact) {
                    contactId = existingContact.id;
                    if (existingContact.phone !== customerPhone || existingContact.address !== customerAddress) {
                        await updateDoc(doc(db, 'contacts', existingContact.id), { phone: customerPhone, address: customerAddress });
                        showToast(`Info kontak ${customerName} diperbarui.`);
                    }
                } else {
                    const newContactPayload = { name: contactName, phone: customerPhone, address: customerAddress };
                    const newContactRef = await addDoc(collection(db, 'contacts'), newContactPayload);
                    contactId = newContactRef.id;
                    showToast(`Pelanggan baru "${contactName}" telah ditambahkan.`);
                }
                const items = [];
                form.querySelectorAll('.order-item-row').forEach(row => {
                    const itemId = row.querySelector('select[name="itemId"]').value;
                    const itemData = state.inventory.find(i => i.id === itemId);
                    const qty = Number(row.querySelector('input[name="qty"]').value);
                    if (itemData && qty > 0) {
                        items.push({ id: itemId, name: itemData.name, price: itemData.price, qty: qty });
                    }
                });
                if (items.length === 0) {
                    throw new Error("Tambahkan minimal satu barang pesanan.");
                }
                
                const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                const discountValue = parseFloat(form.querySelector('#order-discount-value').value) || 0;
                const discountType = form.querySelector('#order-discount-type').value;
                
                let discountAmount = 0;
                if (discountType === 'percent' && discountValue > 0) {
                    discountAmount = subtotal * (discountValue / 100);
                } else if (discountType === 'amount' && discountValue > 0) {
                    discountAmount = discountValue;
                }
                discountAmount = Math.min(subtotal, discountAmount);
                
                const total = subtotal - discountAmount;
                
                const orderDate = data.orderDate ? Timestamp.fromDate(new Date(data.orderDate)) : serverTimestamp();
                
                const payload = {
                    contactId: contactId,
                    contactName: contactName,
                    alamat: customerAddress,
                    items: items,
                    subtotal: subtotal,
                    discountType: discountType,
                    discountValue: discountValue,
                    discountAmount: discountAmount,
                    total: total,
                    status: 'pending',
                    orderDate: orderDate
                };
                
                await addDoc(collection(db, 'customer_orders'), payload);
                return 'Pesanan baru berhasil disimpan!';
            });
            const customerDetailModal = createModal('customer-detail-modal', 'Detail Pembelian Pelanggan', customerDetailModalContent, () => {});
            const broadcastModal = createModal('broadcast-modal', 'Broadcast WhatsApp', broadcastModalContent, async (data) => {
                broadcastMessageTemplate = data.message;
                const checkedBoxes = document.querySelectorAll('#contact-list .contact-checkbox:checked');
                if (!broadcastMessageTemplate) { throw new Error("Pesan tidak boleh kosong."); } broadcastQueue = Array.from(checkedBoxes).map(cb => state.contacts.find(c => c.id === cb.dataset.id)).filter(contact => contact && contact.phone && formatWhatsappNumber(contact.phone));
                if (broadcastQueue.length === 0) { throw new Error("Tidak ada pelanggan terpilih yang memiliki nomor telepon valid."); } currentBroadcastIndex = 0;
                setupAndShowBroadcastProgress();
                return `Memulai broadcast untuk ${broadcastQueue.length} pelanggan...`;
            });
            
            const broadcastProgressModalEl = document.getElementById('broadcast-progress-modal');
            const setupAndShowBroadcastProgress = () => {
                document.getElementById('broadcast-actions').classList.remove('hidden');
                document.getElementById('broadcast-complete').classList.add('hidden');
                broadcastProgressModalEl.classList.remove('hidden');
                updateBroadcastProgressUI();
            };
            const updateBroadcastProgressUI = () => {
                if (currentBroadcastIndex >= broadcastQueue.length) {
                    document.getElementById('broadcast-actions').classList.add('hidden');
                    document.getElementById('broadcast-complete').classList.remove('hidden');
                } else {
                    const contact = broadcastQueue[currentBroadcastIndex];
                    document.getElementById('broadcast-progress-status').textContent = `Mengirim ke ${currentBroadcastIndex + 1} dari ${broadcastQueue.length}...`;
                    document.getElementById('broadcast-next-contact-name').textContent = contact.name;
                }
            };
            const hideBroadcastProgress = () => {
                broadcastProgressModalEl.classList.add('hidden');
                broadcastQueue = [];
                currentBroadcastIndex = 0;
                broadcastMessageTemplate = '';
                document.querySelectorAll('.contact-checkbox:checked').forEach(cb => cb.checked = false);
                document.getElementById('broadcast-controls').classList.add('hidden');
            };
            const updateSaleTotal = () => {
                let total = 0;
                document.querySelectorAll('#sale-items-container .sale-item-row').forEach(row => { const itemId = row.querySelector('select[name="itemId"]').value; const itemData = state.inventory.find(i => i.id === itemId); const qty = Number(row.querySelector('input[name="qty"]').value); if (itemData && qty > 0) total += itemData.price * qty; });
                document.getElementById('sale-total-amount').textContent = formatCurrency(total);
            };
            const addSaleItemRow = () => {
                const container = document.getElementById('sale-items-container');
                const itemRow = document.createElement('div');
                itemRow.className = 'sale-item-row flex items-center gap-2';
                const options = state.inventory.map(item => `<option value="${item.id}" data-price="${item.price}">${item.name}</option>`).join('');
                itemRow.innerHTML = `<select name="itemId" class="flex-grow border border-gray-300 rounded-md py-1 px-2 text-sm">${options}</select><input type="number" name="qty" value="1" min="1" class="w-16 border border-gray-300 rounded-md py-1 px-2 text-sm"><button type="button" class="remove-sale-item-btn text-red-500 text-2xl font-bold">&times;</button>`;
                container.appendChild(itemRow);
                updateSaleTotal();
            };
            const updateOrderTotal = () => {
                let subtotal = 0;
                document.querySelectorAll('#order-items-container .order-item-row').forEach(row => {
                    const itemId = row.querySelector('select[name="itemId"]').value;
                    const itemData = state.inventory.find(i => i.id === itemId);
                    const qty = Number(row.querySelector('input[name="qty"]').value);
                    if (itemData && qty > 0) {
                        subtotal += itemData.price * qty;
                    }
                });
                
                const discountValue = parseFloat(document.getElementById('order-discount-value').value) || 0;
                const discountType = document.getElementById('order-discount-type').value;
                
                let discountAmount = 0;
                if (discountType === 'percent') {
                    discountAmount = subtotal * (discountValue / 100);
                } else {
                    discountAmount = discountValue;
                }
                
                discountAmount = Math.min(subtotal, discountAmount);
                
                const finalTotal = subtotal - discountAmount;
                
                document.getElementById('order-subtotal-amount').textContent = formatCurrency(subtotal);
                document.getElementById('order-discount-amount-display').textContent = formatCurrency(discountAmount);
                document.getElementById('order-total-amount').textContent = formatCurrency(finalTotal);
            };
            const addOrderItemRow = () => {
                const container = document.getElementById('order-items-container');
                const itemRow = document.createElement('div');
                itemRow.className = 'order-item-row flex items-center gap-2';
                const options = state.inventory.map(item => `<option value="${item.id}" data-price="${item.price}">${item.name}</option>`).join('');
                itemRow.innerHTML = `<select name="itemId" class="flex-grow border border-gray-300 rounded-md py-1 px-2 text-sm">${options}</select><input type="number" name="qty" value="1" min="1" class="w-16 border border-gray-300 rounded-md py-1 px-2 text-sm"><button type="button" class="remove-order-item-btn text-red-500 text-2xl font-bold">&times;</button>`;
                container.appendChild(itemRow);
                updateOrderTotal();
            };
            const nameInput = customerOrderModal.formEl.querySelector('#customer-name-input');
            const suggestionsBox = customerOrderModal.formEl.querySelector('#customer-suggestions-box');
            const populateContactInfo = (contactName) => {
                const contact = state.contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
                if (contact) {
                    customerOrderModal.formEl.elements['customerPhone'].value = contact.phone || '';
                    customerOrderModal.formEl.elements['alamat'].value = contact.address || '';
                }
            };
            nameInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                if (searchTerm.length === 0) { suggestionsBox.classList.add('hidden'); return; }
                const filteredContacts = state.contacts.filter(contact => contact.name.toLowerCase().includes(searchTerm));
                if (filteredContacts.length > 0) {
                    suggestionsBox.innerHTML = filteredContacts.map(contact => `<div class="p-2 hover:bg-emerald-50 cursor-pointer suggestion-item" data-name="${contact.name}">${contact.name}</div>`).join('');
                    suggestionsBox.classList.remove('hidden');
                } else { suggestionsBox.classList.add('hidden'); }
            });
            nameInput.addEventListener('blur', (e) => {
                setTimeout(() => {
                    populateContactInfo(e.target.value);
                    suggestionsBox.classList.add('hidden');
                }, 200);
            });
            suggestionsBox.addEventListener('click', (e) => {
                if (e.target.classList.contains('suggestion-item')) {
                    const selectedName = e.target.dataset.name;
                    nameInput.value = selectedName;
                    suggestionsBox.classList.add('hidden');
                    populateContactInfo(selectedName);
                }
            });
            
            function updateTurnoverTrendChart() {
                const filteredData = {};
                const startDateValue = document.getElementById('start-date').value;
                if (!startDateValue) return;
                
                for (const dateStr in calculatedDailyData) {
                    const date = new Date(dateStr.replace(/-/g, '/'));
                    const weekOfMonth = getWeekOfMonth(date);
                    if (turnoverChartSelectedWeek === 0 || turnoverChartSelectedWeek === weekOfMonth) {
                        filteredData[dateStr] = calculatedDailyData[dateStr];
                    }
                }
                
                const sortedDates = Object.keys(filteredData).sort();
                const chartLabels = sortedDates.map(dateStr => {
                    const [year, month, day] = dateStr.split('-');
                    const localDate = new Date(year, month - 1, day);
                    return localDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                });
                const makanData = sortedDates.map(date => filteredData[date]["Makan ditempat"]);
                const naskotData = sortedDates.map(date => filteredData[date]["Naskot"]);
                const onlineData = sortedDates.map(date => filteredData[date]["Online"]);
                
                renderFunctions.renderOmsetTrendChart(chartLabels, makanData, naskotData, onlineData);
                
                document.querySelectorAll('.turnover-chart-week-btn').forEach(btn => {
                    const week = parseInt(btn.dataset.week);
                    if (week === turnoverChartSelectedWeek) {
                        btn.classList.add('bg-emerald-100', 'text-emerald-800');
                        btn.classList.remove('text-gray-500');
                    } else {
                        btn.classList.remove('bg-emerald-100', 'text-emerald-800');
                        btn.classList.add('text-gray-500');
                    }
                });
            }
            
            
            
            navButtons.forEach(button => button.addEventListener('click', () => navigateTo(button.dataset.target)));
            document.getElementById('shortcut-new-contact').addEventListener('click', () => navigateTo('pihak'));
            document.getElementById('shortcut-reservation').addEventListener('click', () => navigateTo('reservasi'));
            document.getElementById('shortcut-new-expense').addEventListener('click', () => navigateTo('laporan'));
            document.getElementById('shortcut-attendance').addEventListener('click', () => document.getElementById('btn-laporan-absensi').click());
            document.getElementById('shortcut-new-order').addEventListener('click', () => {
                if (state.inventory.length === 0) { showToast("Tidak ada barang di inventaris."); return; }
                const form = customerOrderModal.formEl;
                form.elements['orderDate'].value = new Date().toISOString().split('T')[0];
                document.getElementById('order-items-container').innerHTML = '';
                addOrderItemRow();
                customerOrderModal.show();
            });
            
            document.getElementById('btn-view-checklist').addEventListener('click', () => navigateTo('checklist'));
            document.getElementById('back-to-lainnya-btn').addEventListener('click', () => navigateTo('lainnya'));
            document.getElementById('btn-kalkulator-omset').addEventListener('click', () => navigateTo('kalkulator-omset'));
            document.getElementById('back-to-lainnya-from-calc-btn').addEventListener('click', () => navigateTo('lainnya'));
            document.getElementById('btn-impor-laporan').addEventListener('click', () => navigateTo('laporan-harian'));
            document.getElementById('back-to-lainnya-from-laporan-btn').addEventListener('click', () => navigateTo('lainnya'));
            document.querySelectorAll('.chart-week-btn').forEach(button => {
                button.addEventListener('click', () => {
                    chartSelectedWeek = parseInt(button.dataset.week);
                    renderFunctions.renderDashboard();
                });
            });
            
            document.getElementById('btn-laporan-bulanan').addEventListener('click', () => {
                renderFunctions.renderMonthlyTurnoverReport();
                navigateTo('laporan-bulanan');
            });
            document.getElementById('back-to-lainnya-from-monthly-btn').addEventListener('click', () => navigateTo('lainnya'));
            
            document.getElementById('hitung-omset-btn').addEventListener('click', () => {
                const startDateEl = document.getElementById('start-date');
                const endDateEl = document.getElementById('end-date');
                const hasilContainer = document.getElementById('hasil-omset-container');
                if (!startDateEl.value || !endDateEl.value) {
                    showToast("Silakan pilih tanggal mulai dan selesai.");
                    return;
                }
                const startDate = new Date(startDateEl.value);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(endDateEl.value);
                endDate.setHours(23, 59, 59, 999);
                if (startDate > endDate) {
                    showToast("Tanggal mulai tidak boleh lebih dari tanggal selesai.");
                    return;
                }
                const filteredReports = state.dailyReports.filter(report => {
                    if (!report.date) return false;
                    const reportDate = report.date.toDate();
                    return reportDate >= startDate && reportDate <= endDate;
                });
                if (filteredReports.length === 0) {
                    showToast("Tidak ada data laporan harian pada rentang tanggal tersebut.");
                    hasilContainer.classList.add('hidden');
                    return;
                }
                const totals = {
                    aps: { "Makan ditempat": 0, "Naskot": 0, "Online": 0, total: 0 },
                    mj: { "Makan ditempat": 0, "Naskot": 0, "Online": 0, total: 0 },
                };
                calculatedDailyData = {};
                filteredReports.forEach(report => {
                    const apsData = report.restaurants["Ayam Penyet Surabaya"];
                    if (apsData && apsData.phones) {
                        Object.values(apsData.phones).forEach(phoneData => {
                            totals.aps["Makan ditempat"] += phoneData["Makan ditempat"] || 0;
                            totals.aps["Naskot"] += phoneData["Naskot"] || 0;
                            totals.aps["Online"] += phoneData["Online"] || 0;
                        });
                    }
                    const mjData = report.restaurants["Mie Jogja"];
                    if (mjData && mjData.phones) {
                        Object.values(mjData.phones).forEach(phoneData => {
                            totals.mj["Makan ditempat"] += phoneData["Makan ditempat"] || 0;
                            totals.mj["Naskot"] += phoneData["Naskot"] || 0;
                            totals.mj["Online"] += phoneData["Online"] || 0;
                        });
                    }
                    const jsDate = report.date.toDate();
                    const dateString = `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}-${String(jsDate.getDate()).padStart(2, '0')}`;
                    if (!calculatedDailyData[dateString]) {
                        calculatedDailyData[dateString] = { "Makan ditempat": 0, "Naskot": 0, "Online": 0 };
                    }
                    Object.values(report.restaurants).forEach(restoData => {
                        if (restoData && restoData.phones) {
                            Object.values(restoData.phones).forEach(phoneData => {
                                calculatedDailyData[dateString]["Makan ditempat"] += phoneData["Makan ditempat"] || 0;
                                calculatedDailyData[dateString]["Naskot"] += phoneData["Naskot"] || 0;
                                calculatedDailyData[dateString]["Online"] += phoneData["Online"] || 0;
                            });
                        }
                    });
                });
                totals.aps.total = totals.aps["Makan ditempat"] + totals.aps["Naskot"] + totals.aps["Online"];
                totals.mj.total = totals.mj["Makan ditempat"] + totals.mj["Naskot"] + totals.mj["Online"];
                const grandTotal = totals.aps.total + totals.mj.total;
                document.getElementById('aps-makan').textContent = formatCurrency(totals.aps["Makan ditempat"]);
                document.getElementById('aps-naskot').textContent = formatCurrency(totals.aps["Naskot"]);
                document.getElementById('aps-online').textContent = formatCurrency(totals.aps["Online"]);
                document.getElementById('aps-total').textContent = formatCurrency(totals.aps.total);
                document.getElementById('mj-makan').textContent = formatCurrency(totals.mj["Makan ditempat"]);
                document.getElementById('mj-naskot').textContent = formatCurrency(totals.mj["Naskot"]);
                document.getElementById('mj-online').textContent = formatCurrency(totals.mj["Online"]);
                document.getElementById('mj-total').textContent = formatCurrency(totals.mj.total);
                document.getElementById('grand-total-omset').textContent = formatCurrency(grandTotal);
                turnoverChartSelectedWeek = 0;
                updateTurnoverTrendChart();
                hasilContainer.classList.remove('hidden');
            });
            
            document.getElementById('omset-trend-chart-container').addEventListener('click', (e) => {
                const target = e.target.closest('.turnover-chart-week-btn');
                
                if (target) {
                    turnoverChartSelectedWeek = parseInt(target.dataset.week);
                    updateTurnoverTrendChart();
                }
            });
            
            document.getElementById('proses-laporan-btn').addEventListener('click', async () => {
                const textarea = document.getElementById('laporan-harian-input');
                const rawText = textarea.value;
                if (!rawText.trim()) { showToast("Kotak teks tidak boleh kosong."); return; }
                try {
                    const reportData = parseDailyReport(rawText);
                    const jsDate = reportData.date.toDate();
                    const year = jsDate.getFullYear();
                    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
                    const day = String(jsDate.getDate()).padStart(2, '0');
                    const dateString = `${year}-${month}-${day}`;
                    const docRef = doc(db, 'daily_reports', dateString);
                    await setDoc(docRef, reportData);
                    showToast(`Laporan untuk tanggal ${dateString} berhasil disimpan!`);
                    textarea.value = '';
                } catch (error) {
                    console.error("Gagal memproses laporan:", error);
                    showToast(error.message);
                }
            });
            
            document.getElementById('btn-kalkulator-online').addEventListener('click', () => navigateTo('kalkulator-online'));
            document.getElementById('back-to-lainnya-from-online-calc-btn').addEventListener('click', () => navigateTo('lainnya'));
            
            document.getElementById('hitung-online-btn').addEventListener('click', () => {
                const parseInput = (id) => parseFloat(document.getElementById(id).value) || 0;
                
                const apsGrabPendapatan = parseInput('aps-grab-input');
                const apsGojekPendapatan = parseInput('aps-gojek-input');
                const apsShopeePendapatan = parseInput('aps-shopee-input');
                const mjGrabPendapatan = parseInput('mj-grab-input');
                const mjGojekPendapatan = parseInput('mj-gojek-input');
                const mjShopeePendapatan = parseInput('mj-shopee-input');
                
                const apsGrabKomisi = Math.floor((apsGrabPendapatan * 0.10) / 1.1);
                const apsGojekKomisi = Math.floor((apsGojekPendapatan * 0.13) / 1.1);
                const apsShopeeKomisi = Math.floor(apsShopeePendapatan * 0.10);
                
                const apsGrabBersih = apsGrabPendapatan - apsGrabKomisi;
                const apsGojekBersih = apsGojekPendapatan - apsGojekKomisi;
                const apsShopeeBersih = apsShopeePendapatan - apsShopeeKomisi;
                const apsTotalBersih = apsGrabBersih + apsGojekBersih + apsShopeeBersih;
                
                const mjGrabKomisi = Math.floor((mjGrabPendapatan * 0.10) / 1.1);
                const mjGojekKomisi = Math.floor((mjGojekPendapatan * 0.13) / 1.1);
                const mjShopeeKomisi = Math.floor(mjShopeePendapatan * 0.10);
                
                const mjGrabBersih = mjGrabPendapatan - mjGrabKomisi;
                const mjGojekBersih = mjGojekPendapatan - mjGojekKomisi;
                const mjShopeeBersih = mjShopeePendapatan - mjShopeeKomisi;
                const mjTotalBersih = mjGrabBersih + mjGojekBersih + mjShopeeBersih;
                
                const grandTotalOnline = apsTotalBersih + mjTotalBersih;
                const totalBersihGrab = apsGrabBersih + mjGrabBersih;
                const totalBersihGojek = apsGojekBersih + mjGojekBersih;
                const totalBersihShopee = apsShopeeBersih + mjShopeeBersih;
                
                
                
                document.getElementById('aps-grab-komisi').textContent = formatCurrency(apsGrabKomisi);
                document.getElementById('aps-grab-bersih').textContent = formatCurrency(apsGrabBersih);
                document.getElementById('aps-gojek-komisi').textContent = formatCurrency(apsGojekKomisi);
                document.getElementById('aps-gojek-bersih').textContent = formatCurrency(apsGojekBersih);
                document.getElementById('aps-shopee-komisi').textContent = formatCurrency(apsShopeeKomisi);
                document.getElementById('aps-shopee-bersih').textContent = formatCurrency(apsShopeeBersih);
                document.getElementById('aps-total-bersih').textContent = formatCurrency(apsTotalBersih);
                
                document.getElementById('mj-grab-komisi').textContent = formatCurrency(mjGrabKomisi);
                document.getElementById('mj-grab-bersih').textContent = formatCurrency(mjGrabBersih);
                document.getElementById('mj-gojek-komisi').textContent = formatCurrency(mjGojekKomisi);
                document.getElementById('mj-gojek-bersih').textContent = formatCurrency(mjGojekBersih);
                document.getElementById('mj-shopee-komisi').textContent = formatCurrency(mjShopeeKomisi);
                document.getElementById('mj-shopee-bersih').textContent = formatCurrency(mjShopeeBersih);
                document.getElementById('mj-total-bersih').textContent = formatCurrency(mjTotalBersih);
                document.getElementById('total-bersih-grab').textContent = formatCurrency(totalBersihGrab);
                document.getElementById('total-bersih-grab').textContent = formatCurrency(totalBersihGrab);
                document.getElementById('total-bersih-gojek').textContent = formatCurrency(totalBersihGojek);
                document.getElementById('total-bersih-shopee').textContent = formatCurrency(totalBersihShopee);
                
                
                document.getElementById('grand-total-online').textContent = formatCurrency(grandTotalOnline);
                
                document.getElementById('hasil-online-container').classList.remove('hidden');
            });
            document.body.addEventListener('click', async (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                
                // --- Logika Halaman Reservasi ---
                if (target.id === 'fab-add-reservation') {
                    const today = new Date();
                    const dateString = today.toISOString().split('T')[0];
                    reservationModal.show({ reservationDate: dateString, reservationTime: '07:00' });
                }
                if (target.classList.contains('edit-reservation-btn')) {
                    const resId = target.dataset.id;
                    const reservation = state.reservations.find(r => r.id === resId);
                    if (reservation) {
                        const dateForInput = reservation.reservationDate.toDate().toISOString().split('T')[0];
                        const dataToEdit = { ...reservation, reservationDate: dateForInput };
                        reservationModal.show(dataToEdit);
                    }
                }
                if (target.classList.contains('cancel-reservation-btn')) {
                    const resId = target.dataset.id;
                    const confirmed = await confirmCancelReservationModal.show();
                    if (confirmed) {
                        try {
                            await updateDoc(doc(db, 'reservations', resId), { status: 'cancelled' });
                            showToast('Reservasi telah dibatalkan.');
                        } catch (error) {
                            console.error("Gagal membatalkan reservasi:", error);
                            showToast("Gagal membatalkan reservasi.");
                        }
                    }
                }
                if (target.classList.contains('mark-arrived-btn')) {
                    const resId = target.dataset.id;
                    try {
                        await updateDoc(doc(db, 'reservations', resId), { status: 'arrived' });
                        showToast('Status reservasi diperbarui: Telah Tiba.');
                    } catch (error) { showToast('Gagal memperbarui status.'); }
                }
                if (target.classList.contains('mark-completed-btn')) {
                    const resId = target.dataset.id;
                    try {
                        await updateDoc(doc(db, 'reservations', resId), { status: 'completed' });
                        showToast('Reservasi telah ditandai selesai.');
                    } catch (error) { showToast('Gagal memperbarui status.'); }
                }
                
                if (target && target.classList.contains('delete-reservation-btn')) {
                    const resId = target.dataset.id;
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        try {
                            await deleteDoc(doc(db, 'reservations', resId));
                            showToast('Reservasi telah dihapus permanen.');
                        } catch (error) {
                            console.error("Gagal menghapus reservasi:", error);
                            showToast("Gagal menghapus reservasi.");
                        }
                    }
                }
                if (target.classList.contains('delete-completed-order-btn')) {
                    const orderId = target.dataset.orderId;
                    const transactionId = target.dataset.transactionId;
                    if (!orderId || !transactionId) { showToast("Error: ID pesanan atau transaksi tidak ditemukan."); return; }
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        try {
                            const batch = writeBatch(db);
                            const orderRef = doc(db, "customer_orders", orderId);
                            const transactionRef = doc(db, "transactions", transactionId);
                            batch.delete(orderRef);
                            batch.delete(transactionRef);
                            await batch.commit();
                            showToast("Pesanan dan faktur terkait berhasil dihapus.");
                        } catch (error) {
                            console.error("Gagal menghapus pesanan dan transaksi:", error);
                            showToast("Gagal menghapus data.");
                        }
                    }
                }
                // --- MODIFIKASI: Logika Tombol Faktur (Tanpa Watermark) ---
                if (target.classList.contains('invoice-btn') || target.classList.contains('reprint-invoice-btn')) {
                    const transactionId = target.dataset.id;
                    if (transactionId) {
                        renderFunctions.generateInvoice(transactionId, false); // false = tanpa watermark
                    } else {
                        showToast("ID Faktur tidak ditemukan.");
                    }
                }
                
                // --- TAMBAHAN: Logika Tombol Faktur (Dengan Watermark LUNAS) ---
                if (target.classList.contains('invoice-paid-btn') || target.classList.contains('reprint-invoice-paid-btn')) {
                    const transactionId = target.dataset.id;
                    if (transactionId) {
                        renderFunctions.generateInvoice(transactionId, true); // true = dengan watermark
                    } else {
                        showToast("ID Faktur tidak ditemukan.");
                    }
                }
                if (target.classList.contains('create-invoice-from-order-btn')) {
                    const orderId = target.dataset.id;
                    const order = state.customerOrders.find(o => o.id === orderId);
                    if (!order) { showToast("Error: Pesanan tidak ditemukan."); return; }
                    const confirmed = await confirmInvoiceModal.show();
                    if (confirmed) {
                        try {
                            const batch = writeBatch(db);
                            const newTransactionRef = doc(collection(db, "transactions"));
                            batch.set(newTransactionRef, { contactId: order.contactId, contactName: order.contactName, items: order.items, subtotal: order.subtotal, discountType: order.discountType || 'percent', discountValue: order.discountValue || 0, discountAmount: order.discountAmount || 0, total: order.total, type: 'sale', date: order.orderDate, address: order.alamat || '' });
                            const orderRef = doc(db, "customer_orders", orderId);
                            batch.update(orderRef, { status: "completed" });
                            await batch.commit();
                            showToast("Faktur berhasil dibuat dari pesanan!");
                        } catch (error) {
                            console.error("Gagal membuat faktur dari pesanan:", error);
                            showToast("Gagal memproses faktur.");
                        }
                    }
                }
                
                // --- Logika CRUD Umum (Kontak, Item, Belanja, dll) ---
                if (target.id === 'fab-add-contact') contactModal.show();
                if (target.id === 'fab-add-item') itemModal.show();
                if (target.id === 'fab-add-expense') { expenseModal.show({ purchaseDate: new Date().toISOString().split('T')[0] }); }
                if (target.id === 'fab-add-sale') navigateTo('page-penjualan');
                if (target.id === 'fab-add-order') document.getElementById('shortcut-new-order').click();
                if (target.classList.contains('edit-contact-btn')) { const contact = state.contacts.find(c => c.id === target.dataset.id); if (contact) contactModal.show(contact); }
                if (target.classList.contains('delete-contact-btn')) {
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        await deleteDoc(doc(db, 'contacts', target.dataset.id));
                        showToast('Pelanggan berhasil dihapus.');
                    }
                }
                if (target.classList.contains('edit-item-btn')) { const item = state.inventory.find(i => i.id === target.dataset.id); if (item) itemModal.show(item); }
                if (target.classList.contains('delete-item-btn')) {
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        await deleteDoc(doc(db, 'inventory', target.dataset.id));
                        showToast('Barang berhasil dihapus.');
                    }
                }
                if (target.classList.contains('delete-tx-btn')) {
                    const txId = target.dataset.id;
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        await deleteDoc(doc(db, 'transactions', txId));
                        showToast('Transaksi berhasil dihapus.');
                    }
                }
                if (target.classList.contains('delete-order-btn')) {
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        await deleteDoc(doc(db, 'customer_orders', target.dataset.id));
                        showToast('Pesanan berhasil dihapus.');
                    }
                }
                if (target.classList.contains('delete-expense-btn')) {
                    const expenseId = target.dataset.id;
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        await deleteDoc(doc(db, 'monthly_expenses', expenseId));
                        showToast('Item belanja berhasil dihapus.');
                    }
                }
                if (target.classList.contains('delete-daily-report-btn')) {
                    const reportId = target.dataset.id;
                    const confirmed = await confirmDeleteModal.show();
                    if (confirmed) {
                        await deleteDoc(doc(db, 'daily_reports', reportId));
                        showToast('Laporan harian berhasil dihapus.');
                    }
                }
                
                // --- Logika Form Dinamis (Tambah/Hapus Item) ---
                if (target.id === 'add-sale-item-btn') addSaleItemRow();
                if (target.classList.contains('remove-sale-item-btn')) {
                    target.closest('.sale-item-row').remove();
                    updateSaleTotal();
                }
                if (target.id === 'add-order-item-btn') addOrderItemRow();
                if (target.classList.contains('remove-order-item-btn')) {
                    target.closest('.order-item-row').remove();
                    updateOrderTotal();
                }
                
                // --- Lain-lain ---
                if (target.classList.contains('view-customer-details-btn')) {
                    const customerId = target.dataset.id;
                    const sales = state.transactions.filter(tx => tx.type === 'sale' && tx.contactId === customerId);
                    const detailsEl = document.getElementById('customer-item-details');
                    if (sales.length > 0) {
                        const historyHtml = sales.map(sale => { const itemsHtml = sale.items.map(item => `<li class="text-sm text-gray-700">${item.qty}x ${item.name} <span class="text-gray-500">@ ${formatCurrency(item.price)}</span></li>`).join(''); return `<div class="border rounded-lg p-3 mb-3"><div class="flex justify-between items-center mb-2 pb-2 border-b"><p class="font-semibold text-gray-700">${formatDate(sale.date)}</p><p class="font-bold text-emerald-600">${formatCurrency(sale.total)}</p></div><ul class="list-disc pl-5 mb-3">${itemsHtml}</ul><div class="text-right space-x-2"><button data-id="${sale.id}" class="invoice-btn text-xs font-bold text-blue-600">ULANG FAKTUR</button><button data-id="${sale.id}" class="invoice-paid-btn text-xs font-bold text-green-600">ULANG (LUNAS)</button></div></div>`; }).join('');
                        detailsEl.innerHTML = `<div class="space-y-3">${historyHtml}</div>`;
                    } else { detailsEl.innerHTML = `<p class="text-center text-gray-500">Tidak ada riwayat transaksi.</p>`; }
                    customerDetailModal.show();
                }
                if (target.classList.contains('save-comment-btn')) {
                    const reportId = target.dataset.reportId;
                    const taskId = target.dataset.taskId;
                    const inputEl = target.previousElementSibling;
                    const commentText = inputEl.value;
                    if (!reportId || !taskId) { showToast("Error: ID Laporan atau Tugas tidak ditemukan."); return; }
                    try {
                        const reportRef = doc(db, 'checklist_history', reportId);
                        await updateDoc(reportRef, {
                            [`tasks.${taskId}.staffComment`]: commentText
                        });
                        showToast(`Komentar disimpan.`);
                    } catch (error) {
                        console.error("Gagal menyimpan komentar:", error);
                        showToast("Gagal menyimpan komentar.");
                    }
                }
            });
            
            saleModal.modalEl.addEventListener('change', (e) => { if (e.target.name === 'itemId' || e.target.name === 'qty') updateSaleTotal(); });
            customerOrderModal.modalEl.addEventListener('change', (e) => {
                const target = e.target;
                if (target.name === 'itemId') {
                    updateOrderTotal();
                }
            });
            document.getElementById('salesSearchInput').addEventListener('input', renderFunctions.renderSalesReport);
            document.getElementById('salesMonthFilter').addEventListener('change', renderFunctions.renderSalesReport);
            document.getElementById('resetSalesFilter').addEventListener('click', () => {
                document.getElementById('salesSearchInput').value = '';
                document.getElementById('salesMonthFilter').value = '';
                renderFunctions.renderSalesReport();
            });
            document.getElementById('contactSearchInput').addEventListener('input', renderFunctions.renderContactList);
            document.getElementById('completedOrderSearchInput').addEventListener('input', renderFunctions.renderCompletedOrderList);
            const contactListEl = document.getElementById('contact-list');
            const broadcastControlsEl = document.getElementById('broadcast-controls');
            const selectedCountEl = document.getElementById('selected-count');
            const updateBroadcastControls = () => {
                const contactListEl = document.getElementById('contact-list');
                const broadcastControlsEl = document.getElementById('broadcast-controls');
                const selectedCountEl = document.getElementById('selected-count');
                const selectAllCheckbox = document.getElementById('select-all-contacts-checkbox');
                
                const allCheckboxes = contactListEl.querySelectorAll('.contact-checkbox');
                const checkedCheckboxes = contactListEl.querySelectorAll('.contact-checkbox:checked');
                const checkedCount = checkedCheckboxes.length;
                
                // Tampilkan atau sembunyikan bar broadcast
                if (checkedCount > 0) {
                    selectedCountEl.textContent = checkedCount;
                    broadcastControlsEl.classList.remove('hidden');
                } else {
                    broadcastControlsEl.classList.add('hidden');
                }
                
                // Sinkronkan status checkbox "Pilih Semua"
                if (allCheckboxes.length > 0 && checkedCount === allCheckboxes.length) {
                    selectAllCheckbox.checked = true;
                } else {
                    selectAllCheckbox.checked = false;
                }
            };
            contactListEl.addEventListener('change', e => {
                if (e.target.classList.contains('contact-checkbox')) {
                    updateBroadcastControls();
                }
            });
            document.getElementById('select-all-contacts-checkbox').addEventListener('click', (e) => {
                const isChecked = e.target.checked;
                const allVisibleCheckboxes = document.querySelectorAll('#contact-list .contact-checkbox');
                
                allVisibleCheckboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
                
                updateBroadcastControls();
            });
            document.getElementById('show-broadcast-modal').addEventListener('click', () => { broadcastModal.show(); });
            document.getElementById('broadcast-send-next-btn').addEventListener('click', () => {
                if (currentBroadcastIndex < broadcastQueue.length) {
                    const contact = broadcastQueue[currentBroadcastIndex];
                    const message = broadcastMessageTemplate.replace(/{nama}/g, contact.name.split(' ')[0]);
                    const whatsappNumber = formatWhatsappNumber(contact.phone);
                    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                    currentBroadcastIndex++;
                    updateBroadcastProgressUI();
                }
            });
            document.getElementById('broadcast-cancel-btn').addEventListener('click', hideBroadcastProgress);
            document.getElementById('broadcast-close-btn').addEventListener('click', hideBroadcastProgress);
            document.getElementById('exportSalesCsvBtn').addEventListener('click', () => {
                const selectedMonth = document.getElementById('salesMonthFilter').value;
                const headers = ["Tanggal", "Pelanggan", "Item", "Jumlah", "Harga Satuan", "Subtotal"];
                let dataToExport = state.transactions.filter(tx => tx.type === 'sale');
                if (selectedMonth) { dataToExport = dataToExport.filter(tx => new Date(tx.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth); }
                const data = dataToExport.flatMap(tx => tx.items.map(item => [formatDate(tx.date), tx.contactName, item.name, item.qty, item.price, item.qty * item.price]));
                const filename = `laporan_penjualan_${selectedMonth ? selectedMonth.replace(' ', '_') : 'semua'}_${new Date().toISOString().split('T')[0]}.csv`;
                exportToCsv(filename, headers, data);
            });
            document.getElementById('exportExpensesCsvBtn').addEventListener('click', () => {
                const selectedMonth = document.getElementById('expenseMonthFilter').value;
                const headers = ["Tanggal Pembelian", "Nama Toko", "Nama Barang", "Jumlah/Satuan", "Total Harga"];
                let dataToExport = state.monthlyExpenses;
                if (selectedMonth) { dataToExport = dataToExport.filter(ex => new Date(ex.date.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth); }
                if (dataToExport.length === 0) { showToast('Tidak ada data belanja untuk diekspor.'); return; }
                const data = dataToExport.map(ex => [formatDate(ex.date), ex.storeName, ex.itemName, ex.quantity, ex.total]);
                const filename = `laporan_belanja_${selectedMonth ? selectedMonth.replace(' ', '_') : 'semua'}_${new Date().toISOString().split('T')[0]}.csv`;
                exportToCsv(filename, headers, data);
            });
            document.getElementById('expenseMonthFilter').addEventListener('change', renderFunctions.renderExpenseReport);
            document.getElementById('resetExpenseFilter').addEventListener('click', () => {
                document.getElementById('expenseMonthFilter').value = '';
                renderFunctions.renderExpenseReport();
            });
            document.getElementById('exportCompletedOrdersCsvBtn').addEventListener('click', () => {
                const selectedMonth = document.getElementById('completedOrderMonthFilter').value;
                const headers = ["Tanggal Pesan", "Nama Pelanggan", "Alamat", "Nama Item", "Jumlah", "Harga Satuan", "Subtotal"];
                let dataToExport = state.customerOrders.filter(o => o.status === 'completed');
                if (selectedMonth) { dataToExport = dataToExport.filter(o => new Date(o.orderDate.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth); }
                if (dataToExport.length === 0) { showToast('Tidak ada data pesanan selesai untuk diekspor.'); return; }
                const data = dataToExport.flatMap(order => order.items.map(item => [formatDate(order.orderDate), order.contactName, order.alamat || '-', item.name, item.qty, item.price, item.qty * item.price]));
                const filename = `laporan_pesanan_selesai_${selectedMonth ? selectedMonth.replace(' ', '_') : 'semua'}_${new Date().toISOString().split('T')[0]}.csv`;
                exportToCsv(filename, headers, data);
                showToast('Laporan pesanan selesai sedang diunduh...');
            });
            document.getElementById('checklistMonthFilter').addEventListener('change', renderFunctions.renderChecklistReport);
            document.getElementById('exportChecklistCsvBtn').addEventListener('click', () => {
                const selectedMonth = document.getElementById('checklistMonthFilter').value;
                const headers = ["Tanggal", "Tugas", "Dikerjakan Oleh", "Link Bukti Foto"];
                let dataToExport = state.checklistHistory;
                if (selectedMonth) { dataToExport = dataToExport.filter(report => report.tanggal && new Date(report.tanggal.seconds * 1000).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === selectedMonth); }
                if (dataToExport.length === 0) { showToast('Tidak ada data kebersihan untuk diekspor.'); return; }
                const data = dataToExport.flatMap(report => (report.tasks || []).filter(t => t.done).map(task => [formatDate(report.tanggal), task.text, task.completedBy || 'N/A', task.proofUrl || 'N/A']));
                const filename = `laporan_kebersihan_${selectedMonth ? selectedMonth.replace(' ', '_') : 'semua'}_${new Date().toISOString().split('T')[0]}.csv`;
                exportToCsv(filename, headers, data);
                showToast('Laporan kebersihan sedang diunduh...');
            });
            
            
            document.getElementById('show-custom-date-picker').addEventListener('click', () => {
                let tempDate = new Date(reservationFilter.date);
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                
                const updatePickerUI = (modalEl) => {
                    modalEl.querySelector('#picker-day').textContent = tempDate.getDate();
                    modalEl.querySelector('#picker-month').textContent = monthNames[tempDate.getMonth()];
                    modalEl.querySelector('#picker-year').textContent = tempDate.getFullYear();
                };
                
                const modalContent = `
        <div class="text-center">
            <div class="grid grid-cols-3 gap-2 items-center text-gray-700">
                <button data-action="inc" data-unit="day" class="date-picker-btn text-xl font-light p-2 bg-gray-100 rounded-lg">+</button>
                <button data-action="inc" data-unit="month" class="date-picker-btn text-xl font-light p-2 bg-gray-100 rounded-lg">+</button>
                <button data-action="inc" data-unit="year" class="date-picker-btn text-xl font-light p-2 bg-gray-100 rounded-lg">+</button>

                <div id="picker-day" class="text-2xl font-bold bg-emerald-100 text-emerald-800 p-2 rounded-lg"></div>
                <div id="picker-month" class="text-2xl font-bold bg-emerald-100 text-emerald-800 p-2 rounded-lg"></div>
                <div id="picker-year" class="text-2xl font-bold bg-emerald-100 text-emerald-800 p-2 rounded-lg"></div>

                <button data-action="dec" data-unit="day" class="date-picker-btn text-xl font-light p-2 bg-gray-100 rounded-lg">-</button>
                <button data-action="dec" data-unit="month" class="date-picker-btn text-xl font-light p-2 bg-gray-100 rounded-lg">-</button>
                <button data-action="dec" data-unit="year" class="date-picker-btn text-xl font-light p-2 bg-gray-100 rounded-lg">-</button>
            </div>
            <div class="flex gap-4 mt-6">
                <button id="picker-close" class="w-full py-2.5 border rounded-lg">Tutup</button>
                <button id="picker-select" class="w-full py-2.5 rounded-lg bg-gray-800 text-white font-semibold">Pilih</button>
            </div>
        </div>
    `;
                
                const pickerModal = createModal('picker-modal', 'Pilih Tanggal', modalContent, () => {});
                pickerModal.show();
                updatePickerUI(pickerModal.modalEl);
                
                pickerModal.modalEl.querySelector('.modal-content').addEventListener('click', (e) => {
                    const btn = e.target.closest('.date-picker-btn');
                    if (btn) {
                        const { action, unit } = btn.dataset;
                        const change = action === 'inc' ? 1 : -1;
                        if (unit === 'day') tempDate.setDate(tempDate.getDate() + change);
                        if (unit === 'month') tempDate.setMonth(tempDate.getMonth() + change);
                        if (unit === 'year') tempDate.setFullYear(tempDate.getFullYear() + change);
                        updatePickerUI(pickerModal.modalEl);
                    }
                    
                    if (e.target.id === 'picker-select') {
                        reservationFilter.date = tempDate;
                        document.getElementById('show-custom-date-picker').textContent = tempDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                        renderFunctions.renderReservations();
                        pickerModal.hide();
                    }
                    if (e.target.id === 'picker-close') {
                        pickerModal.hide();
                    }
                });
            });
            
            
            const resetAndInitializeFilter = () => {
                reservationFilter.date = new Date();
                reservationFilter.status = '';
                reservationFilter.searchTerm = '';
                
                document.getElementById('show-custom-date-picker').textContent = reservationFilter.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                
                document.getElementById('reservation-status-filter').textContent = "Semua Status";
                document.getElementById('reservation-search-input').value = '';
                
                //renderFunctions.renderReservations();
            };
            document.getElementById('reservation-status-filter').addEventListener('click', () => {
                const statusOptions = [
                    { value: '', text: 'Semua Status' },
                    { value: 'confirmed', text: 'Dikonfirmasi' },
                    { value: 'arrived', text: 'Telah Tiba' },
                    { value: 'completed', text: 'Selesai' },
                    { value: 'cancelled', text: 'Dibatalkan' }
                ];
                
                const statusButtonsHTML = statusOptions.map(opt =>
                    `<button class="status-select-btn w-full text-left p-3 hover:bg-gray-100" data-value="${opt.value}">${opt.text}</button>`
                ).join('');
                
                const statusModal = createModal('status-filter-modal', 'Pilih Status', `<div class="flex flex-col">${statusButtonsHTML}</div>`, () => {});
                statusModal.show();
                
                statusModal.modalEl.querySelector('.modal-content').addEventListener('click', (e) => {
                    const target = e.target.closest('.status-select-btn');
                    if (target) {
                        reservationFilter.status = target.dataset.value;
                        document.getElementById('reservation-status-filter').textContent = target.textContent;
                        renderFunctions.renderReservations();
                        statusModal.hide();
                    }
                });
            });
            resetAndInitializeFilter();
            customerOrderModal.modalEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('order-discount-type-btn')) {
                    const type = e.target.dataset.type;
                    customerOrderModal.formEl.querySelector('#order-discount-type').value = type;
                    
                    // Atur tampilan tombol aktif
                    customerOrderModal.formEl.querySelectorAll('.order-discount-type-btn').forEach(btn => {
                        btn.classList.remove('bg-emerald-100', 'text-emerald-800');
                        btn.classList.add('text-gray-500');
                    });
                    e.target.classList.add('bg-emerald-100', 'text-emerald-800');
                    e.target.classList.remove('text-gray-500');
                    
                    updateOrderTotal();
                }
            });
            
            customerOrderModal.modalEl.addEventListener('input', (e) => {
                const target = e.target;
                if (target.name === 'qty' || target.id === 'order-discount-value') {
                    updateOrderTotal();
                }
            });
            
            
            document.getElementById('btn-hitung-fisik').addEventListener('click', () => {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('uf-tanggal').value = today;
                navigateTo('hitung-fisik');
            });
            document.getElementById('back-to-lainnya-from-fisik-btn').addEventListener('click', () => navigateTo('lainnya'));
            
            const formHitungFisik = document.getElementById('form-hitung-fisik');
            
            const hitungUangFisik = () => {
                const parseInput = (el) => parseFloat(el.value) || 0;
                
                // Menghitung total uang fisik di laci (Uang Kertas + Koin)
                let totalUangKertas = 0;
                formHitungFisik.querySelectorAll('.uf-input-kertas').forEach(input => {
                    const qty = parseInput(input);
                    const value = parseFloat(input.dataset.value);
                    const subtotal = qty * value;
                    totalUangKertas += subtotal;
                    document.getElementById(`uf-subtotal-${input.id.split('-')[2]}`).textContent = formatCurrency(subtotal);
                });
                const totalKoin = parseInput(document.getElementById('uf-input-koin'));
                const totalFisikDiLaci = totalUangKertas + totalKoin;
                document.getElementById('uf-total-fisik-laci').textContent = formatCurrency(totalFisikDiLaci);
                
                // Menghitung total pengeluaran
                let totalPengeluaran = 0;
                formHitungFisik.querySelectorAll('.uf-input-pengeluaran').forEach(input => {
                    totalPengeluaran += parseInput(input);
                });
                document.getElementById('uf-total-pengeluaran').textContent = formatCurrency(totalPengeluaran);
                
                // Menghitung total non-tunai
                let totalNonTunai = 0;
                formHitungFisik.querySelectorAll('.uf-input-nontunai').forEach(input => {
                    totalNonTunai += parseInput(input);
                });
                document.getElementById('uf-total-nontunai').textContent = formatCurrency(totalNonTunai);
                
                // Menghitung rekonsiliasi akhir dengan LOGIKA BARU DARI ANDA
                const modalKasir = parseInput(document.getElementById('uf-modal-kasir'));
                const totalPenjualanSistem = parseInput(document.getElementById('uf-total-penjualan-sistem'));
                
                // Langkah 1: (Uang fisik + pengeluaran)
                const grossCash = totalFisikDiLaci + totalPengeluaran;
                
                // Langkah 2: (Hasil Langkah 1 - modal kasir)
                const totalUangFisikBaru = grossCash - modalKasir;
                
                // Langkah 3: (Hasil Langkah 2 + uang non tunai)
                const totalUangSeharusnya = totalUangFisikBaru + totalNonTunai;
                document.getElementById('uf-total-seharusnya').textContent = formatCurrency(totalUangSeharusnya);
                
                // Hitung Selisih (membandingkan hasil akhir dengan penjualan sistem)
                const selisih = totalUangSeharusnya - totalPenjualanSistem;
                const selisihEl = document.getElementById('uf-selisih');
                selisihEl.textContent = formatCurrency(selisih);
                
                if (selisih < 0) {
                    selisihEl.classList.remove('text-emerald-600');
                    selisihEl.classList.add('text-red-600');
                } else {
                    selisihEl.classList.remove('text-red-600');
                    selisihEl.classList.add('text-emerald-600');
                }
            };
            
            // Event listener untuk menghitung otomatis saat ada input
            formHitungFisik.addEventListener('input', hitungUangFisik);
            
            // Event listener untuk tombol reset
            document.getElementById('uf-reset-btn').addEventListener('click', () => {
                formHitungFisik.querySelectorAll('input[type="number"]').forEach(input => {
                    input.value = '';
                });
                // Set tanggal kembali ke hari ini setelah reset
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('uf-tanggal').value = today;
                hitungUangFisik(); // Hitung ulang agar semua total kembali ke Rp 0
            });
            
            const absensiDateFilter = document.getElementById('absensi-date-filter');
            const absensiListContainer = document.getElementById('absensi-list');
            const absensiLoading = document.getElementById('absensi-loading');
            
            /**
             * Helper function untuk mendapatkan ikon dan warna berdasarkan status. (VERSI BARU DENGAN IKON RELEVAN)
             * @param {string} status - Karakter status ('H', 'S', 'I', 'A').
             * @returns {object} - Objek berisi kelas ikon dan warna.
             */
            const getStatusInfo = (status) => {
                
                const icons = {
                    H: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`,
                    S: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
                    I: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
                    A: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>`
                };
                
                switch (status) {
                    case 'H':
                        return { icon: icons.H, color: 'text-green-500' };
                    case 'S':
                        return { icon: icons.S, color: 'text-yellow-500' };
                    case 'I':
                        return { icon: icons.I, color: 'text-blue-500' };
                    case 'A':
                        return { icon: icons.A, color: 'text-red-500' };
                    default:
                        return { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`, color: 'text-gray-400' };
                }
            };
            
            const fetchAttendanceReport = async (date) => {
                absensiListContainer.innerHTML = '';
                absensiListContainer.classList.add('hidden');
                absensiLoading.classList.remove('hidden');
                
                try {
                    const url = `${ATTENDANCE_SCRIPT_URL}?action=read&date=${date}`;
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error('Gagal mengambil data dari server.');
                    }
                    const result = await response.json();
                    const attendanceData = result.data || result;
                    
                    if (Array.isArray(attendanceData) && attendanceData.length > 0) {
                        const sortedData = attendanceData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                        sortedData.forEach(entry => {
                            if (!entry.timestamp || !entry.nama_karyawan) {
                                console.warn('Data entri tidak lengkap, dilewati:', entry);
                                return;
                            }
                            
                            const item = document.createElement('div');
                            item.className = 'bg-white p-3 border rounded-lg flex items-start gap-3 shadow-sm';
                            
                            const attendanceTime = new Date(entry.timestamp);
                            const time = attendanceTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                            const statusInfo = getStatusInfo(entry.keterangan);
                            
                            let locationStatus = { text: 'Lokasi T/A', color: 'text-gray-400', distance: null };
                            const lat = parseFloat(entry.latitude);
                            const lon = parseFloat(entry.longitude);
                            
                            if (!isNaN(lat) && !isNaN(lon)) {
                                const distance = haversineDistance(OFFICE_COORDS, { lat, lon });
                                locationStatus.distance = distance;
                                if (distance <= ALLOWED_RADIUS_KM) {
                                    locationStatus = { text: 'Di Lokasi', color: 'text-green-600' };
                                } else {
                                    locationStatus = { text: `Di Luar Lokasi (${(distance * 1000).toFixed(0)} m)`, color: 'text-red-600' };
                                }
                            }
                            
                            let lateStatus = { text: 'T/A', color: 'text-gray-400' };
                            
                            let shiftKey = null;
                            const entryShift = entry.shift?.toUpperCase() || '';
                            if (entryShift.includes('PAGI')) {
                                shiftKey = 'PAGI';
                            } else if (entryShift.includes('SIANG')) {
                                shiftKey = 'SIANG';
                            } else if (entryShift.includes('MALAM')) {
                                shiftKey = 'MALAM';
                            }
                            const shiftRule = shiftKey ? SHIFT_TIMES[shiftKey] : null;
                            if (shiftRule && entry.keterangan === 'H') {
                                const deadline = new Date(attendanceTime);
                                deadline.setHours(shiftRule.hour, shiftRule.minute, 0, 0);
                                deadline.setMinutes(deadline.getMinutes() + shiftRule.grace);
                                
                                if (attendanceTime > deadline) {
                                    lateStatus = { text: 'Terlambat', color: 'text-red-600' };
                                } else {
                                    lateStatus = { text: 'Tepat Waktu', color: 'text-green-600' };
                                }
                            }
                            
                            
                            let locationHtml = '<p class="text-xs text-gray-400 mt-2">Peta tidak tersedia (lokasi tidak terekam)</p>';
                            if (!isNaN(lat) && !isNaN(lon)) {
                                const bbox = `${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}`;
                                const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
                                locationHtml = `
                        <div class="mt-2 rounded-lg overflow-hidden border" title="Peta Lokasi Absensi">
                           <iframe width="100%" height="150" style="border:0;" loading="lazy" src="${iframeSrc}"></iframe>
                        </div>`;
                            }
                            item.innerHTML = `
                    <div class="flex-shrink-0 w-16 text-center">
                        <p class="font-bold text-lg text-gray-800">${time}</p>
                        <div class="mt-1 ${statusInfo.color}" title="Status: ${entry.keterangan}">
                            ${statusInfo.icon}
                        </div>
                    </div>
                    <div class="flex-grow border-l pl-3">
                        <p class="font-bold text-gray-900">${entry.nama_karyawan}</p>
                        <p class="text-sm text-gray-600">${entry.bagian || 'N/A'} - ${entry.shift || 'N/A'}</p>
                        <div class="flex items-center gap-3 text-xs mt-2">
                            <span class="font-semibold px-2 py-0.5 rounded-full ${lateStatus.color} bg-opacity-10 ${lateStatus.color.replace('text', 'bg')}">${lateStatus.text}</span>
                            <span class="font-semibold px-2 py-0.5 rounded-full ${locationStatus.color} bg-opacity-10 ${locationStatus.color.replace('text', 'bg')}">${locationStatus.text}</span>
                        </div>
                        ${locationHtml}
                    </div>`;
                            absensiListContainer.appendChild(item);
                        });
                    } else {
                        absensiListContainer.innerHTML = `<div class="text-center py-10"><p class="text-sm text-gray-500">Tidak ada data absensi untuk tanggal yang dipilih.</p></div>`;
                    }
                } catch (error) {
                    console.error('Error fetching attendance:', error);
                    absensiListContainer.innerHTML = `<div class="text-center py-10"><p class="text-sm text-red-500">Terjadi kesalahan: ${error.message}. Coba lagi nanti.</p></div>`;
                } finally {
                    absensiLoading.classList.add('hidden');
                    absensiListContainer.classList.remove('hidden');
                }
            };
            
            document.getElementById('btn-laporan-absensi').addEventListener('click', () => {
                navigateTo('laporan-absensi');
                const today = new Date().toISOString().split('T')[0];
                if (!absensiDateFilter.value) {
                    absensiDateFilter.value = today;
                }
                fetchAttendanceReport(absensiDateFilter.value || today);
            });
            document.getElementById('back-to-lainnya-from-absensi-btn').addEventListener('click', () => navigateTo('lainnya'));
            
            
            // Event listener untuk filter tanggal
            absensiDateFilter.addEventListener('change', (e) => {
                if (e.target.value) {
                    fetchAttendanceReport(e.target.value);
                }
            });
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            let isAppInitialized = false;
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('sw.js')
                        .then((registration) => {
                            console.log('Service Worker berhasil didaftarkan: ', registration);
                        })
                        .catch((error) => {
                            console.log('Pendaftaran Service Worker gagal: ', error);
                        });
                });
            }
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    if (isAppInitialized) return;
                    isAppInitialized = true;
                    initializeApplication(db);
                    const lastPageId = localStorage.getItem('lastActivePage');
                    if (lastPageId) {
                        const pageName = lastPageId.replace('page-', '');
                        navigateTo(pageName);
                    } else {
                        navigateTo('beranda');
                    }
                    onSnapshot(query(collection(db, 'reservations'), orderBy('createdAt', 'desc')), (snapshot) => {
                        state.reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderReservations();
                    }, (error) => console.error("Error fetching reservations:", error));
                    onSnapshot(query(collection(db, 'contacts'), orderBy('name')), (snapshot) => {
                        state.contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderContactList();
                        renderFunctions.renderDashboard();
                    }, (error) => console.error("Error fetching contacts:", error));
                    onSnapshot(query(collection(db, 'inventory'), orderBy('name')), (snapshot) => {
                        state.inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderInventoryList();
                    }, (error) => console.error("Error fetching inventory:", error));
                    onSnapshot(query(collection(db, 'transactions'), orderBy('date', 'desc')), (snapshot) => {
                        state.transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderSalesReport();
                        renderFunctions.renderDashboard();
                        renderFunctions.renderCustomerSummary();
                        renderFunctions.renderCompletedOrderList();
                    }, (error) => console.error("Error fetching transactions:", error));
                    
                    onSnapshot(query(collection(db, 'customer_orders'), orderBy('orderDate', 'desc')), (snapshot) => {
                        state.customerOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderOrderList();
                        renderFunctions.renderCompletedOrderList();
                        renderFunctions.renderDashboard();
                        renderFunctions.renderCompletedOrderFilters();
                    }, (error) => console.error("Error fetching customer orders:", error));
                    onSnapshot(query(collection(db, 'monthly_expenses'), orderBy('date', 'desc')), (snapshot) => {
                        state.monthlyExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderExpenseReport();
                        renderFunctions.renderDashboard();
                    }, (error) => console.error("Error fetching monthly expenses:", error));
                    onSnapshot(query(collection(db, 'checklist_history'), orderBy('tanggal', 'desc')), (snapshot) => {
                        state.checklistHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderChecklistReport();
                    }, (error) => console.error("Error fetching checklist history:", error));
                    
                    onSnapshot(query(collection(db, 'daily_reports'), orderBy('date', 'desc')), (snapshot) => {
                        state.dailyReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        renderFunctions.renderDailyReportHistory();
                    }, (error) => console.error("Error fetching daily reports:", error));
                    
                    
                    const loadingOverlay = document.getElementById('loading-overlay');
                    loadingOverlay.style.opacity = '0';
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                        document.getElementById('app-container').classList.remove('hidden');
                    }, 300);
                } else {
                    signInAnonymously(auth).catch((error) => { console.error("Anonymous sign-in failed:", error); });
                }
            });
        });