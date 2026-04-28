const Hotel = require('../models/hotelModel');

// ── 1. RÉCUPÉRER TOUS LES HÔTELS ─────────────────────────────
exports.getHotels = async (req, res) => {
  try {
    let hotels;

    // 1. SI l'utilisateur connecté est ADMIN : il voit TOUT
    if (req.user.role === 'admin') {
      console.log("Accès Admin : Récupération de tous les hôtels.");
      hotels = await Hotel.find().sort({ createdAt: -1 });
    } 
    // 2. SI l'utilisateur est CLIENT : il ne voit QUE SES hôtels
    else {
      console.log(`Accès Client (${req.user.id}) : Récupération des hôtels privés.`);
      hotels = await Hotel.find({ owner: req.user.id }).sort({ createdAt: -1 });
    }

    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 2. AJOUTER UN NOUVEL HÔTEL (AVEC IMAGE CLOUDINARY) ────────
exports.addHotel = async (req, res) => {
  try {
    const hotelData = req.body;

    // 1. On récupère l'image si elle existe
    if (req.file) {
      hotelData.image = req.file.path; 
    }

    // 2. IMPORTANT : On définit le propriétaire TOUT LE TEMPS
    // (Cette ligne doit être en dehors du if de l'image)
    hotelData.owner = req.user.id;

    const nouvelHotel = new Hotel(hotelData);
    await nouvelHotel.save();

    // 🟢 AJOUT : Créer une notification réelle
    await Notification.create({
      message: `Nouvel hôtel ajouté : ${nouvelHotel.nom}`,
      owner: req.user.id
    });

    res.status(201).json(nouvelHotel);
  } catch (error) {
    res.status(400).json({ 
        message: "Erreur lors de l'ajout", 
        error: error.message 
    });
  }
};

// ── 3. SUPPRIMER UN HÔTEL ────────────────────────────────────
exports.deleteHotel = async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ message: "Hôtel supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Ajoute ce code à la fin de ton fichier hotelController.js pour la route de statistiques :
const User = require('../models/userModel'); // Assure-toi d'importer le modèle User

exports.getStats = async (req, res) => {
  try {
    const nbHotels = await Hotel.countDocuments(); // Compte les hôtels
    const nbUsers = await User.countDocuments();   // Compte les utilisateurs

    res.json({
      hotels: nbHotels,
      users: nbUsers,
      messages: 45,    // On peut laisser statique ou créer une collection plus tard
      emails: 12,
      formulaires: 8,
      enquetes: 3
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};