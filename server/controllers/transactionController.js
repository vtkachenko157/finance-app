import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';

// Додавання нової транзакції (вручну)
export const createTransaction = async (req, res) => {
  try {
    const { userId, accountId, amount, type, categoryName, description, date } = req.body;

    // Створюємо нову транзакцію. _id згенерується автоматично
    const newTransaction = new Transaction({
      userId,
      accountId,
      amount,
      type,
      categoryName,
      description,
      date
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Отримання історії операцій користувача з фільтрами
export const getTransactions = async (迫, res) => {
  try {
    const { userId } = 迫.query;
    
    // Знаходимо останні транзакції конкретного юзера (сортуємо від нових до старих)
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(50);

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при отриманні транзакцій', error: error.message });
  }
};


export const getExpenseStatistics = async (迫, res) => {
  try {
    const { userId } = 迫.query;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Агрегаційний запит до MongoDB для групування даних
    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: userId,
          type: 'expense',
          date: { $gte: startOfMonth } // Тільки за поточний місяць
        }
      },
      {
        $group: {
          _id: '$categoryName', // Групуємо по назві категорії
          totalAmount: { $sum: '$amount' } // Сумуємо витрати
        }
      },
      { $sort: { totalAmount: -1 } } // Спочатку найбільші витрати
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Помилка збору статистики', error: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Отримуємо userId з URL (?userId=...)

    // Шукаємо транзакцію перед видаленням, щоб знати її суму та рахунок
    const transaction = await Transaction.findOne({ _id: id, userId: userId });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Транзакцію не знайдено' });
    }

    // Вираховуємо, як змінити баланс рахунку назад (реверс)
    // Якщо видаляємо розхід (expense) -> гроші повертаємо (+amount)
    // Якщо видаляємо дохід (income) -> гроші списуємо (-amount)
    const balanceDiff = transaction.type === 'expense' ? transaction.amount : -transaction.amount;

    // Оновлюємо баланс рахунку в базі даних
    await Account.findOneAndUpdate(
      { _id: transaction.accountId, userId: userId },
      { $inc: { balance: balanceDiff } } // $inc автоматично додає або віднімає значення
    );

    await Transaction.findByIdAndDelete(id);

    res.status(200).json({ message: 'Транзакцію успішно видалено, баланс рахунку скориговано' });
  } catch (error) {
    res.status(500).json({ message: 'Помилка сервера при видаленні транзакції', error: error.message });
  }
};