import { Schema, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";

// Variant schema
const variantSchema = new Schema({
  variantName: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  sku: { type: String, trim: true },
  quantity: { type: Number, default: 0, min: 0 },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

// Image schema
const imageSchema = new Schema({
  url: { type: String, required: true },
  altText: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false }
}, { _id: true });

// Main product schema
const productSchema = new Schema({
  productName: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 0, min: 0 },
  category: { type: String, required: true, enum: ['premium eggs', 'premium chicken', 'farm Inputs']
  },
//   tags: { type: [String], default: [] },
  status: { type: String, enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  images: { type: [imageSchema], validate: {
      validator: arr => arr.length <= 5,
      message: 'Max 5 images allowed'
    }
  },
  variants: {
    type: [variantSchema],
    default: () => [{
      name: 'Default Variant',
      price: 0,
      sku: '',
      isDefault: true
    }]
  },
  trackInventory: { type: Boolean, default: false },
  isPhysicalProduct: { type: Boolean, default: true }

}, { timestamps: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });


// Plugin for converting MongoDB data to JSON
productSchema.plugin(toJSON);

// Export the model
export const ProductModel = model("Products", productSchema);
