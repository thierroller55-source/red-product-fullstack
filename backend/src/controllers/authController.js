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


// ── 2. CONNEXION AVEC CODE 2FA ──
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Accès refusé" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Accès refusé" });

    // Génère un code à 6 chiffres — UNE SEULE FOIS
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode        = code;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // LOG TEMPORAIRE
    console.log("═══════════════════════════════");
    console.log("🔐 CODE 2FA :", code);
    console.log("📧 ENVOI À  :", user.email);
    console.log("═══════════════════════════════");

    // Envoie le code par email
    try {
      await transporter.sendMail({
        from: '"RED PRODUCT" <thierroller55@gmail.com>',
        to:   user.email,
        subject: "🔐 Votre code de connexion RED PRODUCT",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                      padding:30px;border:1px solid #eee;border-radius:10px">
            <h2 style="color:#454d55">RED PRODUCT</h2>
            <p>Bonjour <strong>${user.nom}</strong>,</p>
            <p>Voici votre code de vérification :</p>
            <div style="background:#f4f4f4;padding:20px;text-align:center;
                        border-radius:8px;margin:20px 0">
              <h1 style="color:#454d55;letter-spacing:8px;font-size:36px">
                ${code}
              </h1>
            </div>
            <p style="color:#888;font-size:12px">
              Ce code expire dans <strong>10 minutes</strong>.
            </p>
            <p style="color:#888;font-size:12px">
              Si vous n'avez pas demandé cette connexion, ignorez cet email.
            </p>
          </div>
        `
      });
      console.log("✅ Email 2FA envoyé !");
    } catch (mailErr) {
      console.error("❌ Erreur email 2FA:", mailErr.message);
    }

    res.json({
      success: true,
      message: "Code envoyé par email",
      userId:  user._id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── 2. CONNEXION AVEC CODE 2FA ──
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ success: false, message: "Accès refusé" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ success: false, message: "Accès refusé" });

//     // Génère un code à 6 chiffres
//     const code = Math.floor(100000 + Math.random() * 900000).toString();
//     user.verificationCode        = code;
//     user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
//     await user.save();

//     user.verificationCode        = code;
// user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;
// await user.save();

// // ✅ AJOUTE TEMPORAIREMENT pour voir le code dans le terminal
// console.log("🔐 CODE 2FA GÉNÉRÉ :", code);

//     // Envoie le code par email
//     try {
//       await transporter.sendMail({
//         from: '"RED PRODUCT" <thierroller55@gmail.com>',
//         to:   user.email,
//         subject: "🔐 Votre code de connexion RED PRODUCT",
//         html: `
//           <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
//                       padding:30px;border:1px solid #eee;border-radius:10px">
//             <h2 style="color:#454d55">RED PRODUCT</h2>
//             <p>Bonjour <strong>${user.nom}</strong>,</p>
//             <p>Voici votre code de vérification :</p>
//             <div style="background:#f4f4f4;padding:20px;text-align:center;
//                         border-radius:8px;margin:20px 0">
//               <h1 style="color:#454d55;letter-spacing:8px;font-size:36px">
//                 ${code}
//               </h1>
//             </div>
//             <p style="color:#888;font-size:12px">
//               Ce code expire dans <strong>10 minutes</strong>.
//             </p>
//             <p style="color:#888;font-size:12px">
//               Si vous n'avez pas demandé cette connexion, ignorez cet email.
//             </p>
//           </div>
//         `
//       });
//     } catch (mailErr) {
//       console.error("Erreur email 2FA:", mailErr);
//     }

//     // Retourne l'userId SANS token — on attend la vérification du code
//     res.json({
//       success: true,
//       message: "Code envoyé par email",
//       userId:  user._id
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: "Erreur serveur." });
//   }
// };


// ── 2B. VÉRIFICATION DU CODE 2FA ── (NOUVELLE FONCTION)
exports.verifyCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findOne({
      _id: userId,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(401).json({
      success: false,
      message: "Code invalide ou expiré."
    });

    // Efface le code utilisé
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Génère le vrai token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: "Connexion réussie !",
      token,
      user: { nom: user.nom }
    });

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

    // ✅ CORRECT — GitHub Pages
    const resetUrl = `https://thierroller55-source.github.io/red-product-fullstack/frontend/reset-password.html?token=${token}`;
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