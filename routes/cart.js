import { Router } from "express";
import { hasPermission, isAuthenticated } from "../middlewares/auth.js";
import { addToCart, checkoutCart, clearCart, getCart, removeFromCart, updateCartItem } from "../controllers/cart.js";





const cartRouter = Router();


cartRouter.post("/add", isAuthenticated, hasPermission("add_to_cart"), addToCart);

cartRouter.get("/get", isAuthenticated, hasPermission("get_cart"), getCart);

// PUT /api/cart/items/:itemId - Update cart item quantity
cartRouter.put("/items/:itemId", isAuthenticated, hasPermission("update_cart_item"), updateCartItem);

cartRouter.delete("/items/:itemId", isAuthenticated, hasPermission("remove_cart"), removeFromCart);

cartRouter.delete("/clear", isAuthenticated, hasPermission("clear_cart"), clearCart);

cartRouter.post("/checkout", isAuthenticated, hasPermission("checkout"), checkoutCart);




export default cartRouter;