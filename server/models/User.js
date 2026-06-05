import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  mainCurrency: {
    type: String,
    default: 'UAH'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
export default User;