
const express    = require('express');
const router     = express.Router();
const authController = require('../controllers/authController');
const auth       = require('../middlewares/auth.middleware');

router.post('/register',              authController.register);
router.post('/login',                 authController.login);
router.post('/verify-code',           authController.verifyCode); // ✅ AJOUTE CETTE LIGNE
router.get('/notifications',          auth, authController.getNotifications);
router.post('/forgot-password',       authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify',                 auth, (req, res) => {
    res.json({ success: true, user: req.user });
});

module.exports = router;