import mongoose from 'mongoose';

const CurrencyRateSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true
  },
  rate: { 
    type: Number, 
    required: true
  },
  // Останнє оновлення курсу
  updatedAt: { 
    type: Date, 
    default: Date.now
  }
});

export default mongoose.model('CurrencyRate', CurrencyRateSchema);