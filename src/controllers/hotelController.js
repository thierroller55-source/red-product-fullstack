const Hotel = require('../models/hotelModel');

// ── GET — Récupérer tous les hôtels ──────────────────────
exports.getHotels = (req, res) => {
  try {
    const hotels = Hotel.getAll();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── POST — Ajouter un hôtel ───────────────────────────────
exports.addHotel = (req, res) => {
  try {
    const { nom, adresse, email, tel, prix, devise } = req.body;

    // Validation
    if (!nom || !adresse || !email || !tel || !prix) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    const nouvelHotel = Hotel.add({ nom, adresse, email, tel, prix, devise });
    res.status(201).json(nouvelHotel);

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ── DELETE — Supprimer un hôtel ───────────────────────────
exports.deleteHotel = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    Hotel.delete(id);
    res.json({ message: 'Hôtel supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};