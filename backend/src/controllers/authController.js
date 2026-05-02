const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Notification = require('../models/notificationModel');
const crypto = require('crypto');
const transporter = require('../config/mail');

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

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: "Accès passé", token, user: { nom: user.nom } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── 3. NOTIFICATIONS ──
exports.getNotifications = async (req, res) => {
  try {
    let query = { owner: req.user.id };
    if (req.user.role === 'admin') query = {};
    const notifs = await Notification.find(query).sort({ date: -1 }).limit(10);
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── 4. MOT DE PASSE OUBLIÉ ──
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: "Message refusé" });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetUrl = `https://red-product-fullstack-6bal.vercel.app/reset-password.html?token=${token}`;

    try {
      await transporter.sendMail({
        from: '"RED PRODUCT" <thierroller55@gmail.com>',
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html: `<h4>Bonjour ${user.nom},</h4><p>Lien : <a href="${resetUrl}">${resetUrl}</a></p>`
      });
      res.status(200).json({ success: true, message: "Accès passé" });
    } catch (mailErr) {
      res.status(200).json({ success: true, message: "Accès passé (Mail en test)", debugToken: token });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur technique" });
  }
};

// ── 5. RÉINITIALISATION RÉELLE ──
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: "Lien invalide ou expiré." });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: "Mot de passe modifié avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur réinitialisation" });
  }
};