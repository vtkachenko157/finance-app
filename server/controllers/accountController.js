import Account from '../models/Account.js';

// Допоміжна функція для конвертації числових кодів валют Monobank у літери
const getCurrencyCodeStr = (code) => {
  if (code === 980) return 'UAH';
  if (code === 840) return 'USD';
  if (code === 978) return 'EUR';
  if (code === 985) return 'PLN';
  return 'UAH';
};

export const createAccount = async (req, res) => {
  try {
    const { userId, accountName, type, initialBalance, currency, apiProvider, apiToken } = req.body;

    // ЯКЩО ЦЕ ЗВИЧАЙНИЙ РУЧНИЙ РАХУНОК (Звичайний режим)
    if (type !== 'api_bank') {
      const newAccount = new Account({
        userId,
        accountName,
        type,
        balance: Number(initialBalance || 0),
        currency
      });
      const savedAccount = await newAccount.save();
      return res.status(201).json(savedAccount);
    }

    // ЯКЩО КОРИСТУВАЧ ПІДКЛЮЧАЄ MONOBANK ПО API
    if (type === 'api_bank' && apiProvider === 'monobank') {
      if (!apiToken) {
        return res.status(400).json({ message: 'API токен Monobank обовʼязковий' });
      }

      // Використовуємо стандартний Fetch для запиту до Монобанку
      const response = await fetch('https://api.monobank.ua/personal/client-info', {
        method: 'GET',
        headers: { 
          'X-Token': apiToken 
        }
      });

      // Якщо Monobank відповів помилкою (наприклад, недійсний токен)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({ 
          message: 'Monobank відхилив запит. Перевірте правильність токену.',
          error: errorData.errText || response.statusText 
        });
      }

      const data = await response.json();
      const monoAccounts = data.accounts; // Масив карток користувача

      if (!monoAccounts || monoAccounts.length === 0) {
        return res.status(400).json({ message: 'У цього профілю не знайдено активних карток' });
      }

      const createdAccounts = [];

      // Проходимо циклом по кожній картці з Монобанку
      for (const monoAcc of monoAccounts) {
        // Перевіряємо, чи цей рахунок вже додавали раніше, щоб уникнути дублів
        const existingAcc = await Account.findOne({ userId, monobankAccountId: monoAcc.id });
        
        if (!existingAcc) {
          const realBalance = monoAcc.balance / 100; // Баланс банку в копійках -> переводимо в гривні
          const currencyStr = getCurrencyCodeStr(monoAcc.currencyCode);
          const finalName = `${accountName || 'Monobank'} (${monoAcc.type.toUpperCase()} ${currencyStr})`;

          const newApiAccount = new Account({
            userId,
            accountName: finalName,
            type: 'api_bank',
            balance: realBalance,
            currency: currencyStr,
            apiProvider: 'monobank',
            apiToken: apiToken, // Зберігаємо токен для майбутніх синхронізацій
            monobankAccountId: monoAcc.id // Унікальний ID картки від самого банку
          });

          const saved = await newApiAccount.save();
          createdAccounts.push(saved);
        }
      }

      return res.status(201).json({
        message: `Успішно! Додано нових карток: ${createdAccounts.length}`,
        accounts: createdAccounts
      });
    }

  } catch (error) {
    console.error("Помилка на бекенді при роботі з API:", error.message);
    res.status(500).json({ 
      message: 'Внутрішня помилка сервера при підключенні банку', 
      error: error.message 
    });
  }
};

// Отримання всіх рахунків користувача
export const getAccounts = async (迫, res) => {
  try {
    const { userId } = 迫.query;
    const accounts = await Account.find({ userId });
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні рахунків', error: error.message });
  }
};


export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params; // Отримуємо ID рахунку з URL
    const { userId, accountName, balance } = req.body;

    // Шукаємо рахунок за ID та перевіряємо, чи належить він цьому юзеру
    const updatedAccount = await Account.findOneAndUpdate(
      { _id: id, userId: userId },
      { accountName, balance: Number(balance) },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: 'Рахунок не знайдено або доступ заборонено' });
    }

    res.status(200).json(updatedAccount);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при оновленні рахунку', error: error.message });
  }
};

// Повне видалення рахунку
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Отримуємо userId з query-параметрів (?userId=...)

    const deletedAccount = await Account.findOneAndDelete({ _id: id, userId: userId });

    if (!deletedAccount) {
      return res.status(404).json({ message: 'Рахунок не знайдено або доступ заборонено' });
    }

    res.status(200).json({ message: 'Рахунок успішно видалено з бази даних' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при видаленні рахунку', error: error.message });
  }
};