// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import userRoutes from './routes/userRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import currencyRoutes from './routes/currencyRoutes.js';
import { updateCurrencyRates } from './currencyService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Дозволяє серверу читати JSON у тілі запитів (req.body)

// Пряме підключення до MongoDB Atlas
const connectDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000, // Чекати 10 секунд
    directConnection: false,         // Важливо: false для реплікасетів
    family: 4                        // Примусово IPv4
    });
    console.log('=== База даних MongoDB Atlas успішно підключена ===');

    updateCurrencyRates();
  } catch (error) {
    console.error('=== Помилка підключення до MongoDB ===');
    console.error(`Деталі: ${error.message}`);
    process.exit(1); // Зупиняємо сервер, якщо база не підключилася
  }
};

connectDatabase();// Спочатку підключаємо базу даних, а потім запускаємо сервер

// Головна сторінка API для перевірки працездатності (Health Check)
app.get('/', (req, res) => {
  res.send('Фінансовий API сервер працює і бачить базу даних!');
});

app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/currencies', currencyRoutes);

app.listen(PORT, () => {
  console.log(`Сервер розгорнуто за адресою http://localhost:${PORT}`);
});