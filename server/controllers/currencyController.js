import CurrencyRate from '../models/Currency.js';
import { updateCurrencyRates } from '../currencyService.js';

// Отримати всі курси з нашої бази
export const getRates = async (req, res) => {
  try {
    const rates = await CurrencyRate.find();
    res.status(200).json(rates);
  } catch (error) {
    res.status(500).json({ message: 'Помилка отримання курсів', error: error.message });
  }
};
/*
// Примусове ручне оновлення курсів з НБУ
export const forceUpdateRates = async (req, res) => {
  const result = await updateCurrencyRates();
  if (result.success) {
    const updatedRates = await CurrencyRate.find();
    return res.status(200).json({ message: 'Курси успішно оновлено', rates: updatedRates });
  } else {
    return res.status(500).json({ message: 'Не вдалося оновити курси', error: result.error });
  }
};
*/