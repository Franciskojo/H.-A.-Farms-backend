import Joi from "joi";

const addressSchema = Joi.object({
  street: Joi.string().trim().required(),
  town: Joi.string().trim().required(),
  region: Joi.string().trim().required(),
  digitalAddress: Joi.string().trim().required(),
  phone: Joi.string().trim().required(),
  country: Joi.string().trim().required()
});

export const checkoutSchema = Joi.object({
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.required(),

  paymentMethod: Joi.string()
    .valid("mobile_money", "cash_on_delivery")
    .required(),

  tax: Joi.number().min(0).default(0),
  shippingCost: Joi.number().min(0).default(0),
  notes: Joi.string().allow('').optional()
});
