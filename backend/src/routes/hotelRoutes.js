const express         = require('express');
const router          = express.Router();
const hotelController = require('../controllers/hotelController');
const auth            = require('../middlewares/auth.middleware'); 
const storage         = require('../config/cloudinary');
const multer          = require('multer');
const upload          = multer({ storage });

// Routes protégées par 'auth'
// Ligne 10
router.get('/notifications', auth, hotelController.getNotifications);
router.get('/', auth, hotelController.getHotels);
router.get('/stats/count', auth, hotelController.getStats);
router.post('/', auth, upload.single('image'), hotelController.addHotel);
router.delete('/:id', auth, hotelController.deleteHotel);

module.exports = router;