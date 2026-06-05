import express from 'express';
import { createTransaction, getTransactions, deleteTransaction } from '../controllers/transactionController.js';

const router = express.Router();
router.post('/', createTransaction);        // POST /api/transactions — додати операцію
router.get('/', getTransactions);          // GET /api/transactions — отримати список
router.delete('/:id', deleteTransaction);  // DELETE {id} /api/transactions - видалення транзакції

export default router;