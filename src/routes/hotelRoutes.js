const express        = require('express');
const router         = express.Router();
const hotelController = require('../controllers/hotelController');

// GET    /api/hotels       → Récupérer tous les hôtels
router.get('/', hotelController.getHotels);

// POST   /api/hotels       → Ajouter un hôtel
router.post('/', hotelController.addHotel);

// DELETE /api/hotels/:id   → Supprimer un hôtel
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;