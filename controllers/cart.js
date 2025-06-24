import { CartModel } from "../models/cart.js";
import {ProductModel} from "../models/product.js";
import { OrderModel } from "../models/order.js";


// Get user's cart
export const getCart = async (req, res) => {
  try {
    const cart = await CartModel.findOne({ user: req.auth?.id })
      .populate('items.product', 'name price images')
      .exec();

    if (!cart) {
      return res.status(200).json({
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 5.99,
        total: 5.99
      });
    }

    res.json({
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

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Validate input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    // Get product details
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find user's cart or create new one
    let cart = await CartModel.findOne({ user: req.auth?.id });

    if (!cart) {
      cart = new CartModel({
        user: req.user.id,
        items: []
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    
    // Populate product details for response
    await cart.populate('items.product', 'name price images');

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

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const cart = await CartModel.findOne({ user: req.auth?.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    await cart.populate('items.product', 'name price images');

    res.json({
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

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await CartModel.findOne({ user: req.auth?.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    await cart.save();
    
    await cart.populate('items.product', 'name price images');

    res.json({
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

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await CartModel.findOneAndUpdate(
      { user: req.auth?.id },
      { items: [] },
      { new: true }
    ).populate('items.product', 'name price images');

    res.json({
      items: cart ? cart.items : [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const checkoutCart = async (req, res) => {
  try {
    const userId = req.auth?.id;
    const { shippingAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!userId || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        message: 'User, shipping address, and payment method are required'
      });
    }

    // Validate streetAddress exists (matches schema)
    if (!shippingAddress.streetAddress) {
      return res.status(400).json({
        message: 'Shipping address must include streetAddress'
      });
    }

    // Get user's cart with product details
    const cart = await CartModel.findOne({ user: userId })
      .populate('items.product', 'name price discount'); // Include discount

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Construct order items (with null checks)
    const orderItems = cart.items.map(item => {
      if (!item.product || !item.product.name) {
        throw new Error('A product in your cart is missing or was deleted.');
      }

      return {
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        nameAtPurchase: item.product.name,
        discount: item.product.discount || 0
      };
    });

    // Defensive calculations
    const subtotal = cart.subtotal ?? cart.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const tax = cart.tax ?? 0;
    const shipping = cart.shipping ?? 5.99;
    const total = subtotal + tax + shipping;

    // Create and save order
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

    // Clear user's cart
    await CartModel.findOneAndUpdate({ user: userId }, { items: [] });

    // Return response
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
