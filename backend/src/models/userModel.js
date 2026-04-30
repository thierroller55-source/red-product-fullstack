// const mongoose = require('mongoose');


// const userSchema = new mongoose.Schema({
//   nom:      { type: String, required: true },
//   email:    { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   // Le rôle permet de savoir si c'est un client ou toi (l'admin)
//   role:     { type: String, enum: ['client', 'admin'], default: 'client' }
  
// }, { 
//   timestamps: true 
// });

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom:      { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['client', 'admin'], default: 'client' },

  // 🟢 NOUVEAU : Champs pour la réinitialisation du mot de passe
  resetPasswordToken: String,
  resetPasswordExpires: Date
  
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);