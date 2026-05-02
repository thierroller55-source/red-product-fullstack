const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const auth           = require('../middlewares/auth.middleware'); // Ton gendarme

// --- ROUTES PUBLIQUES ---
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// --- 🟢 NOUVEAU : ROUTE DE VÉRIFICATION DU TOKEN ---
// Cette route répond "valide: true" si le middleware 'auth' laisse passer
router.get('/verify', auth, (req, res) => {
    res.json({ valide: true, user: req.user });
});

// --- ROUTES PROTÉGÉES ---
router.get('/notifications', auth, authController.getNotifications);

module.exports = router;