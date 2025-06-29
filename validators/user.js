import Joi from "joi";


export const registerUserValidator = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().required().trim(),
    password: Joi.string().trim().required(),
    // confirmPassword: Joi.string().trim().required(),
     profilePicture: Joi.string().uri().optional(),
    role: Joi.string().valid("user", "admin")
})

export const loginUserValidator = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

export const updateProfileValidator = Joi.object({
    name: Joi.string(),
    password: Joi.string(),
    email: Joi.string().email(),
     profilePicture: Joi.string().uri().optional(),
     role: Joi.string().valid("user", "admin")
})