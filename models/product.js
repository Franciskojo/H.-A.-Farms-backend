import { Schema, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

const variantSchema = new Schema({
  variantName: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  sku: { type: String, trim: true },
  quantity: { type: Number, default: 0, min: 0 },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

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
  tags: { type: [String], default: [] },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  productImage: { type: String, required: true },

  variants: {
    type: [variantSchema],
    default: () => [{
      variantName: 'Default Variant',
      price: 0,
      sku: '',
      quantity: 0,
      isDefault: true
    }]
  },

  trackInventory: { type: Boolean, default: false },
  isPhysicalProduct: { type: Boolean, default: true }

}, { timestamps: true });

productSchema.index({ productName: 'text', description: 'text', tags: 'text' });
productSchema.plugin(toJSON);

export const ProductModel = model("Products", productSchema);
