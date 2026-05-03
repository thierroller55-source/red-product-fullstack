const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Utilisation de SSL pour Gmail
  auth: {
    user: process.env.MAIL_USER, // thierroller55@gmail.com
    pass: process.env.MAIL_PASS  // Ton code de 16 lettres Google
  }
});

module.exports = transporter;