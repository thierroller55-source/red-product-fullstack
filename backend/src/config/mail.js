

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // On utilise les variables d'environnement pour cacher tes accès
    user: "thierroller55@gmail.com", 
    pass: "qiqsjkbeqezkxddk" 
  }
});

module.exports = transporter;