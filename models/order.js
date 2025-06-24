import { Schema, Types, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

// Order Item Schema
const orderItemSchema = new Schema({
  product: { type: Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtPurchase: { type: Number, required: true },
  nameAtPurchase: { type: String, required: true },
}, { _id: false });

// Address Schema
const addressSchema = new Schema({
  streetAddress: { type: String, required: true, trim: true },
  town: { type: String, required: true, trim: true },
  region: { type: String, required: true, trim: true },
  digitalAddress: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true }
}, { _id: false });

// Order Schema
const orderSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true },

  items: {
    type: [orderItemSchema],
    validate: v => Array.isArray(v) && v.length > 0
  },

  shippingAddress: { type: addressSchema, required: true },

  paymentMethod: {
    type: String,
    enum: ['credit_card', 'mobile_money', 'bank_transfer', 'cash_on_delivery'],
    required: true
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  orderStatus: {
    type: String,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },

  notes: { type: String, trim: true },

  shippingCost: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.plugin(toJSON);

export const OrderModel = model('Order', orderSchema);
