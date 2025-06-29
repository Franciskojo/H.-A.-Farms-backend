import { Router } from "express";
import { hasPermission, isAuthenticated } from "../middlewares/auth.js";
import { addToCart, checkoutCart, clearCart, getCart, removeFromCart, updateCartItem, removeFromCartByProductId } from "../controllers/cart.js";





const cartRouter = Router();


cartRouter.post("/cart/add", isAuthenticated, hasPermission("add_to_cart"), addToCart);

cartRouter.get("/cart/get", isAuthenticated, hasPermission("get_cart"), getCart);

// PUT /api/cart/items/:itemId - Update cart item quantity
cartRouter.put("/cart/items/:itemId", isAuthenticated, hasPermission("update_cart_item"), updateCartItem);

cartRouter.delete("/cart/items/:itemId", isAuthenticated, hasPermission("remove_cart"), removeFromCart);

cartRouter.delete("/cart/clear", isAuthenticated, hasPermission("clear_cart"), clearCart);

cartRouter.post("/cart/checkout", isAuthenticated, hasPermission("checkout"), checkoutCart);

cartRouter.post("/cart/remove", isAuthenticated, hasPermission("remove_cart"), removeFromCartByProductId);




export default cartRouter;