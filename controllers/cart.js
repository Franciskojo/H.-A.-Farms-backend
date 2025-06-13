import { CartModel } from "../models/cart.js";


// Add a product to the cart or update its quantity if it already exists in the cart.
export const addToCart = async (req, res, next) => {
  const { productId, price, quantity, userId } = req.body;

  if (!productId || !quantity || !price || quantity < 1) {
    return res
      .status(400)
      .json({ message: "Invalid product ID, price, or quantity." });
  }
  
  try {
    let cart = await CartModel.findOne({ user: userId });

    if (!cart) {
      cart = new CartModel({ user: userId, items: [] });
    }
  
    const itemIndex = cart.items.findIndex(item =>
      item?.product?.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, price, quantity });
    }
  
    const updatedCart = await cart.save();

    res.status(200).json({ message: "Added to Cart!", cart: updatedCart });

  } catch (error) {
    console.error("Error adding to cart:", error);
    next(error);
  }
};



// Get all carts for a specific user
export const getUsertCart = async (req, res, next) => {
  const userId = req.auth?.id;
  if (!userId) {
    return res.status(401).json({ message:'Not authenticated!' });
  }
  try {
    const cart = await CartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message:'Cart not found.' });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error fetching client cart:", error);
    next(error);
  }
};


// Remove a product from the cart based on its product ID
export const removeFromCart = async (req, res, next) => {
  const { productId } = req.body;
  const userId = req?.auth?.id; // <- here, we use `req.auth` because that's how express-jwt attaches it by default

  if (!productId) {
    return res.status(400).json({ message: "Invalid product ID." });
  }
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  
  try {
    const cart = await CartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }
  
    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    const updatedCart = await cart.save();

    res.status(200).json({ message: "Item removed from cart.", cart: updatedCart });

  } catch (error) {
    console.error("Error removing from cart:", error);
    next(error);
  }
};



// Clear all items from the cart
export const clearCart = async (req, res, next) => {
  const userId = req?.auth?.id;

  try {
    const cart = await CartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found." });
    }

    cart.items = [];
    const updatedCart = await cart.save();
    res.status(200).json({ message: "Cart cleared.", cart: updatedCart });

  } catch (error) {
    console.error("Error clearing cart:", error);
    next(error);
  }
}


