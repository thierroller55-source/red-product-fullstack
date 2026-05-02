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

// ── AJOUTER UN NOUVEL HÔTEL (ENVOI À CLOUDINARY + MONGODB) ──
async function addHotel() {
    const formData = new FormData(); // Obligatoire pour envoyer une photo

    // 1. On récupère le fichier image depuis ton HTML
    const photoFile = document.getElementById('photoInput').files[0];
    
    // 2. On récupère les textes du formulaire
    const nom     = document.getElementById('newNom').value;
    const adresse = document.getElementById('newAdresse').value;
    const email   = document.getElementById('newEmail').value;
    const tel     = document.getElementById('newTel').value;
    const prix    = document.getElementById('newPrix').value;
    const devise  = document.getElementById('newDevise').value;

    // Petite sécurité : on vérifie que les champs essentiels ne sont pas vides
    if (!nom || !adresse || !prix) {
        alert("Merci de remplir au moins le nom, l'adresse et le prix.");
        return;
    }

    // 3. On remplit le "paquet" (FormData) à envoyer
    formData.append('nom', nom);
    formData.append('adresse', adresse);
    formData.append('email', email);
    formData.append('tel', tel);
    formData.append('prix', prix);
    formData.append('devise', devise);
    
    if (photoFile) {
        formData.append('image', photoFile); // Le mot 'image' doit correspondre au backend
    }

    try {
        // 4. ON ENVOIE AU SERVEUR RENDER
        const response = await fetch(API_HOTELS, {
            method: 'POST',
            headers: {
                // 🟢 TRÈS IMPORTANT : On envoie ton badge secret (Token)
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData // On envoie le paquet FormData
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ L'hôtel a bien été enregistré !");
            closeModal(); // Ferme la fenêtre
            window.location.reload(); // Recharge la page pour voir le nouvel hôtel
        } else {
            alert("❌ Erreur : " + data.message);
        }

    } catch (error) {
        console.error("Erreur ajout hôtel:", error);
        alert("Impossible de contacter le serveur Render.");
    }
}

// ============================================================
// 3. AUTHENTIFICATION
// ============================================================

async function seConnecter(event) {
    event.preventDefault();
    
    // Récupération des éléments du bouton pour l'animation
    const submitBtn = document.getElementById('submitBtn');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('btnText');

    // Activer le chargement
    if (submitBtn) {
        submitBtn.disabled = true;
        spinner?.classList.remove('hidden');
        if (btnText) btnText.textContent = "Connexion...";
    }

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_AUTH}/login`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, password }) 
        });
        
        const data = await res.json();
        
        if (res.ok) { 
            localStorage.setItem('token', data.token); 
            if(data.user) localStorage.setItem('userName', data.user.nom);
            window.location.replace('dashweb.html'); 
        } else { 
            alert("❌ " + data.message); 
            // Remettre le bouton à zéro
            if (submitBtn) {
                submitBtn.disabled = false;
                spinner?.classList.add('hidden');
                if (btnText) btnText.textContent = "Se connecter";
            }
        }
    } catch (e) { 
        alert("Erreur serveur : vérifiez votre connexion."); 
        if (submitBtn) {
            submitBtn.disabled = false;
            spinner?.classList.add('hidden');
            if (btnText) btnText.textContent = "Se connecter";
        }
    }
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
            alert("✅ Inscription réussie !"); 
            window.location.replace('se connecté.html'); 
        } else { alert("❌ Erreur lors de l'inscription"); }
    } catch (e) { alert("Erreur serveur"); }
}

// verification du token en arrière-plan pour les pages privées
async function verifierToken(token) {
    try {
        const response = await fetch(`${API_AUTH}/verify`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // 🟢 ON N'ÉJECTE QUE SI LE SERVEUR RÉPOND "401 UNAUTHORIZED" (Vrai refus)
        if (response.status === 401) {
            return false;
        }

        // Pour tous les autres cas (200 OK ou Serveur en train de dormir)
        // On renvoie "true" pour laisser l'utilisateur tranquille
        return true; 

    } catch (e) {
        // Si le réseau plante ou que Render dort, on ne bloque pas l'utilisateur
        console.warn("Le serveur est lent, attente du réveil...");
        return true; 
    }
}

function seDeconnecter(event) {
    if (event) event.preventDefault();
    
    // 1. On vide TOUTE la mémoire (Token et Nom)
    localStorage.clear(); 
    
    // 2. On remplace la page actuelle dans l'historique par le login
    // Cela empêche physiquement de faire "Retour" vers le Dashboard
    window.location.replace('se connecté.html'); 
}

// ============================================================
// 4. UI HELPERS
// ============================================================

function togglePassword() {
    const input = document.getElementById('password');
    if (input) input.type = (input.type === 'password') ? 'text' : 'password';
}

function filterHotels() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || "";
    document.querySelectorAll('.hotel-card').forEach(card => {
        card.classList.toggle('hidden', !card.getAttribute('data-search').includes(query));
    });
}

function setupNotifications() {
    const btn = document.getElementById('notifBtn');
    const menu = document.getElementById('notifMenu');

    if (btn && menu) {
        btn.onclick = (e) => {
            e.stopPropagation();
            const estOuvert = menu.classList.toggle('hidden');
            if (!estOuvert) chargerNotifications(); // On charge les notifs quand on ouvre
        };
        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', () => menu.classList.add('hidden'));
    }
}

// ============================================================
// 5. INITIALISATION (SÉCURITÉ MAXIMALE & VITESSE)
// ============================================================

// On utilise 'pageshow' pour que le code se relance même au clic sur "Retour"
window.addEventListener('pageshow', (event) => {
    const token = getToken();
    const path  = decodeURIComponent(window.location.pathname);
    
    // Liste des pages autorisées sans badge
    const isPublic = path.includes('se connecté') || 
                     path.includes('inscription') || 
                     path.includes('mode pass oublie') || 
                     path.includes('reset');

    // 🛡️ 1. LE GARDIEN IMMÉDIAT (Éjection si pas de badge)
    if (!token && !isPublic) {
        window.location.replace('se connecté.html');
        return; 
    }

    // 🛡️ 2. VÉRIFICATION RÉELLE AVEC LE SERVEUR
    if (token && !isPublic) {
        verifierToken(token).then(valide => {
            if (!valide) {
                // Si le serveur dit NON (ex: après une déconnexion) -> Éjection
                seDeconnecter(); 
                return;
            }
            // Si c'est bon, on affiche la page et on active les boutons
            finaliserInitialisation();
        });
    } else {
        // Page publique (Login/Reg) -> on affiche directement
        finaliserInitialisation();
    }
});

// ── FONCTION POUR ACTIVER TOUT LE SITE ───────────────────
function finaliserInitialisation() {
    // 1. On montre la page
    document.body.style.setProperty('display', 'flex', 'important');

    // 2. Branchement des formulaires (Connexion, Inscription, etc.)
    document.getElementById('loginForm')?.addEventListener('submit', seConnecter);
    document.getElementById('registrationForm')?.addEventListener('submit', handleRegister);
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', handleForgotPassword);
    document.getElementById('resetPasswordForm')?.addEventListener('submit', handleResetPassword);

    // 🟢 3. BRANCHER LE FORMULAIRE DE CRÉATION D'HÔTEL (Cloudinary)
    const addForm = document.getElementById('addHotelForm');
    if (addForm) {
        console.log("Formulaire d'ajout détecté");
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addHotel(); // Appelle ta fonction d'envoi vers Cloudinary
        });
    }

    // 4. Chargement des données réelles
    if (document.getElementById('hotelsGrid')) chargerHotels();
    if (document.getElementById('statHotels')) chargerStatsDashboard();
    
    // 5. Affichage du nom
    const savedName = localStorage.getItem('userName');
    const nameEl = document.getElementById('userNameDisplay');
    if (nameEl && savedName) nameEl.textContent = savedName;

    // 🟢 6. ACTIVER LA CLOCHE
    setupNotifications();
}