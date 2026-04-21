const mongoose = require('mongoose');

// On définit le "Schéma" : c'est le plan de construction d'un hôtel
const hotelSchema = new mongoose.Schema({
  nom:     { type: String, required: true }, // Le nom est obligatoire
  adresse: { type: String, required: true },
  email:   { type: String, required: true },
  tel:     { type: String, required: true },
  prix:    { type: Number, required: true }, // Type Nombre pour le prix
  devise:  { type: String, default: 'F XOF' },
  image:   { type: String } // Pour stocker l'URL de l'image plus tard
}, { 
  timestamps: true // Crée automatiquement 'createdAt' (date de création)
});

// On exporte le modèle pour l'utiliser dans le contrôleur
module.exports = mongoose.model('Hotel', hotelSchema);