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

    // 1. Générer le Token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    // 2. LIEN VERCEL (Remplace par ton vrai lien Vercel)
    const resetUrl = `https://red-product-fullstack-6bal.vercel.app/reset-password.html?token=${token}`;

    // 3. Envoyer l'e-mail (avec sécurité pour éviter l'erreur 500)
    try {
      await transporter.sendMail({
        from: '"RED PRODUCT Support" <noreply@redproduct.com>',
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html: `
          <h3>Bonjour ${user.nom},</h3>
          <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="background: #2a2a2a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Changer mon mot de passe
          </a>
        `
      });
      // Si le mail part :
      res.json({ success: true, message: "Accès passé : Un e-mail vous a été envoyé !" });
    } catch (mailError) {
      // Si le mail échoue (ex: Mailtrap non configuré sur Render)
      console.log("Erreur d'envoi d'e-mail, mais le token est créé :", token);
      res.json({ 
        success: true, 
        message: "Accès passé ! (Note: L'envoi d'e-mail est en test, le lien est dans la console Render)",
        tokenDebug: token // On l'envoie pour que tu puisses tester sans e-mail
      });
    }

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Chercher l'utilisateur qui possède ce Token et vérifier s'il n'est pas expiré
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // $gt veut dire "plus grand que l'heure actuelle"
    });

    if (!user) {
      return res.status(400).json({ message: "Le lien est invalide ou a expiré." });
    }

    // 2. Crypter le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Mettre à jour l'utilisateur et effacer les jetons de secours
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Félicitations ! Votre mot de passe a été modifié." });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la réinitialisation." });
  }
};