import { Router } from 'express';
import { currentUser, login, logout, refresh, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/authValidators.js';

export const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), register);
authRouter.post('/login', validateRequest(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', requireAuth, logout);
authRouter.get('/me', requireAuth, currentUser);
