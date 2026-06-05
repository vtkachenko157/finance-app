import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  categoryName: { type: String, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now }
});

// Складений індекс для надшвидкої видачі історії для Dashboard
TransactionSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Transaction', TransactionSchema);