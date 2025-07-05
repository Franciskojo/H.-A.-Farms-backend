import { Router } from "express";
import { hasPermission, isAuthenticated, adminOnly } from "../middlewares/auth.js";
import { getUserOrders, getOrderDetails, getAllOrders, updateOrderStatus } from "../controllers/order.js";


const orderRouter = Router();

// 👤 User order routes
orderRouter.get("/order/get", isAuthenticated, hasPermission("get_user_orders"), getUserOrders);

orderRouter.get("/order/:orderId", isAuthenticated, hasPermission("get_order_details"), getOrderDetails);

// 🛡️ Admin-only order routes
orderRouter.get('/admin/all', isAuthenticated, adminOnly, hasPermission("get_all_orders"), getAllOrders);

orderRouter.put('/admin/orders/:orderId/status', isAuthenticated, adminOnly, hasPermission("update_order_status"),updateOrderStatus);

export default orderRouter;