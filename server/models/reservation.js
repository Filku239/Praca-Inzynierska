const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User',required: true },
  cost: { type: Number, required: true },
});

module.exports = mongoose.model('Reservation', reservationSchema);
