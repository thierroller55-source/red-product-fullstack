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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, message: "Accès passé", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── 3. RÉCUPÉRER LES NOTIFICATIONS ──
exports.getNotifications = async (req, res) => {
  try {
    let query = { owner: req.user.id }; // Par défaut : le client voit ses notifs

    // 🟢 SI C'EST L'ADMIN : On enlève le filtre pour qu'il voit TOUTES les notifs du site
    if (req.user.role === 'admin') {
      query = {}; // L'admin voit tout
    }

    const notifs = await Notification.find(query)
                                     .populate('owner', 'nom') // Pour savoir quel client a fait l'action
                                     .sort({ date: -1 })
                                     .limit(10);
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── 4. MOT DE PASSE OUBLIÉ ──
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Message refusé : Email non reconnu." });
    }

    // 1. Générer un Token unique et aléatoire
    const token = crypto.randomBytes(20).toString('hex');

    // 2. Enregistrer le token et l'expiration (valable 1h) dans MongoDB
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    // 3. Créer le lien qui sera dans l'e-mail
    // (Remplace par ton lien Vercel quand tu seras prêt)
    const resetUrl = `http://127.0.0.1:5501/frontend/reset-password.html?token=${token}`;

    // 4. Envoyer l'e-mail réel
    await transporter.sendMail({
      from: '"RED PRODUCT Support" <noreply@redproduct.com>',
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <h3>Bonjour ${user.nom},</h3>
        <p>Vous avez demandé à changer votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (Lien valable 1 heure) :</p>
        <a href="${resetUrl}" style="background: #2a2a2a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Changer mon mot de passe
        </a>
        <p>Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>
      `
    });

    res.json({ success: true, message: "Accès passé : Un e-mail vous a été envoyé !" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'e-mail." });
  }
};