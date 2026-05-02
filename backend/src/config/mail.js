const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Utilisation de SSL pour plus de sécurité sur Render
  auth: {
    // 🟢 On utilise les variables que tu as déjà créées sur Render
    user: process.env.MAIL_USER, 
    pass: process.env.MAIL_PASS  
  }
});

module.exports = transporter;