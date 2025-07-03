import { Router } from 'express';
import { hasPermission, isAuthenticated, adminOnly } from '../middlewares/auth.js';
import { getAdminSummary } from '../controllers/admin.js';


const summaryRouter = Router();

// GET /admin/summary
summaryRouter.get('/admin/summary', isAuthenticated, adminOnly, hasPermission("get_summary"), getAdminSummary);



export default summaryRouter;
