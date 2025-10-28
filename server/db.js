const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://filipkuciel3:Proste123@cluster0.r7wvh.mongodb.net/myapp?retryWrites=true&w=majority'
    );
    console.log('✅ Connected to MongoDB via Mongoose');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = { connectDB, mongoose };
