const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
  try {
    // 1. On récupère le token dans l'en-tête (Header)
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: "Accès refusé : Aucun badge trouvé." });
    }

    // 2. On vérifie si le token est valide avec notre clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. On cherche l'utilisateur dans la base pour avoir son RÔLE à jour
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Utilisateur inexistant." });
    }

    // 4. TRÈS IMPORTANT : On ajoute les infos de l'utilisateur à la requête (req)
    // C'est ce qui permet au contrôleur de faire : if (req.user.role === 'admin')
    req.user = {
      id: user._id,
      role: user.role,
      nom: user.nom
    };

    next(); // On laisse passer vers le contrôleur
  } catch (error) {
    res.status(401).json({ message: "Badge invalide ou expiré." });
  }
};

module.exports = auth;