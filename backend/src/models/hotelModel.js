const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  nom:     { type: String, required: true },
  adresse: { type: String, required: true },
  email:   { type: String, required: true },
  tel:     { type: String, required: true },
  prix:    { type: Number, required: true },
  devise:  { type: String, default: 'F XOF' },
  image:   { type: String },
  // 🟢 CE CHAMP LIE L'HÔTEL À UN UTILISATEUR
  owner:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Hotel', hotelSchema);