require('dotenv').config(); // Ligne 1 : Charger les variables d'environnement
const express = require('express');
const cors = require('cors'); // Indispensable pour parler au frontend séparé
const connectDB = require('./src/config/db');
const hotelRoutes = require('./src/routes/hotelRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// ─── 1. CONNEXION À LA BASE DE DONNÉES ────────────────────────
connectDB();

// ─── 2. MIDDLEWARES ───────────────────────────────────────────
app.use(cors()); // Autorise ton dossier frontend à faire des requêtes ici
app.use(express.json()); // Permet de lire le JSON envoyé par le script.js

// ─── 3. ROUTES API ────────────────────────────────────────────
// On ne met QUE les routes API ici. Pas de express.static !
app.use('/api/hotels', hotelRoutes);
app.use('/api/auth', authRoutes);

// Route de test pour vérifier que l'API est en ligne
app.get('/api/test', (req, res) => {
  res.json({ message: "L'API RED PRODUCT fonctionne parfaitement !" });
});

// ─── 4. LANCEMENT DU SERVEUR ──────────────────────────────────
// On utilise process.env.PORT pour le futur déploiement sur Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur API lancé sur http://localhost:${PORT}`);
});