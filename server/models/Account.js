import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
userId: { type: String, required: true }, // Firebase UID
  accountName: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['cash', 'manual_bank', 'api_bank'], 
    required: true 
  },
  balance: { type: Number, required: true, default: 0 },
  currency: { type: String, required: true, default: 'UAH' },
  
  // === НОВІ ПОЛЯ ДЛЯ API ІНТЕГРАЦІЇ ===
  apiProvider: { type: String, enum: ['monobank', 'privatbank', null], default: null },
  apiToken: { type: String, default: null },
  monobankAccountId: { type: String, default: null },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Account', AccountSchema);