const nodemailer = require('nodemailer');

// Configuration du transporteur (Moteur d'envoi)
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io", // Remplace par tes infos Mailtrap
  port: 2525,
  auth: {
    user: "TON_USER_MAILTRAP", // À mettre dans ton .env
    pass: "TON_PASS_MAILTRAP"  // À mettre dans ton .env
  }
});

module.exports = transporter;