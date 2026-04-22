// ============================================================
// 1. CONFIGURATION ET CONSTANTES
// ============================================================
// Par (ton futur lien Render) :
const API_HOTELS = 'https://red-product-fullstack.onrender.com/api/hotels';
const API_AUTH   = 'https://red-product-fullstack.onrender.com/api/auth';

// Récupération du badge (Token) pour les actions protégées
const getToken = () => localStorage.getItem('token');

// ============================================================
// 2. GESTION DES HÔTELS (MONGODB + CLOUDINARY)
// ============================================================

async function chargerHotels() {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return;

    try {
        const response = await fetch(API_HOTELS);
        const hotels = await response.json();
        grid.innerHTML = ''; 
        hotels.forEach(hotel => ajouterCarteHotel(hotel));
        
        const count = document.getElementById('hotelCount');
        if (count) count.textContent = hotels.length;
    } catch (err) { console.error('Erreur chargement:', err); }
}

function ajouterCarteHotel(hotel) {
    const grid = document.getElementById('hotelsGrid');
    const imgUrl = hotel.image || 'https://placehold.co/400x250?text=Pas+d+image';
    const card = document.createElement('div');
    
    card.id = `hotel-${hotel._id}`;
    card.className = 'hotel-card bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer relative';
    card.setAttribute('data-search', `${hotel.nom} ${hotel.adresse}`.toLowerCase());
    
    // ON A ENLEVÉ LE <button> DE LA PARTIE CI-DESSOUS
    card.innerHTML = `
        <div class="overflow-hidden h-44 relative">
            <img src="${imgUrl}" alt="${hotel.nom}" class="w-full h-full object-cover" />
        </div>
        <div class="p-4">
            <p class="text-[10px] text-orange-400 font-medium mb-0.5">${hotel.adresse}</p>
            <h3 class="font-semibold text-gray-800 text-base mb-2">${hotel.nom}</h3>
            <p class="text-sm text-gray-500">${hotel.prix} ${hotel.devise} <span class="text-xs">par nuit</span></p>
        </div>`;
    grid.appendChild(card);
}

async function addHotel() {
    const formData = new FormData();
    const photoFile = document.getElementById('photoInput').files[0];
    
    // On boucle sur les IDs pour gagner du temps
    const fields = ['newNom', 'newAdresse', 'newEmail', 'newTel', 'newPrix', 'newDevise'];
    for (let id of fields) {
        const input = document.getElementById(id);
        if (!input?.value) { document.getElementById('formError')?.classList.remove('hidden'); return; }
        formData.append(id.replace('new', '').toLowerCase(), input.value);
    }

    if (photoFile) formData.append('image', photoFile);

    try {
        const res = await fetch(API_HOTELS, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${getToken()}` }, // Sécurité
            body: formData 
        });
        if (res.ok) { alert("Hôtel ajouté !"); window.location.reload(); }
    } catch (e) { alert("Erreur lors de l'envoi"); }
}

async function supprimerHotel(id) {
    if (!confirm("Supprimer cet hôtel ?")) return;
    try {
        const res = await fetch(`${API_HOTELS}/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` } // Sécurité
        });
        if (res.ok) { document.getElementById(`hotel-${id}`).remove(); chargerHotels(); }
    } catch (err) { alert("Erreur suppression"); }
}

// ============================================================
// 3. AUTHENTIFICATION (LOGIN & FORGOT PASSWORD)
// ============================================================

async function seConnecter(event) {
    if (event) event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('btnText');

    // État de chargement
    if (submitBtn) {
        submitBtn.disabled = true;
        spinner?.classList.remove('hidden');
        if (btnText) btnText.textContent = "Vérification...";
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_AUTH}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = 'dashweb.html';
        } else {
            alert("❌ " + data.message);
            resetLoginButton();
        }
    } catch (error) {
        alert("Erreur serveur");
        resetLoginButton();
    }
}

// ── FONCTION D'INSCRIPTION ───────────────────────────────
async function handleRegister(event) {
    if(event) event.preventDefault();

    // 1. On récupère les champs de la page inscription.html
    const nameValue  = document.getElementById('name').value;
    const emailValue = document.getElementById('email').value;
    const passValue  = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_AUTH}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // TRÈS IMPORTANT : On envoie "nom" car le backend attend "nom"
            body: JSON.stringify({ 
                nom: nameValue, 
                email: emailValue, 
                password: passValue 
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Compte créé avec succès ! Connectez-vous.");
            window.location.href = 'se connecté.html'; // Redirection vers login
        } else {
            alert("❌ " + (data.message || "Erreur lors de l'inscription"));
        }
    } catch (error) {
        alert("Erreur : Le serveur ne répond pas.");
    }
}

async function handleForgotPassword(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('email').value;

    try {
        const res = await fetch(`${API_AUTH}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            alert("✅ " + data.message);
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html'; 
        } else { alert("❌ " + data.message); }
    } catch (e) { alert("Serveur injoignable"); }
}

// ============================================================
// 4. UI HELPERS (MENUS, MODALS, ANIMATIONS)
// ============================================================

function resetLoginButton() {
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('btnText');
    if (submitBtn) {
        submitBtn.disabled = false;
        spinner?.classList.add('hidden');
        if (btnText) btnText.textContent = "Se connecter";
    }
}

function filterHotels() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || "";
    const cards = document.querySelectorAll('.hotel-card');
    cards.forEach(card => {
        const match = card.getAttribute('data-search').includes(query);
        card.classList.toggle('hidden', !match);
    });
}
//  pour la button cacher le mot de passe
function togglePassword() {
    const input = document.getElementById('password');
    if (input) input.type = (input.type === 'password') ? 'text' : 'password';
}

function openModal() { document.getElementById('modal')?.classList.remove('hidden'); }
function closeModal() { document.getElementById('modal')?.classList.add('hidden'); }

function ouvrirMenu() {
    document.getElementById('sidebar')?.classList.remove('-translate-x-full');
    document.getElementById('sidebarOverlay')?.classList.remove('hidden');
}
function fermerMenu() {
    document.getElementById('sidebar')?.classList.add('-translate-x-full');
    document.getElementById('sidebarOverlay')?.classList.add('hidden');
}

function previewPhoto(event) {
    const reader = new FileReader();
    reader.onload = () => { 
        const output = document.getElementById('preview');
        if(output) { output.src = reader.result; output.classList.remove('hidden'); }
    };
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
// 5. INITIALISATION (LANCE TOUT)
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    // Page Liste Hôtels
    if (document.getElementById('hotelsGrid')) chargerHotels();
    
    // Page Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', seConnecter);
     
     // AJOUTE inscription:
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegister);
    }

    // Page Mot de passe oublié
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);

    // Activer notifications
    setupNotifications();
});