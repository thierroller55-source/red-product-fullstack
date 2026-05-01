

// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     // On utilise les variables d'environnement pour cacher tes accès
//     user: "thierroller55@gmail.com", 
//     pass: "qiqsjkbeqezkxddk" 
//   }
// });

// module.exports = transporter;


const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Utilisation de SSL (plus sécurisé pour Render)
  auth: {
    user: "thierroller55@gmail.com", 
    pass: "qiqsjkbeqezkxddk"  
  }
});

module.exports = transporter;