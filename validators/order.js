// import Joi from "joi";

// const addressSchema = Joi.object({
//   street: Joi.string().required(),
//   town: Joi.string().required(),
//   region: Joi.string().required(),
//   digitalAddress: Joi.string().required(),
//   phone: Joi.string().required(),
//   country: Joi.string().required()
// });

// export const checkoutSchema = Joi.object({
//   shippingAddress: addressSchema.required(),
//   billingAddress: addressSchema.required(),
//   paymentMethod: Joi.string().valid("credit_card", "mobile_money", "bank_transfer", "cash_on_delivery").required(),
//   shippingCost: Joi.number().min(0).required(),
//   tax: Joi.number().min(0).required(),
//   subtotal: Joi.number().min(0).required(),
//   total: Joi.number().min(0).required(),
//   notes: Joi.string().allow("").optional()
// });
