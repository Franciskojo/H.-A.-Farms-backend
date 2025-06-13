import { Router } from "express";
import { addToCart, clearCart, getUsertCart, removeFromCart } from "../controllers/cart.js";
import { hasPermission, isAuthenticated } from "../middlewares/auth.js";





const cartRouter = Router();


cartRouter.post("/add", isAuthenticated, hasPermission("add_to_cart"), addToCart);

cartRouter.get("/get", isAuthenticated, hasPermission("get_cart"), getUsertCart);

cartRouter.post("/remove", isAuthenticated, hasPermission("remove_cart"), removeFromCart);

cartRouter.post("/clear", isAuthenticated, hasPermission("clear_cart"), clearCart);



export default cartRouter;