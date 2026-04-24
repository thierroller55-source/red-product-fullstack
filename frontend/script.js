// ============================================================
// 1. CONFIGURATION ET CONSTANTES
// ============================================================
const API_HOTELS = 'https://red-product-fullstack.onrender.com/api/hotels';
const API_AUTH   = 'https://red-product-fullstack.onrender.com/api/auth';

const getToken = () => localStorage.getItem('token');

// ============================================================
// 2. GESTION DES HÔTELS (MONGODB + CLOUDINARY)
// ============================================================

async function chargerHotels() {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return;
    try {
        const response = await fetch(API_HOTELS, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const hotels = await response.json();
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'se connecté.html';
            return;
        }

        if (Array.isArray(hotels)) {
            grid.innerHTML = ''; 
            hotels.forEach(hotel => ajouterCarteHotel(hotel));
            const count = document.getElementById('hotelCount');
            if (count) count.textContent = hotels.length;
        }
    } catch (err) { console.error('Erreur chargement:', err); }
}

async function chargerStatsDashboard() {
    try {
        const response = await fetch(`${API_HOTELS}/stats/count`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) return;
        const stats = await response.json();
        animerChiffre("statHotels", stats.hotels);
        animerChiffre("statUsers", stats.users);
        animerChiffre("statMessages", stats.messages);
        animerChiffre("statEmails", stats.emails);
        animerChiffre("statFormulaires", stats.formulaires);
        animerChiffre("statEnquetes", stats.enquetes);
    } catch (e) { console.error(e); }
}

function animerChiffre(id, fin) {
    const el = document.getElementById(id);
    if (!el) return;
    let debut = 0;
    const timer = setInterval(() => {
        debut += fin / 60;
        if (debut >= fin) { el.textContent = fin; clearInterval(timer); }
        else { el.textContent = Math.floor(debut); }
    }, 16);
}

function ajouterCarteHotel(hotel) {
    const grid = document.getElementById('hotelsGrid');
    const token = localStorage.getItem('token'); 
    const imgUrl = hotel.image || 'https://placehold.co/400x250?text=Pas+d+image';

    const card = document.createElement('div');
    card.id = `hotel-${hotel._id}`;
    card.className = 'hotel-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer relative';
    card.setAttribute('data-search', `${hotel.nom} ${hotel.adresse}`.toLowerCase());

    const deleteBtn = token ? `
        <button onclick="event.stopPropagation(); supprimerHotel('${hotel._id}')" 
                class="absolute top-2 right-2 bg-red-600 hover:bg-red-800 text-white p-2 rounded-full shadow-lg transition-colors z-10">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>` : "";

    card.innerHTML = `
        <div class="overflow-hidden h-44 relative">
            <img src="${imgUrl}" alt="${hotel.nom}" class="w-full h-full object-cover" />
            ${deleteBtn} 
        </div>
        <div class="p-4">
            <p class="text-[10px] text-orange-400 font-medium mb-0.5">${hotel.adresse}</p>
            <h3 class="font-semibold text-gray-800 text-base mb-2">${hotel.nom}</h3>
            <p class="text-xs text-gray-600">${hotel.prix} ${hotel.devise} <span class="text-xs">par nuit</span></p>
        </div>`;
    grid.appendChild(card);
}

async function addHotel() {
    const formData = new FormData();
    const fields = ['newNom', 'newAdresse', 'newEmail', 'newTel', 'newPrix', 'newDevise'];
    for (let id of fields) {
        const val = document.getElementById(id)?.value;
        if (!val) { document.getElementById('formError')?.classList.remove('hidden'); return; }
        formData.append(id.replace('new', '').toLowerCase(), val);
    }
    const photoFile = document.getElementById('photoInput').files[0];
    if (photoFile) formData.append('image', photoFile);
    try {
        const res = await fetch(API_HOTELS, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
        if (res.ok) window.location.reload();
    } catch (e) { console.error(e); }
}

async function supprimerHotel(id) {
    if (!confirm("Supprimer cet hôtel ?")) return;
    try {
        const response = await fetch(`${API_HOTELS}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (response.ok) { document.getElementById(`hotel-${id}`).remove(); chargerHotels(); }
    } catch (error) { console.error(error); }
}

// ============================================================
// 3. AUTHENTIFICATION
// ============================================================

async function seConnecter(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${API_AUTH}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (res.ok) { localStorage.setItem('token', data.token); window.location.href = 'dashweb.html'; }
        else { alert("❌ " + data.message); }
    } catch (e) { alert("Erreur serveur"); }
}

async function handleRegister(event) {
    event.preventDefault();
    const nom = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch(`${API_AUTH}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom, email, password }) });
    if (res.ok) { alert("✅ Inscription réussie !"); window.location.href = 'se connecté.html'; }
    else { alert("❌ Erreur"); }
}

function seDeconnecter(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('token'); 
    window.location.replace('se connecté.html'); 
}

// ============================================================
// 4. UI HELPERS (MENUS, RECHERCHE, MODALS)
// ============================================================

// 🟢 NOUVEAU : Fonction pour ouvrir/fermer la recherche sur mobile
function toggleSearchMobile() {
    const bar = document.getElementById('searchMobile');
    if (bar) bar.classList.toggle('hidden');
}

// 🟢 AMÉLIORÉ : Fonction de recherche pour Desktop ET Mobile
function filterHotels() {
    const desktopInput = document.getElementById('searchInput')?.value || "";
    const mobileInput = document.querySelector('#searchMobile input')?.value || "";
    
    // On prend la valeur de l'une ou l'autre barre
    const query = (desktopInput || mobileInput).toLowerCase();
    
    const cards = document.querySelectorAll('.hotel-card');
    cards.forEach(card => {
        const searchText = card.getAttribute('data-search') || "";
        card.classList.toggle('hidden', !searchText.includes(query));
    });
}

function togglePassword() {
    const input = document.getElementById('password');
    if (input) input.type = (input.type === 'password') ? 'text' : 'password';
}
function openModal() { document.getElementById('modal')?.classList.remove('hidden'); }
function closeModal() { document.getElementById('modal')?.classList.add('hidden'); }
function ouvrirMenu() { document.getElementById('sidebar')?.classList.remove('-translate-x-full'); document.getElementById('sidebarOverlay')?.classList.remove('hidden'); }
function fermerMenu() { document.getElementById('sidebar')?.classList.add('-translate-x-full'); document.getElementById('sidebarOverlay')?.classList.add('hidden'); }

function previewPhoto(event) {
    const reader = new FileReader();
    reader.onload = () => { const out = document.getElementById('preview'); if(out){out.src=reader.result; out.classList.remove('hidden');} };
    reader.readAsDataURL(event.target.files[0]);
}

function setupNotifications() {
    const btn = document.getElementById('notifBtn');
    const menu = document.getElementById('notifMenu');
    if (btn && menu) {
        btn.onclick = (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); };
        document.onclick = () => menu.classList.add('hidden');
    }
}

// ============================================================
// 5. INITIALISATION
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const path = window.location.pathname;
    const isPublic = path.includes('connect') || path.includes('inscription');

    if (!token && !isPublic) {
        window.location.replace('se connecté.html');
        return;
    }

    if (document.getElementById('hotelsGrid')) chargerHotels();
    if (document.getElementById('statHotels')) chargerStatsDashboard();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', seConnecter);
     
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) registrationForm.addEventListener('submit', handleRegister);

    setupNotifications();
});