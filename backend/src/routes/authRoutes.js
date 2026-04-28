const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
// Route pour récupérer les notifications de l'utilisateur connecté
router.get('/notifications', auth, async (req, res) => {
  const notifs = await Notification.find({ owner: req.user.id }).sort({ date: -1 }).limit(5);
  res.json(notifs);
});

module.exports = router;