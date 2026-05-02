// ============================================================
// 1. CONFIGURATION ET CONSTANTES
// ============================================================
const API_HOTELS = 'https://red-product-fullstack.onrender.com/api/hotels';
const API_AUTH   = 'https://red-product-fullstack.onrender.com/api/auth';

const getToken = () => localStorage.getItem('token');

// ============================================================
// 2. GESTION DES HÔTELS & STATISTIQUES
// ============================================================

async function chargerHotels() {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return;
    try {
        const response = await fetch(API_HOTELS, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const hotels = await response.json();
        if (response.status === 401) { seDeconnecter(); return; }
        if (Array.isArray(hotels)) {
            grid.innerHTML = ''; 
            hotels.forEach(hotel => ajouterCarteHotel(hotel));
            const count = document.getElementById('hotelCount');
            if (count) count.textContent = hotels.length;
        }
    } catch (err) { console.error('Erreur hotels:', err); }
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
        debut += fin / 30;
        if (debut >= fin) { el.textContent = fin; clearInterval(timer); }
        else { el.textContent = Math.floor(debut); }
    }, 30);
}

function ajouterCarteHotel(hotel) {
    const grid = document.getElementById('hotelsGrid');
    const token = getToken(); 
    const imgUrl = hotel.image || 'https://placehold.co/400x250?text=Pas+d+image';
    const card = document.createElement('div');
    card.id = `hotel-${hotel._id}`;
    card.className = 'hotel-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer relative';
    card.setAttribute('data-search', `${hotel.nom} ${hotel.adresse}`.toLowerCase());
    const deleteBtn = token ? `<button onclick="event.stopPropagation(); supprimerHotel('${hotel._id}')" class="absolute top-2 right-2 bg-red-600 hover:bg-red-800 text-white p-2 rounded-full shadow-lg transition-colors z-10"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2"/></svg></button>` : "";
    card.innerHTML = `<div class="overflow-hidden h-44 relative"><img src="${imgUrl}" class="w-full h-full object-cover" />${deleteBtn}</div><div class="p-4"><p class="text-[10px] text-orange-400 font-medium mb-0.5">${hotel.adresse}</p><h3 class="font-semibold text-gray-800 text-base mb-2">${hotel.nom}</h3><p class="text-xs text-gray-600">${hotel.prix} ${hotel.devise} <span class="text-xs">par nuit</span></p></div>`;
    grid.appendChild(card);
}

// ============================================================
// 3. AUTHENTIFICATION (LOGIN, REGISTER, LOGOUT)
// ============================================================

async function seConnecter(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${API_AUTH}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (res.ok) { 
            localStorage.setItem('token', data.token); 
            if(data.user) localStorage.setItem('userName', data.user.nom);
            window.location.replace('dashweb.html'); 
        } else { alert("❌ " + data.message); }
    } catch (e) { alert("Erreur serveur"); }
}

async function handleRegister(event) {
    event.preventDefault();
    const nom = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${API_AUTH}/register`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ nom, email, password }) 
        });
        if (res.ok) { 
            alert("✅ Inscription réussie ! Connectez-vous."); 
            // 🟢 REDIRECTION VERS LA CONNEXION ICI
            window.location.replace('se connecté.html'); 
        } else { alert("❌ Erreur lors de l'inscription"); }
    } catch (e) { alert("Erreur serveur"); }
}

async function verifierToken(token) {
    try {
        const res = await fetch(`${API_AUTH}/verify`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
        return res.ok; 
    } catch (e) { return false; }
}

function seDeconnecter() {
    localStorage.clear();
    window.location.replace('se connecté.html');
}

// ============================================================
// 4. UI HELPERS (MENUS, RECHERCHE, MODALS, OEIL)
// ============================================================

function togglePassword() {
    const input = document.getElementById('password');
    if (input) input.type = (input.type === 'password') ? 'text' : 'password';
}

function setupNotifications() {
    const btn = document.getElementById('notifBtn');
    const menu = document.getElementById('notifMenu');
    if (btn && menu) {
        btn.onclick = (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); };
        document.addEventListener('click', () => menu.classList.add('hidden'));
    }
}

function filterHotels() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || "";
    document.querySelectorAll('.hotel-card').forEach(card => {
        card.classList.toggle('hidden', !card.getAttribute('data-search').includes(query));
    });
}

function openModal() { document.getElementById('modal')?.classList.remove('hidden'); }
function closeModal() { document.getElementById('modal')?.classList.add('hidden'); }

// ============================================================
// 5. INITIALISATION (LE GARDIEN)
// ============================================================

window.addEventListener('pageshow', () => {
    const token = getToken();
    const path  = decodeURIComponent(window.location.pathname);
    const isPublic = path.includes('se connecté') || path.includes('inscription') || path.includes('mode pass oublie') || path.includes('reset');

    if (!token && !isPublic) {
        window.location.replace('se connecté.html');
        return;
    }

    if (token && !isPublic) {
        verifierToken(token).then(valide => {
            if (!valide) { seDeconnecter(); return; }
            finaliserAffichage();
        });
    } else {
        finaliserAffichage();
    }
});

function finaliserAffichage() {
    document.body.style.display = 'flex'; 
    document.getElementById('loginForm')?.addEventListener('submit', seConnecter);
    document.getElementById('registrationForm')?.addEventListener('submit', handleRegister);
    if (document.getElementById('hotelsGrid')) chargerHotels();
    if (document.getElementById('statHotels')) chargerStatsDashboard();
    const savedName = localStorage.getItem('userName');
    const nameEl = document.getElementById('userNameDisplay');
    if (nameEl && savedName) nameEl.textContent = savedName;
    setupNotifications();
}