const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  color: { type: String, required: false },
  mileage: { type: Number, required: false },
  type: { type: String, required: true },
  image: { type: String, required: true },
  location: { type: String, required: true },
  rentalPricePerDay: { type: Number, required: true },
  available: { type: Boolean, default: true },
  accepted: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
