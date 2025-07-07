import { Schema, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";


const productSchema = new Schema({
  productName: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 0, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['premium eggs', 'premium chicken', 'farm Inputs']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  productImage: { type: String, required: true },
  trackInventory: { type: Boolean, default: false },
  isPhysicalProduct: { type: Boolean, default: true }

}, { timestamps: true });

productSchema.index({ productName: 'text', description: 'text', tags: 'text' });
productSchema.plugin(toJSON);

export const ProductModel = model("Product", productSchema);
