import { Schema, Types, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

// Cart item schema
const cartItemSchema = new Schema({
  product: { type: Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  price: { type: Number, required: true }, // Price at time of adding
});

// Cart schema
const cartSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ✅ Add a reusable instance method
cartSchema.methods.addItem = async function (productId, price, quantity) {
  // Find if the item already exists
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    // If exists, just increment quantity
    existingItem.quantity += quantity;
  } else {
    // Otherwise, push a new item
    this.items.push({ product: productId, price, quantity });
  }

  // Update timestamp
  this.updatedAt = Date.now();

  // Save the cart
  return this.save();
};

// ✅ (Optional) Virtual for subtotal calculation
cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.plugin(toJSON);

export const CartModel = model("Cart", cartSchema);
