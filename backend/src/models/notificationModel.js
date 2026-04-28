const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
  lu: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Pour qui est la notif
});

module.exports = mongoose.model('Notification', notificationSchema);