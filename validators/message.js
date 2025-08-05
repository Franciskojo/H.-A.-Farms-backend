import Joi from "joi";


export const messageValidator = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().required().trim(),
    message: Joi.string().trim().required(),
})