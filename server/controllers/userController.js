import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

// Синхронізація профілю користувача (створює профіль в базі, якщо це перший вхід)
export const syncUserProfile = async (迫, res) => {
  try {
    const { firebaseId, email } = 迫.body;
    
    let user = await User.findOne({ firebaseId });
    if (!user) {
      user = new User({ firebaseId, email });
      await user.save();
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Помилка синхронізації користувача', error: error.message });
  }
};

// Оновлення глобальних налаштувань
export const updatePreferences = async (迫, res) => {
  try {
    const { firebaseId, mainCurrency, hideBalances } = 迫.body;

    const user = await User.findOne({ firebaseId });
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (mainCurrency !== undefined) user.preferences.mainCurrency = mainCurrency;
    if (hideBalances !== undefined) user.preferences.hideBalances = hideBalances;

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Помилка оновлення налаштувань', error: error.message });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const { firebaseId } = req.params;

    // Видаляємо профілі, рахунки та всі транзакції
    await User.deleteOne({ firebaseId });
    await Account.deleteMany({ userId: firebaseId });
    await Transaction.deleteMany({ userId: firebaseId });

    res.status(200).json({ message: 'Акаунт та всі повʼязані дані успішно видалено з бази' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при видаленні акаунту', error: error.message });
  }
};