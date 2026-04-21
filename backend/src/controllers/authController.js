const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ── 1. INSCRIPTION ──
exports.register = async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({ nom, email, password: hashedPassword });
    await newUser.save();
    
    res.status(201).json({ success: true, message: "Utilisateur créé !" });
  } catch (error) {
    // AJOUTE CETTE LIGNE pour voir l'erreur exacte dans le terminal (ex: "nom is required")
    console.log("Détail de l'erreur d'inscription :", error.message); 

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

    const token = jwt.sign({ id: user._id }, 'VOTRE_CLE_SECRET', { expiresIn: '1h' });
    res.json({ success: true, message: "Accès passé", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

// ── 3. MOT DE PASSE OUBLIÉ (Corrigé) ──
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. On cherche l'utilisateur dans MongoDB (insensible à la casse)
    const user = await User.findOne({ 
      email: { $regex: new RegExp("^" + email.trim() + "$", "i") } 
    });

    // 2. SI L'EMAIL N'EXISTE PAS -> Message refusé
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Message refusé" 
      });
    }

    // 3. SI L'EMAIL EXISTE -> ON GÉNÈRE UN TOKEN
    const token = jwt.sign({ id: user._id }, 'VOTRE_CLE_SECRET', { expiresIn: '1h' });

    // 4. On renvoie le message ET le token au frontend
    return res.status(200).json({ 
      success: true, 
      message: "Accès passé",
      token: token 
    });

  } catch (error) {
    console.error("Erreur forgotPassword:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};