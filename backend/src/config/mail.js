// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true, // Utilisation de SSL pour Gmail
//   auth: {
//     user: process.env.MAIL_USER, // thierroller55@gmail.com
//     pass: process.env.MAIL_PASS  // Ton code de 16 lettres Google
//   }
// });

// module.exports = transporter;

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Doit être false pour le port 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS 
  },
  tls: {
    // Cette option aide Render à ne pas bloquer la connexion
    rejectUnauthorized: false 
  }
});

module.exports = transporter;