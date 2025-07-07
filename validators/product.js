import Joi from "joi";

// Product validation schema
export const productValidator = Joi.object({
  productName: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().min(0).default(0),
  productImage: Joi.string().trim().required(),
  category: Joi.string().valid('premium eggs', 'premium chicken', 'farm Inputs').required(),
  status: Joi.string().valid('draft', 'active', 'archived').default('draft'),
  trackInventory: Joi.boolean().default(false),
  isPhysicalProduct: Joi.boolean().default(true)
});

export const updateProductValidator = Joi.object({
  productName: Joi.string().trim(),
  productImage: Joi.string().trim().allow('', null),
  description: Joi.string().trim(),
  price: Joi.number().min(0),
  category: Joi.string().valid('premium eggs', 'premium chicken', 'farm Inputs'),
  status: Joi.string().valid('draft', 'active', 'archived'),
  quantity: Joi.number().min(0),
  trackInventory: Joi.boolean(),
  isPhysicalProduct: Joi.boolean()

});