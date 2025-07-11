import { Schema, Types, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

// Cart item schema
const cartItemSchema = new Schema({
  product: { type: Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true },
});

// Cart schema
const cartSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
// cartSchema.virtual('subtotal').get(function () {
//   return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
// });
// cartSchema.virtual('tax').get(function () {
//   return this.subtotal * 0.0;
// });
// cartSchema.virtual('shipping').get(function () {
//   return 0;
// });
// cartSchema.virtual('total').get(function () {
//   return this.subtotal + this.tax + this.shipping;
// });

// Pre-save updatedAt
// cartSchema.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// Method to add item
// cartSchema.methods.addItem = function (productId, price, quantity = 1) {
//   const existingItem = this.items.find(item => item.product.toString() === productId.toString());
//   if (existingItem) {
//     existingItem.quantity += quantity;
//   } else {
//     this.items.push({ product: productId, quantity, price });
//   }
//   this.updatedAt = Date.now();
//   return this.save();
// };

// Index for lookup
cartSchema.index({ 'items.product': 1 });

cartSchema.plugin(toJSON);

export const CartModel = model("Cart", cartSchema);
