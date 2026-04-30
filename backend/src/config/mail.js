const nodemailer = require('nodemailer');

// Configuration du transporteur (Moteur d'envoi)
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io", // Remplace par tes infos Mailtrap
  port: 2525,
  auth: {
    user: "762781dc9a234f", // À mettre dans ton .env
    pass: "e585d9775b9af3"  // À mettre dans ton .env
  }
});

module.exports = transporter;