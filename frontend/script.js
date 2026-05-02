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
    const ids = ["statHotels", "statUsers", "statMessages", "statEmails", "statFormulaires", "statEnquetes"];

    // 1. On met tout le monde en mode "Chargement..."
    ids.forEach(id => animerChiffre(id));

    try {
        const response = await fetch(`${API_HOTELS}/stats/count`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        if (!response.ok) throw new Error("Erreur stats");
        
        const stats = await response.json();

        // 2. Les données sont là, on lance l'animation réelle
        animerChiffre("statHotels", stats.hotels);
        animerChiffre("statUsers", stats.users);
        animerChiffre("statMessages", stats.messages);
        animerChiffre("statEmails", stats.emails);
        animerChiffre("statFormulaires", stats.formulaires);
        animerChiffre("statEnquetes", stats.enquetes);

    } catch (e) {
        console.error(e);
        // En cas d'erreur, on affiche 0 ou un petit message
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.textContent = "0";
        });
    }
}

// async function chargerStatsDashboard() {
//     try {
//         const response = await fetch(`${API_HOTELS}/stats/count`, {
//             headers: { 'Authorization': `Bearer ${getToken()}` }
//         });
//         if (!response.ok) return;
//         const stats = await response.json();
//         animerChiffre("statHotels", stats.hotels);
//         animerChiffre("statUsers", stats.users);
//         animerChiffre("statMessages", stats.messages);
//         animerChiffre("statEmails", stats.emails);
//         animerChiffre("statFormulaires", stats.formulaires);
//         animerChiffre("statEnquetes", stats.enquetes);
//     } catch (e) { console.error(e); }
// }

// function animerChiffre(id, fin) {
//     const el = document.getElementById(id);
//     if (!el) return;

//     // 🟢 ÉTAPE 1 : Si la donnée n'est pas encore là, on affiche un état de chargement
//     if (fin === undefined || fin === null) {
//         el.innerHTML = '<span class="text-gray-300 animate-pulse text-sm">Chargement...</span>';
//         return;
//     }

//     // 🟢 ÉTAPE 2 : Animation fluide du chiffre
//     let debut = 0;
//     const duree = 1000; // L'animation dure exactement 1 seconde
//     const fps = 30;    // 30 images par seconde (très fluide mais léger)
//     const totalFrames = (duree / 1000) * fps;
//     const increment = fin / totalFrames;

//     const timer = setInterval(() => {
//         debut += increment;
//         if (debut >= fin) {
//             el.textContent = fin; // On affiche le chiffre exact à la fin
//             clearInterval(timer);
//         } else {
//             el.textContent = Math.floor(debut);
//         }
//     }, 1000 / fps);
// }

// function animerChiffre(id, fin) {
//     const el = document.getElementById(id);
//     if (!el) return;
//     let debut = 0;
//     const timer = setInterval(() => {
//         debut += fin / 60;
//         if (debut >= fin) { el.textContent = fin; clearInterval(timer); }
//         else { el.textContent = Math.floor(debut); }
//     }, 16);
// }

function ajouterCarteHotel(hotel) {
    const grid = document.getElementById('hotelsGrid');
    const token = getToken(); 
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
// 4. UI HELPERS (MENUS, RECHERCHE, NOTIFICATIONS)
// ============================================================
function toggleSearchMobile() {
    const bar = document.getElementById('searchMobile');
    if (bar) bar.classList.toggle('hidden');
}

function filterHotels() {
    const desktopInput = document.getElementById('searchInput')?.value || "";
    const mobileInput = document.querySelector('#searchMobile input')?.value || "";
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

// Fonction pour transformer une date en "Il y a X minutes/heures"
function calculerTempsEcoule(dateNotif) {
    const maintenant = new Date();
    const date = new Date(dateNotif);
    const secondes = Math.floor((maintenant - date) / 1000);

    if (secondes < 60) return "À l'instant";
    
    const minutes = Math.floor(secondes / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `Il y a ${heures} h`;
    
    const jours = Math.floor(heures / 24);
    return `Il y a ${jours} jours`;
}

// 🟢 FONCTION DE CHARGEMENT DES NOTIFS
async function chargerNotifications() {
    const notifMenu = document.getElementById('notifMenu');
    const badge = document.querySelector('#notifBtn span');
    if (!notifMenu) return;

    try {
        const response = await fetch(`${API_HOTELS}/notifications`, { 
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            if (badge) {
                badge.textContent = data.length;
                badge.style.display = data.length > 0 ? 'flex' : 'none';
            }

            let html = '<div class="p-3 border-b font-bold text-xs text-gray-700 uppercase tracking-wider">Notifications</div>';
            
            if (data.length === 0) {
                html += '<p class="p-4 text-[10px] text-gray-400 text-center italic">Aucun message</p>';
            } else {
                data.forEach(n => {
                    // 🟢 ON UTILISE LA FONCTION DE CALCUL ICI :
                    const temps = calculerTempsEcoule(n.date); 
                    
                    html += `
                    <div class="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors">
                        <p class="text-[11px] text-gray-800 font-medium">${n.message}</p>
                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-1">${temps}</p>
                    </div>`;
                });
            }
            notifMenu.innerHTML = html;
        }
    } catch (e) { console.error(e); }
}

// 🟢 LA FONCTION QUI MANQUAIT (Pour ouvrir/fermer le menu cloche)
function setupNotifications() {
    const notifBtn = document.getElementById('notifBtn');
    const notifMenu = document.getElementById('notifMenu');

    if (notifBtn && notifMenu) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const estOuvert = notifMenu.classList.toggle('hidden');
            // Si on vient d'ouvrir le menu, on charge les vraies notifs
            if (!estOuvert) chargerNotifications();
        });
        // Fermer le menu si on clique n'importe où ailleurs sur l'écran
        document.addEventListener('click', () => notifMenu.classList.add('hidden'));
    }
}

// ── 3.3 GESTION MOT DE PASSE OUBLIÉ (ENVOI EMAIL) ──────────
async function handleForgotPassword(event) {
    if(event) event.preventDefault();
    const email = document.getElementById('email').value;

    try {
        const response = await fetch(`${API_AUTH}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ " + data.message);
            // On peut rediriger vers le login ou rester là
        } else {
            alert("❌ " + data.message);
        }
    } catch (error) {
        alert("Le serveur ne répond pas.");
    }
}

// ── 3.4 GESTION RÉINITIALISATION (NOUVEAU MOT DE PASSE) ─────
async function handleResetPassword(event) {
    if(event) event.preventDefault();

    // On récupère le token depuis l'adresse URL (?token=...)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (password !== confirm) {
        alert("Les mots de passe ne sont pas identiques.");
        return;
    }

    try {
        const response = await fetch(`${API_AUTH}/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Mot de passe modifié ! Connectez-vous.");
            window.location.href = 'se connecté.html';
        } else {
            alert("❌ " + data.message);
        }
    } catch (e) {
        alert("Erreur technique.");
    }
}

// ============================================================
// 5. INITIALISATION (AVEC LE GARDIEN DE SÉCURITÉ)
// ============================================================
// On crée une variable pour savoir si on a déjà chargé les données
let dejaCharge = false;

window.addEventListener('DOMContentLoaded', () => {
    if (dejaCharge) return; // Si déjà fait, on arrête tout
    dejaCharge = true;

    const token = localStorage.getItem('token');
    const path = decodeURIComponent(window.location.pathname);
    const isPublic = path.includes('connect') || path.includes('inscription') || path.includes('oublie') || path.includes('reset');

    // 1. Sécurité rapide
    if (!token && !isPublic) {
        window.location.replace('se connecté.html');
        return;
    }

    // 2. On montre la page
    document.body.style.display = 'flex'; 

    // 3. On ne lance les fonctions lourDES que si on est sur la bonne page
    const grid = document.getElementById('hotelsGrid');
    if (grid) {
        console.log("Chargement léger des hôtels...");
        chargerHotels(); 
    }

    const stats = document.getElementById('statHotels');
    if (stats) {
        console.log("Chargement léger du Dashboard...");
        chargerStatsDashboard();
    }

    setupNotifications();
});
