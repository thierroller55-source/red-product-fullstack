const axios = require('axios');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Notification = require('../models/notificationModel');
const crypto = require('crypto');




// — 1. INSCRIPTION AVEC VÉRIFICATION EMAIL —
exports.register = async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    // Vérifie si email déjà utilisé
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({
      message: "Email déjà utilisé."
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      nom,
      email,
      password: hashedPassword,
      isActive: false,
      activationToken
    });
    await newUser.save();

    // Lien d'activation
    const activationUrl = `https://red-product-fullstack.onrender.com/api/auth/activate?token=${activationToken}`;

    // Envoi email via Brevo
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "RED PRODUCT", email: "thierroller55@gmail.com" },
      to: [{ email }],
      subject: "Active ton compte RED PRODUCT",
      htmlContent: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <div style="background:#1a1a1a;padding:30px;text-align:center;">
      <h1 style="color:#e63946;margin:0;font-size:28px;letter-spacing:2px;">RED PRODUCT</h1>
      <p style="color:#aaaaaa;margin:8px 0 0;font-size:13px;">Plateforme de gestion hôtelière</p>
    </div>
    <div style="padding:40px 30px;">
      <h2 style="color:#1a1a1a;font-size:22px;">Bienvenue ${nom} ! 👋</h2>
      <p style="color:#555555;font-size:15px;line-height:1.6;">
        Merci de vous être inscrit sur <strong>RED PRODUCT</strong>.<br>
        Cliquez sur le bouton ci-dessous pour activer votre compte.
      </p>
      <div style="text-align:center;margin:35px 0;">
        <a href="${activationUrl}" style="background:#e63946;color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
          ✅ Activer mon compte
        </a>
      </div>
      <p style="color:#999999;font-size:12px;text-align:center;">
        Ce lien expire dans <strong>24 heures</strong>.<br>
        Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
    </div>
    <div style="background:#1a1a1a;padding:20px;text-align:center;">
      <p style="color:#666666;font-size:12px;margin:0;">© 2026 RED PRODUCT — Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.status(201).json({
      success: true,
      message: "Compte créé ! Vérifie ton email."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// — 2. CONNEXION DIRECTE (SANS 2FA) —
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({
      success: false,
      message: "Adresse email introuvable."
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!user.isActive) return res.status(403).json({
      success: false,
      message: "Vérifie ton email pour activer ton compte."
    });

    // Génère le token JWT directement
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};


exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ activationToken: token });

    if (!user) return res.status(400).json({
      message: "Lien invalide ou expiré."
    });

    user.isActive = true;
    user.activationToken = undefined;
    await user.save();

    res.redirect('https://red-product-fullstack-6bal.vercel.app/se%20connecté.html?activated=true');
  } catch (error) {
    res.status(500).json({ error: error.message });
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


// — 4. MOT DE PASSE OUBLIÉ —
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ 
      success: false, 
      message: "Aucun compte avec cet email." 
    });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    const resetUrl = `https://red-product-fullstack-6bal.vercel.app/reset-password.html?token=${token}`;

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "RED PRODUCT", email: "thierroller55@gmail.com" },
      to: [{ email: user.email }],
      subject: "Réinitialisation de votre mot de passe",
      htmlContent: `
<div style="font-family:Arial;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;">
  <div style="background:#1a1a1a;padding:25px;text-align:center;">
    <h1 style="color:#e63946;margin:0;letter-spacing:2px;">RED PRODUCT</h1>
    <p style="color:#aaa;margin:5px 0 0;font-size:13px;">Plateforme de gestion hôtelière</p>
  </div>
  <div style="padding:35px;">
    <h2 style="color:#1a1a1a;">Bonjour ${user.nom} 👋</h2>
    <p style="color:#555;font-size:15px;line-height:1.6;">
      Vous avez demandé à réinitialiser votre mot de passe.<br>
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${resetUrl}" 
         style="background:#e63946;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
        🔐 Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center;">
      Ce lien expire dans <strong>1 heure</strong>.<br>
      Si vous n'avez pas fait cette demande, ignorez cet email.
    </p>
  </div>
  <div style="background:#1a1a1a;padding:15px;text-align:center;">
    <p style="color:#666;font-size:12px;margin:0;">© 2026 RED PRODUCT — Tous droits réservés</p>
  </div>
</div>`
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Email de réinitialisation envoyé !" 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Erreur technique" 
    });
  }
};

// ── 5. RÉINITIALISATION RÉELLE ──
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() } 
    });
    
    if (!user) return res.status(400).json({ 
      message: "Lien invalide ou expiré." 
    });

    // Hash le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Force la mise à jour avec updateOne pour éviter les problèmes Mongoose
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
      }
    );

    res.json({ 
      success: true, 
      message: "Mot de passe modifié avec succès !" 
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur réinitialisation" });
  }
};

