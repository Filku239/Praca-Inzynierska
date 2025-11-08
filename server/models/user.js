const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, required: true, minlength: 8,
    validate: {
      validator: value => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value),
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    }
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

module.exports = mongoose.model('User', userSchema);
