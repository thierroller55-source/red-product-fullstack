const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Notification = require('../models/notificationModel');

// ── 1. INSCRIPTION ──
exports.register = async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ nom, email, password: hashedPassword });
    await newUser.save();
    
    res.status(201).json({ success: true, message: "Utilisateur créé !" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Erreur lors de l'inscription." });
  }
};

// ── 2. CONNEXION ──
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ success: false, message: "Accès refusé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Accès refusé" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: "Accès passé", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── 3. RÉCUPÉRER LES NOTIFICATIONS ──
exports.getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ owner: req.user.id })
                                     .sort({ date: -1 })
                                     .limit(5);
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── 4. MOT DE PASSE OUBLIÉ ──
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ 
      email: { $regex: new RegExp("^" + email.trim() + "$", "i") } 
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Message refusé" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ 
      success: true, 
      message: "Accès passé",
      token: token 
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};