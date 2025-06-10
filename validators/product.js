import Joi from "joi";

// Variant validation schema
export const variantValidator = Joi.object({
  variantName: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  sku: Joi.string().trim(),
  quantity: Joi.number().min(0).default(0),
  isDefault: Joi.boolean().default(false)
});

// Image validation schema
export const imageValidator = Joi.object({
  url: Joi.string().uri().required(),
  altText: Joi.string().allow('').default(''),
  isPrimary: Joi.boolean().default(false)
});

// Product validation schema
export const productValidator = Joi.object({
  productName: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().min(0).default(0),

  category: Joi.string().valid('premium eggs', 'premium chicken', 'farm Inputs').required(),
//   tags: Joi.array().items(Joi.string()).default([]),

  status: Joi.string().valid('draft', 'active', 'archived').default('draft'),

  images: Joi.array().items(imageValidator).max(5).default([]),

  variants: Joi.array().items(variantValidator).default(() => [{
    name: 'Default Variant',
    price: 0,
    sku: '',
    isDefault: true
  }]),

  trackInventory: Joi.boolean().default(false),
  isPhysicalProduct: Joi.boolean().default(true)
});

export const updateProductValidator = Joi.object({
    productName: Joi.string(),
    images: Joi.array().items(imageValidator).max(5).default([]),
    description: Joi.string(),
    price: Joi.number(),
    category: Joi.string(),
    status: Joi.string(),
    variants: Joi.array()

});