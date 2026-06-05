import express from 'express';
import { createAccount, getAccounts, updateAccount, deleteAccount } from '../controllers/accountController.js';

const router = express.Router();
router.post('/', createAccount);
router.get('/', getAccounts);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;