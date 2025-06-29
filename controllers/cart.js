import { CartModel } from "../models/cart.js";
import { ProductModel } from "../models/product.js";
import { OrderModel } from "../models/order.js";
import mongoose from "mongoose";

// Get cart
export const getCart = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    const cart = await CartModel.findOne({ user: userId })
      .populate('items.product', 'productName productImage price');

    if (!cart) {
      return res.status(200).json({
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0
      });
    }

    res.status(200).json({
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load cart' });
  }
};

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    // ✅ Validate productId format before using it in a DB query
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await CartModel.findOne({ user: userId });
    if (!cart) {
      cart = new CartModel({ user: userId, items: [] });
    }

    await cart.addItem(productId, product.price, quantity);
    await cart.populate('items.product', 'productName productImage price');

    res.status(201).json({
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!quantity || quantity < 1) return res.status(400).json({ message: 'Invalid quantity' });
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const cart = await CartModel.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.quantity = quantity;
    await cart.save();
    await cart.populate('items.product', 'productName productImage price');

    res.json(formatCartResponse(cart));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { itemId } = req.params;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    const cart = await CartModel.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();
    await cart.populate('items.product', 'productName productImage price');

    res.json(formatCartResponse(cart));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const removeFromCartByProductId = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { productId } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const cart = await CartModel.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();
    await cart.populate('items.product', 'productName productImage price');

    res.json(formatCartResponse(cart));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    await CartModel.findOneAndUpdate({ user: userId }, { items: [] });
    res.json({ items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Checkout
export const checkoutCart = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { shippingAddress, paymentMethod } = req.body;

    if (!userId || !shippingAddress?.streetAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const cart = await CartModel.findOne({ user: userId })
      .populate('items.product', 'productName productImage price');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderItems = cart.items.map(item => {
      if (!item.product) throw new Error('Product missing');
      return {
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        nameAtPurchase: item.product.productName
      };
    });

    const { subtotal, tax, shipping, total } = cart;

    const order = new OrderModel({
      user: userId,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'processing'
    });

    await order.save();
    await CartModel.findOneAndUpdate({ user: userId }, { items: [] });

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        total: order.total,
        status: order.orderStatus,
        items: order.items,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: err.message || 'Something went wrong during checkout' });
  }
};
