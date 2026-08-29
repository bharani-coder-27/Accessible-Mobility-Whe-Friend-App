import { Router } from 'express';
import { register, login, me, updateMe } from '../controllers/authController.js';
import { protect } from '../middleWare/authMiddleWare.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/me', protect, updateMe);

export default router;
