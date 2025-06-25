import { CartModel } from "../models/cart.js";
import { ProductModel } from "../models/product.js";
import { OrderModel } from "../models/order.js";

// Get cart
export const getCart = async (req, res) => {
  try {
    const cart = await CartModel.findOne({ user: req.auth?.id })
      .populate('items.product', 'name price images');
    if (!cart) {
      return res.status(200).json({ items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 });
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

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await CartModel.findOne({ user: req.auth?.id });
    if (!cart) {
      cart = new CartModel({ user: req.auth?.id, items: [] });
    }

    // ✅ This already saves the document
    await cart.addItem(productId, product.price, quantity);

    // ✅ You can now populate safely
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

// Update quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const cart = await CartModel.findOne({ user: req.auth?.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.quantity = quantity;
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

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const cart = await CartModel.findOne({ user: req.auth?.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
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

export const removeFromCartByProductId = async (req, res) => {
  const { productId } = req.body;
  try {
    const cart = await CartModel.findOne({ user: req.auth?.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
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
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Checkout
export const checkoutCart = async (req, res) => {
  try {
    const userId = req.auth?.id;
    const { shippingAddress, paymentMethod } = req.body;

    if (!userId || !shippingAddress?.streetAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const cart = await CartModel.findOne({ user: userId })
      .populate('items.product', 'name price');

    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderItems = cart.items.map(item => {
      if (!item.product) throw new Error('Product missing');
      return {
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: item.price,
        nameAtPurchase: item.product.name,
        
      };
    });

    const subtotal = cart.subtotal;
    const tax = cart.tax;
    const shipping = cart.shipping;
    const total = cart.total;

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
