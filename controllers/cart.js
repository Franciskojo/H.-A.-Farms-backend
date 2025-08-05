import { CartModel } from "../models/cart.js";
import { ProductModel } from "../models/product.js";
import { OrderModel } from "../models/order.js";
import { mailTransport } from "../utils/mail.js";
import mongoose from "mongoose";
import { UserModel } from "../models/user.js";

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

// ✅ Define helper function
function formatCartResponse(cart) {
  return {
    items: cart.items,
    subtotal: cart.subtotal,
    tax: cart.tax,
    shipping: cart.shipping,
    total: cart.total
  };
}


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

    // Fetch user info
    const user = await UserModel.findById(userId).select('name email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1️⃣ Fetch cart
    const cart = await CartModel.findOne({ user: userId })
      .populate('items.product', 'productName productImage price');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2️⃣ Build order items
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

    // 3️⃣ Create order
    const order = await OrderModel.create({
      user: userId,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'processing'
    });

    // 4️⃣ Clear cart
    await CartModel.findOneAndUpdate({ user: userId }, { items: [] });

    /* ------------------------------------------------------------------
       5️⃣ EMAIL NOTIFICATION TO SELLER
    ------------------------------------------------------------------ */
 const itemsHtml = order.items.map(i => `
  <li style="margin-bottom:10px;">
    <strong>${i.nameAtPurchase}</strong><br/>
    Qty: ${i.quantity} × GH₵${i.priceAtPurchase.toFixed(2)}<br/>
    Subtotal: GH₵${(i.quantity * i.priceAtPurchase).toFixed(2)}
  </li>
`).join('');

await mailTransport.sendMail({
  to: process.env.EMAIL_USER,
  subject: 'New Order – H.A. Farms',
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #f8f1e5; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <h2 style="color: #4a8f29;">🛒 New Order Received – H.A. Farms</h2>

        <h3 style="color: #4a8f29;">Customer Info</h3>
        <p>Customer: <strong>${user.name}</strong> (ID: ${user._id})</p>

        <h3 style="color: #4a8f29;">Shipping Address</h3>
        <p>
          ${shippingAddress.streetAddress}, ${shippingAddress.town}, ${shippingAddress.region}<br/>
          Digital Address: ${shippingAddress.digitalAddress || '-'}<br/>
          Country: ${shippingAddress.country || '-'}<br/>
          Phone: ${shippingAddress.phone || '-'}
        </p>

        <h3 style="color: #4a8f29;">Order Items</h3>
        <ul style="list-style: none; padding: 0;">${itemsHtml}</ul>

        <h3 style="color: #4a8f29;">Payment</h3>
        <p>Method: ${paymentMethod.replace(/_/g, ' ')}</p>

        <h3 style="color: #4a8f29;">Totals</h3>
        <p>
          Subtotal: GH₵${subtotal.toFixed(2)}<br/>
          Shipping: GH₵${shipping.toFixed(2)}<br/>
          Tax: GH₵${tax.toFixed(2)}<br/>
          <strong style="font-size: 16px;">Total: GH₵${total.toFixed(2)}</strong>
        </p>

        <div style="margin-top: 30px;">
          <a href="login.html" style="
            display: inline-block;
            background-color: #4a8f29;
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
          ">Login to Admin Dashboard</a>
        </div>

        <p style="margin-top: 20px; color: #888;">You are receiving this email because a customer placed a new order.</p>
      </div>
    </div>
  `
});


    /* ------------------------------------------------------------------
       6️⃣  OPTIONAL CUSTOMER CONFIRMATION
    ------------------------------------------------------------------ */
    if (process.env.CUSTOMER_CONFIRMATION === 'true' && req.user?.email) {
      await mailTransport.sendMail({
        to: req.user.email,
        subject: 'Your H.A. Farms Order Confirmation',
        html: `
          <h2>Thank you for your order!</h2>
          <p>Order ID: ${order._id}</p>
          <p>Total: GH₵${total.toFixed(2)}</p>
          <p>We'll notify you when your items are on the way.</p>
        `
      });
    }

    // 7️⃣ Respond to frontend
    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        total: order.total,
        status: order.status,
        items: order.items,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: err.message || 'Something went wrong during checkout' });
  }
};
