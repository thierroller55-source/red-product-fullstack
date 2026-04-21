const express        = require('express');
const router         = express.Router();
const hotelController = require('../controllers/hotelController');
const multer = require('multer');
const storage = require('../config/cloudinary');
const upload = multer({ storage });


// GET    /api/hotels       → Récupérer tous les hôtels
router.get('/', hotelController.getHotels);

// On ajoute 'upload.single('image')' entre l'URL et le contrôleur
router.post('/', upload.single('image'), hotelController.addHotel);
// DELETE /api/hotels/:id   → Supprimer un hôtel
router.delete('/:id', hotelController.deleteHotel);

module.exports = router;