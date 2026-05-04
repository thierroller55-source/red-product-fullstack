// ============================================================
// 1. CONFIGURATION ET CONSTANTES
// ============================================================
const API_HOTELS = 'https://red-product-fullstack.onrender.com/api/hotels';
const API_AUTH   = 'https://red-product-fullstack.onrender.com/api/auth';

const getToken = () => localStorage.getItem('token');
// ✅ AJOUTE ICI — Variables 2FA
let tempUserId    = null;
let tempUserEmail = null;

// ============================================================
// 2. GESTION DES HÔTELS & STATISTIQUES
// ============================================================
async function chargerHotels() {
    const grid = document.getElementById('hotelsGrid');
    if (!grid) return;

    try {
        // Envoi immédiat de la requête
        const response = await fetch(API_HOTELS, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const hotels = await response.json();

        // Sécurité si la session a expiré
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.replace('se connecté.html');
            return;
        }

        // Affichage instantané dès que les données arrivent
        if (Array.isArray(hotels)) {
            grid.innerHTML = ''; 
            hotels.forEach(hotel => ajouterCarteHotel(hotel));
            
            const count = document.getElementById('hotelCount');
            if (count) count.textContent = hotels.length;
        }

    } catch (err) {
        console.error('Erreur chargement hôtels :', err);
    }
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
    card.innerHTML = `<div class="overflow-hidden h-44 relative"><img src="${imgUrl}" class="w-full h-full object-cover" />${deleteBtn}</div><div class="p-4"><p class="text-[10px] text-orange font-medium mb-0.5">${hotel.adresse}</p><h3 class="font-semibold text-gray-800 text-base mb-2">${hotel.nom}</h3><p class="text-xs text-gray-600">${hotel.prix} ${hotel.devise} <span class="text-xs">par nuit</span></p></div>`;
    grid.appendChild(card);
}

// ── AJOUTER UN NOUVEL HÔTEL (ENVOI À CLOUDINARY + MONGODB) ──
async function addHotel() {
    const submitBtn = document.querySelector('#addHotelForm button[type="submit"]');
    
    // 🟢 SÉCURITÉ : Si le bouton est déjà désactivé, on arrête tout (empêche le double envoi)
    if (submitBtn.disabled) return;

    const formData = new FormData();
    const photoFile = document.getElementById('photoInput').files[0];
    
    const nom     = document.getElementById('newNom').value;
    const adresse = document.getElementById('newAdresse').value;
    const email   = document.getElementById('newEmail').value;
    const tel     = document.getElementById('newTel').value;
    const prix    = document.getElementById('newPrix').value;
    const devise  = document.getElementById('newDevise').value;

    if (!nom || !adresse || !prix || !photoFile) {
        alert("Merci de remplir tous les champs et d'ajouter une photo.");
        return;
    }

    // 🟢 ON BLOQUE LE BOUTON IMMÉDIATEMENT
    submitBtn.disabled = true;
    submitBtn.textContent = "Enregistrement...";

    formData.append('nom', nom);
    formData.append('adresse', adresse);
    formData.append('email', email);
    formData.append('tel', tel);
    formData.append('prix', prix);
    formData.append('devise', devise);
    formData.append('image', photoFile);

    try {
        const response = await fetch(API_HOTELS, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData 
        });

        if (response.ok) {
            // Pas d'alerte, on recharge tout de suite
            window.location.reload(); 
        } else {
            // En cas d'erreur, on redonne la main au bouton
            submitBtn.disabled = false;
            submitBtn.textContent = "Enregistrer";
            alert("Erreur lors de l'enregistrement.");
        }
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enregistrer";
        console.error(error);
    }
}


// ── SUPPRESSION AUTOMATIQUE (SANS BOUTON OK) ──────────────
async function supprimerHotel(id) {
    try {
        const response = await fetch(`${API_HOTELS}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (response.ok) {
            // 🟢 ÉTAPE 1 : On cherche la carte par son ID et on l'efface de l'écran
            const card = document.getElementById(`hotel-${id}`);
            if (card) {
                card.remove(); // Supprime l'élément HTML sans recharger
            }
            
            // 🟢 ÉTAPE 2 : On recharge les données en arrière-plan pour le compteur
            chargerHotels(); 
            
            console.log("Hôtel supprimé de l'écran");
        }
    } catch (error) { console.error(error); }
}

function previewPhoto(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('preview');
    const placeholder = document.getElementById('uploadPlaceholder');

    if (file) {
        const reader = new FileReader();
        reader.onload = () => { 
            if(preview) {
                preview.src = reader.result; 
                preview.classList.remove('hidden');
                if(placeholder) placeholder.classList.add('hidden'); // Cache l'icône +
            }
        };
        reader.readAsDataURL(file);
    }
}

// ============================================================
// 3. AUTHENTIFICATION
// ============================================================

// async function seConnecter(event) {
//     event.preventDefault();
    
//     // Récupération des éléments du bouton pour l'animation
//     const submitBtn = document.getElementById('submitBtn');
//     const spinner = document.getElementById('spinner');
//     const btnText = document.getElementById('btnText');

//     // Activer le chargement
//     if (submitBtn) {
//         submitBtn.disabled = true;
//         spinner?.classList.remove('hidden');
//         if (btnText) btnText.textContent = "Connexion...";
//     }

//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;

//     try {
//         const res = await fetch(`${API_AUTH}/login`, { 
//             method: 'POST', 
//             headers: { 'Content-Type': 'application/json' }, 
//             body: JSON.stringify({ email, password }) 
//         });
        
//         const data = await res.json();
        
//         if (res.ok) { 
//             localStorage.setItem('token', data.token); 
//             if(data.user) localStorage.setItem('userName', data.user.nom);
//             window.location.replace('dashweb.html'); 
//         } else { 
//             alert("❌ " + data.message); 
//             // Remettre le bouton à zéro
//             if (submitBtn) {
//                 submitBtn.disabled = false;
//                 spinner?.classList.add('hidden');
//                 if (btnText) btnText.textContent = "Se connecter";
//             }
//         }
//     } catch (e) { 
//         alert("Erreur serveur : vérifiez votre connexion."); 
//         if (submitBtn) {
//             submitBtn.disabled = false;
//             spinner?.classList.add('hidden');
//             if (btnText) btnText.textContent = "Se connecter";
//         }
//     }
// }

async function seConnecter(event) {
    event.preventDefault();

    const email     = document.getElementById('email').value;
    const password  = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const spinner   = document.getElementById('spinner');
    const btnText   = document.getElementById('btnText');

    if (submitBtn) {
        submitBtn.disabled = true;
        spinner?.classList.remove('hidden');
        if (btnText) btnText.textContent = "Envoi du code...";
    }

    try {
        const res  = await fetch(`${API_AUTH}/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            // Sauvegarde pour étape 2
            tempUserId    = data.userId;
            tempUserEmail = email;

            // Cache le formulaire
            document.getElementById('loginForm').classList.add('hidden');

            // Affiche l'écran du code
            document.getElementById('codeScreen').classList.remove('hidden');
            document.getElementById('verificationCode')?.focus();

        } else {
            alert("❌ " + data.message);
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

async function handleVerifyCode(event) {
    if (event) event.preventDefault();

    // 1. On récupère le code tapé (vérifie que l'ID est bien 'verificationCode')
    const codeValue = document.getElementById('verificationCode').value.trim();

    try {
        // 2. On envoie au serveur
        const res = await fetch(`${API_AUTH}/verify-code`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ 
                userId: tempUserId, // L'ID récupéré au login
                code:   codeValue 
            })
        });

        const data = await res.json();

        if (res.ok) {
            // ✅ SUCCÈS : On enregistre le badge (Token)
            localStorage.setItem('token', data.token);
            if(data.user) localStorage.setItem('userName', data.user.nom);
            
            alert("✅ Connexion réussie !");
            window.location.replace('dashweb.html'); // On entre sur le site !
        } else {
            alert("❌ " + data.message);
        }
    } catch (e) {
        alert("Erreur de communication avec le serveur.");
    }
}

// ── VÉRIFICATION CODE 2FA — Étape 2 ──────────────────────
async function verifierCode() {
    const code         = document.getElementById('verificationCode').value.trim();
    const verifyBtn    = document.getElementById('verifyBtn');
    const verifySpinner = document.getElementById('verifySpinner');
    const verifyBtnText = document.getElementById('verifyBtnText');
    const codeError    = document.getElementById('codeError');

    if (code.length !== 6) {
        if (codeError) {
            codeError.textContent = "⚠ Le code doit contenir 6 chiffres.";
            codeError.classList.remove('hidden');
        }
        return;
    }

    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifySpinner?.classList.remove('hidden');
        if (verifyBtnText) verifyBtnText.textContent = "Vérification...";
    }

    try {
        const res  = await fetch(`${API_AUTH}/verify-code`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ userId: tempUserId, code })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            if (data.user) localStorage.setItem('userName', data.user.nom);
            window.location.replace('dashweb.html');
        } else {
            if (codeError) {
                codeError.textContent = "❌ " + data.message;
                codeError.classList.remove('hidden');
            }
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifySpinner?.classList.add('hidden');
                if (verifyBtnText) verifyBtnText.textContent = "Valider le code";
            }
        }
    } catch (e) {
        alert("❌ Erreur de connexion.");
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifySpinner?.classList.add('hidden');
            if (verifyBtnText) verifyBtnText.textContent = "Valider le code";
        }
    }
}

// ── RENVOYER LE CODE ─────────────────────────────────────
async function renvoyerCode() {
    if (!tempUserEmail) return;
    alert("⏳ Veuillez remplir à nouveau le formulaire pour recevoir un nouveau code.");
    document.getElementById('codeScreen').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    const submitBtn = document.getElementById('submitBtn');
    const btnText   = document.getElementById('btnText');
    if (submitBtn) submitBtn.disabled = false;
    if (btnText)   btnText.textContent = "Se connecter";
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
// ── OUVRIR LE MENU MOBILE (HAMBURGER) ──
function ouvrirMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    }
}

// ── FERMER LE MENU MOBILE ──
function fermerMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// ── AFFICHER LA BARRE DE RECHERCHE MOBILE ──
function toggleSearchMobile() {
    const searchBar = document.getElementById('searchMobile');
    if (searchBar) {
        searchBar.classList.toggle('hidden');
    }
}

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

// ── 4.1 GESTION DU MODAL (OUVRIR / FERMER) ───────────────
function openModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
        // Optionnel : on vide le formulaire quand on ferme
        document.getElementById('addHotelForm')?.reset();
        document.getElementById('preview')?.classList.add('hidden');
    }
}

// ── 4.2 CHARGER LES VRAIES NOTIFICATIONS ────────────────
async function chargerNotifications() {
    const notifMenu = document.getElementById('notifMenu');
    const badge = document.querySelector('#notifBtn span');
    if (!notifMenu) return;

    try {
        const res = await fetch(`${API_HOTELS}/notifications`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const notifications = await res.json();

        // Mise à jour du petit chiffre jaune
        if (badge) {
            badge.textContent = notifications.length;
            badge.classList.toggle('hidden', notifications.length === 0);
        }

        // Remplissage du menu blanc
        let html = '<div class="p-3 border-b font-bold text-xs">Notifications</div>';
        if (notifications.length === 0) {
            html += '<p class="p-4 text-[10px] text-gray-400 text-center italic">Aucun message</p>';
        } else {
            notifications.forEach(n => {
                html += `<div class="p-3 border-b hover:bg-gray-50 cursor-pointer"><p class="text-[11px] text-gray-800 font-medium">${n.message}</p></div>`;
            });
        }
        notifMenu.innerHTML = html;
    } catch (e) { console.error("Erreur notifs:", e); }
}
// pour le Email de réinitialisation du mot de passe,
// ── FONCTION MOT DE PASSE OUBLIÉ (LIAISON BACKEND) ──
async function handleForgotPassword(event) {
    if (event) event.preventDefault();
    const emailInput = document.getElementById('email');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();

    try {
        const response = await fetch(`${API_AUTH}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Accès passé : Un e-mail réel vient de vous être envoyé !");
            emailInput.value = ""; // On vide le champ
        } else {
            alert("❌ " + (data.message || "Message refusé"));
        }
    } catch (error) {
        console.error(error);
        alert("Erreur : Le serveur ne répond pas.");
    }
}

// ── RÉINITIALISATION DU MOT DE PASSE ─────────────────────
async function handleResetPassword(event) {
    if (event) event.preventDefault();

    // ÉTAPE 1 — Récupère le token depuis l'URL
    // L'URL doit ressembler à : reset-password.html?token=abc123
    const urlParams = new URLSearchParams(window.location.search);
    const token     = urlParams.get('token');

    console.log("Token dans URL :", token); // Pour débugger

    // ÉTAPE 2 — Vérifie que le token existe
    if (!token) {
        alert("❌ Lien invalide ! Token manquant dans l'URL.");
        return;
    }

    // ÉTAPE 3 — Récupère les deux mots de passe
    const password = document.getElementById('newPassword')?.value;
    const confirm  = document.getElementById('confirmPassword')?.value;

    // ÉTAPE 4 — Vérifie qu'ils correspondent
    if (!password || !confirm) {
        alert("❌ Veuillez remplir les deux champs.");
        return;
    }

    if (password !== confirm) {
        alert("❌ Les mots de passe ne correspondent pas !");
        return;
    }

    if (password.length < 6) {
        alert("❌ Le mot de passe doit contenir au moins 6 caractères.");
        return;
    }

    // ÉTAPE 5 — Envoie au serveur
    try {
        const response = await fetch(
            `${API_AUTH}/reset-password/${token}`,
            {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ password })
            }
        );

        const data = await response.json();
        console.log("Réponse serveur :", data);

        if (response.ok) {
            alert("✅ " + data.message);
            window.location.replace('se connecté.html');
        } else {
            alert("❌ " + (data.message || "Lien invalide ou expiré."));
        }

    } catch (error) {
        console.error("Erreur réseau :", error);
        alert("❌ Erreur de connexion au serveur.");
    }
}

// ============================================================
// 5. INITIALISATION (SÉCURITÉ MAXIMALE & VITESSE)
// ============================================================

// On utilise 'pageshow' pour que le code se relance même au clic sur "Retour"
window.addEventListener('pageshow', (event) => {
    const token = getToken();
    const path  = decodeURIComponent(window.location.pathname);
    console.log("Chemin actuel :", path);
    
    // Liste des pages autorisées sans badge
    const isPublic = path.includes('se connecté') || 
                     path.includes('inscription') || 
                     path.includes('mode pass oublie') || 
                     path.includes('reset');

                     console.log("Page publique ?", isPublic);

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

    // 🟢 AJOUT : On branche le formulaire du code à 6 chiffres
    // On cherche le formulaire à l'intérieur de ta div #codeScreen
    const verifyForm = document.querySelector('#codeScreen form'); 
    if (verifyForm) {
        console.log("Écouteur du code de sécurité activé");
        verifyForm.addEventListener('submit', handleVerifyCode);
    }

    // 🟢 3. BRANCHER LE FORMULAIRE DE CRÉATION D'HÔTEL (Cloudinary)
     const addForm = document.getElementById('addHotelForm');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addHotel(); // 🟢 Appelle la fonction d'envoi
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

