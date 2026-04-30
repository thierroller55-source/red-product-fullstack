const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');

// 🟢 CORRECTION DU CHEMIN (Vérifie bien le 's' à middlewares)
const auth           = require('../middlewares/auth.middleware'); 

router.post('/register', authController.register);
router.post('/login', authController.login);

// Route pour récupérer les notifications (Une seule suffit)
router.get('/notifications', auth, authController.getNotifications); 
router.post('/forgot-password', authController.forgotPassword);
// Ajoute cette ligne dans authRoutes.js
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;