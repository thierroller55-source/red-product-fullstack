const Hotel = require('../models/hotelModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

// ── 1. RÉCUPÉRER LES HÔTELS (Filtré Admin/Client) ─────────────
exports.getHotels = async (req, res) => {
  try {
    let hotels;
    // Si Admin : voit tout. Si Client : voit seulement ses hôtels.
    if (req.user.role === 'admin') {
      hotels = await Hotel.find().sort({ createdAt: -1 });
    } else {
      hotels = await Hotel.find({ owner: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 2. AJOUTER UN HÔTEL (Avec Image & Notif) ──────────────────
exports.addHotel = async (req, res) => {
  try {
    const hotelData = req.body;

    if (req.file) {
      hotelData.image = req.file.path; 
    }

    // On lie l'hôtel à l'utilisateur connecté
    hotelData.owner = req.user.id;

    const nouvelHotel = new Hotel(hotelData);
    await nouvelHotel.save();

    // Créer une notification réelle dans MongoDB
    await Notification.create({
      message: `Nouvel hôtel ajouté : ${nouvelHotel.nom}`,
      owner: req.user.id
    });

    res.status(201).json(nouvelHotel);
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de l'ajout", error: error.message });
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

// ── 4. RÉCUPÉRER LES STATISTIQUES ─────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const nbHotels = await Hotel.countDocuments();
    const nbUsers = await User.countDocuments();

    res.json({
      hotels: nbHotels,
      users: nbUsers,
      messages: 45,
      emails: 12,
      formulaires: 8,
      enquetes: 3
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── 5. RÉCUPÉRER LES NOTIFICATIONS ────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ owner: req.user.id })
                                     .sort({ date: -1 })
                                     .limit(10);
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};