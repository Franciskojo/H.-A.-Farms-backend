import { Router } from "express";
import { hasPermission, isAuthenticated } from "../middlewares/auth.js";
import { checkout, getUserOrderById, getUserOrders } from "../controllers/order.js";

const orderRouter = Router();

// POST /api/orders/checkout – Complete order from cart
orderRouter.post("/order/checkout", isAuthenticated, hasPermission("checkout"), checkout);

// GET /api/orders – Get all orders for authenticated user
orderRouter.get("/order/get", isAuthenticated, hasPermission("get"), getUserOrders);

// GET /api/orders/:orderId – Get a single order by ID
orderRouter.get("/order/get/:orderId", isAuthenticated, hasPermission("get_order_id"), getUserOrderById);



export default orderRouter;
