import express from 'express';
import { getRates } from '../controllers/currencyController.js';

const router = express.Router();
router.get('/', getRates);
//router.post('/update', forceUpdateRates);

export default router;