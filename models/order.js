import { Schema, Types, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

// Order Item Schema
const orderItemSchema = new Schema({
  productId: { type: Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 }
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
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  cartId: { type: Types.ObjectId, ref: 'Cart' }, // ✅ Added cartId field

  items: {
    type: [orderItemSchema],
    validate: [array => array.length > 0, 'Order must contain at least one item']
  },

  shippingAddress: { type: addressSchema, required: true },
  billingAddress: { type: addressSchema, required: true },

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

  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
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

// Index for efficient user queries
orderSchema.index({ userId: 1, createdAt: -1 });

// Auto-calculate subtotal and total
orderSchema.pre('validate', function (next) {
  const subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price - item.discount) * item.quantity;
  }, 0);

  this.subtotal = Math.round(subtotal * 100) / 100;
  this.total = Math.round((subtotal + this.tax + this.shippingCost) * 100) / 100;
  next();
});

// Virtual: total item count
orderSchema.virtual('totalItems').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Apply clean JSON output plugin
orderSchema.plugin(toJSON);

// Export model
export const OrderModel = model('Order', orderSchema);
