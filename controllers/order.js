import mongoose from "mongoose";
import { OrderModel } from "../models/order.js";
import { CartModel } from "../models/cart.js";
//  import { checkoutSchema } from "../validators/order.js";

export const checkout = async (req, res, next) => {
  const userId = req.auth?.id;

  // // ✅ 1. Validate input
  // const { error, value } = checkoutSchema.validate(req.body, { abortEarly: false });
  // if (error) {
  //   return res.status(400).json({
  //     message: "Validation failed",
  //     errors: error.details.map((detail) => detail.message)
  //   });
  // }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find active cart
    const cart = await CartModel.findOne({ userId: req.auth?.id, status: "Active" })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cart is empty or does not exist." });
    }

    // Transform cart items into order items
    const items = cart.items.map((item) => {
      const product = item.product;
      if (!product || typeof product.price !== "number") {
        throw new Error("Incomplete product data.");
      }

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        discount: product.discount || 0
      };
    });

    // Create and save the order
    const newOrder = new OrderModel({
      userId,
      cartId: cart.id,
      items,
      shippingAddress: value.shippingAddress,
      billingAddress: value.billingAddress,
      paymentMethod: value.paymentMethod,
      tax: value.tax,
      shippingCost: value.shippingCost,
      notes: value.notes || ""
    });

    const savedOrder = await newOrder.save({ session });

    // Mark the cart as checked out
    cart.status = "Checked Out";
    await cart.save({ session });

    await session.commitTransaction();
    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Checkout error:", error);
    res.status(500).json({ message: "Checkout failed. Please try again later." });
  } finally {
    session.endSession();
  }
};



export const createOrder = async (req, res, next) => {
  const userId = req.auth?.id;
  try {
    // Find the active cart for the client
    const cart = await CartModel.findOne({ user: userId, status: "Active" }).populate('items');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty or not found." });
    }
    // Calculate total amount
    const totalAmount = cart.items.reduce((total, item) => {
      if (!item.product || typeof item.product.price !== 'number') {
        console.warn(`Product data is incomplete for item: ${item}`);
        return total;
      }
      return total + item.product.price * item.quantity;
    }, 0);
    // Create a new order
    const order = new OrderModel({
      user: userId,
      cart_id: cart._id,
      items: cart.items,
      totalAmount,
      status: "pending",
      paymentMethod: "pay_on_delivery", //added by irene
    });
    // Save the order
    const savedOrder = await order.save();
    // Clear the cart
    cart.items = [];
    await cart.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    next(error);
  }
};

// Get all orders for authenticated user
export const getUserOrders = async (req, res, next) => {
  const userId = req.auth?.id;

  try {
    const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user." });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    next(error);
  }
};

// Get a specific order by ID for authenticated user
export const getUserOrderById = async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.auth?.id;

  try {
    const order = await OrderModel.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found or access denied." });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    next(error);
  }
};