import { OrderModel } from "../models/order.js";
import mongoose from "mongoose";

// ------------------------------
// Get all orders for the current user
// ------------------------------
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OrderModel.countDocuments({ user: userId }),
    ]);

    res.json({
      orders,
      page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    });
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
};


// ------------------------------
// Get a specific order for the current user
// ------------------------------

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check for authentication
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      user: req.auth.userId
    })
      .populate("items.product", "productName price productImage sku")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);

  } catch (err) {
    console.error("🔥 Error in getOrderDetails:", err.message);
    console.error(err.stack);
    return res.status(500).json({ message: "Failed to fetch order details", error: err.message });
  }
};


// ------------------------------
// Admin: Get all orders in the system
// ------------------------------
export const getAllOrders = async (req, res, next) => {
  try {
    if (!req.auth?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find()
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OrderModel.countDocuments()
    ]);

    res.json({
      orders,
      page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total
    });
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ message: "Failed to fetch all orders" });
    next(err);
  }
};

// ------------------------------
// Admin: Update order status
// ------------------------------
export const updateOrderStatus = async (req, res, next) => {
  try {
    if (!req.auth?.isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const { status } = req.body;
    const { orderId } = req.params;

    const validStatuses = ["processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Failed to update order status" });
    next(err);
  }
};
