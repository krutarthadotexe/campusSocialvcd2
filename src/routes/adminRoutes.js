import { Router } from 'express';
import { listUsers, updateUserRole } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validateRequest } from '../middleware/validate.js';
import { updateUserRoleSchema } from '../validators/adminValidators.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.get('/users', listUsers);
adminRouter.patch('/users/:userId/role', validateRequest(updateUserRoleSchema), updateUserRole);
