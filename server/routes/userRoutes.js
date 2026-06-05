import express from 'express';
import { syncUserProfile, updatePreferences, deleteUserAccount } from '../controllers/userController.js';

const router = express.Router();
router.post('/sync', syncUserProfile);          // POST /api/users/sync
router.put('/preferences', updatePreferences);   // PUT /api/users/preferences
//router.post('/categories', addUserCategory);    // POST /api/users/categories
router.delete('/:firebaseId', deleteUserAccount);

export default router;