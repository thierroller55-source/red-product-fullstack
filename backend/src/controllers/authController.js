const newUser = new User({ nom, email, password: hashedPassword });
await newUser.save();

res.status(201).json({ success: true, message: "Utilisateur créé !" });
if (!user) return res.status(401).json({ success: false, message: "Accès refusé" });

const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(401).json({ success: false, message: "Accès refusé" });

const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
res.json({ success: true, message: "Accès passé", token });
// 🟢 SI C'EST L'ADMIN : On enlève le filtre pour qu'il voit TOUTES les notifs du site
if (req.user.role === 'admin') {
  query = {}; // L'admin voit tout
}

const notifs = await Notification.find(query)
                                 .populate('owner', 'nom') // Pour savoir quel client a fait l'action
                                 .sort({ date: -1 })
                                 .limit(10);
res.json(notifs);
// 1. Si l'email n'existe pas
if (!user) {
  return res.status(404).json({ success: false, message: "Message refusé" });
}

// 2. Créer une clé de secours (Token)
const token = crypto.randomBytes(20).toString('hex');
user.resetPasswordToken = token;
user.resetPasswordExpires = Date.now() + 3600000; // Valable 1 heure
await user.save();

// 3. Préparer l'e-mail réel
const resetUrl = `https://red-product-fullstack-6bal.vercel.app/reset-password.html?token=${token}`;

const mailOptions = {
  from: '"RED PRODUCT" <thierroller55@gmail.com>',
  to: user.email,
  subject: "Réinitialisation de votre mot de passe",
  html: `
    <h2>Bonjour ${user.nom},</h2>
    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
    <p>Cliquez sur le bouton ci-dessous pour continuer :</p>
    <a href="${resetUrl}" style="background-color: #2a2a2a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Changer mon mot de passe
    </a>
    <p>Ce lien expirera dans 1 heure.</p>
  `
};

// 4. Envoyer l'e-mail
await transporter.sendMail(mailOptions);

// 5. Réponse au frontend
res.status(200).json({ success: true, message: "Accès passé" });
// 1. Chercher l'utilisateur qui possède ce Token et vérifier s'il n'est pas expiré
const user = await User.findOne({
  resetPasswordToken: token,
  resetPasswordExpires: { $gt: Date.now() } // $gt veut dire "plus grand que l'heure actuelle"
});

if (!user) {
  return res.status(400).json({ message: "Le lien est invalide ou a expiré." });
}

// 2. Crypter le nouveau mot de passe
const hashedPassword = await bcrypt.hash(password, 10);

// 3. Mettre à jour l'utilisateur et effacer les jetons de secours
user.password = hashedPassword;
user.resetPasswordToken = undefined;
user.resetPasswordExpires = undefined;
await user.save();

res.json({ success: true, message: "Félicitations ! Votre mot de passe a été modifié." });