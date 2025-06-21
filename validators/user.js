import Joi from "joi";


export const registerUserValidator = Joi.object({
    fullName: Joi.string().trim().required(),
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
    fullName: Joi.string(),
    password: Joi.string(),
     profilePicture: Joi.string().uri().optional(),
     role: Joi.string().valid("user", "admin")
})