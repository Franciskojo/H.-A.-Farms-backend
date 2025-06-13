import { Schema, Types, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

// Schema for individual cart items
const cartItemSchema = new Schema({
    product: { type: Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true },
});

// Schema for the overall cart
const cartSchema = new Schema({
    user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true
    });

// Virtuals for calculated totals
cartSchema.virtual('subtotal').get(function () {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// cartSchema.virtual('tax').get(function () {
//   return this.subtotal * 0.1; // 10% tax rate
// });

// cartSchema.virtual('shipping').get(function () {
//   return 5.99; // Flat shipping cost
// });

// cartSchema.virtual('total').get(function () {
//   return this.subtotal + this.tax + this.shipping;
// });

// Ensure virtuals are included in JSON output
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// Pre-save hook to update `updatedAt`
cartSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Instance method to add or update a cart item
cartSchema.methods.addItem = function (productId, price, quantity = 1) {
    const existingItem = this.items.find(item => item.product.toString() === productId.toString());

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        this.items.push({ product: productId, price, quantity });
    }

    this.updatedAt = Date.now();
    return this.save();
};

// Index for efficient product item lookup in cart
cartSchema.index({ 'items.product': 1 });



cartSchema.plugin(toJSON);


export const CartModel = model("Cart", cartSchema);
