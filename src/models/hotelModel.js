const fs   = require('fs');
const path = require('path');

// Fichier JSON qui stocke les hôtels
const DATA_FILE = path.join(__dirname, '../../hotels.json');

// Crée le fichier s'il n'existe pas
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// ── Lire tous les hôtels ──────────────────────────────────
function getAll() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// ── Sauvegarder les hôtels ────────────────────────────────
function save(hotels) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(hotels, null, 2));
}

// ── Ajouter un hôtel ──────────────────────────────────────
function add(hotelData) {
  const hotels = getAll();

  const nouvelHotel = {
    id:      hotels.length + 1,
    nom:     hotelData.nom,
    adresse: hotelData.adresse,
    email:   hotelData.email,
    tel:     hotelData.tel,
    prix:    hotelData.prix,
    devise:  hotelData.devise || 'F XOF'
  };

  hotels.push(nouvelHotel);
  save(hotels);

  return nouvelHotel;
}

// ── Supprimer un hôtel ────────────────────────────────────
function deleteById(id) {
  let hotels = getAll();
  hotels     = hotels.filter(h => h.id !== id);
  save(hotels);
}

module.exports = { getAll, add, delete: deleteById };