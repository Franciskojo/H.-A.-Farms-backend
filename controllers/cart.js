import { CartModel } from "../models/cart.js";
import {ProductModel} from "../models/product.js"; // Adjust import path as needed
import mongoose from 'mongoose';


// Add a product to the cart or update its quantity if it already exists in the cart.

export const addToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;
  const userId = req.auth?.id;

  // Validate presence and format of productId
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid or missing product ID." });
  }

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "Invalid quantity." });
  }

  try {
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const price = product.price;

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
    return res.status(200).json({ message: "Added to cart!", cart: updatedCart });
  } catch (error) {
    console.error("🔥 Error adding to cart:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
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


