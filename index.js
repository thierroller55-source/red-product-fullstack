const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const hotelRoutes = require('./src/routes/hotelRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Chemin correct vers ton dossier frontend
app.use(express.static(path.join(__dirname, '..', '1projet_volkano', '1projet_vilkano')));
// Route par défaut → ouvre index.html du frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '1projet_volkano', '1projet_vilkano', 'index.html'));
});

// Routes API
app.use('/api/hotels', hotelRoutes);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});