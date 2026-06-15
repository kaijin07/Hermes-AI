import express from 'express';
import { registerUser, loginUser, logoutUser, getMe, googleLogin } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema, googleAuthSchema } from '../validators/authValidator.js';

const router = express.Router();

router.post('/signup', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/google', validate(googleAuthSchema), googleLogin);
router.get('/logout', logoutUser);
router.get('/me', protect, getMe);

export default router;
