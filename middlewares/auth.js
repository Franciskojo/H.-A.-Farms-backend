import { expressjwt } from "express-jwt";
import { permissions } from "../utils/rbac.js";
import { UserModel } from "../models/user.js";


export const isAuthenticated = expressjwt({
    secret: process.env.JWT_PRIVATE_KEY,
    algorithms: ["HS256"],
     requestProperty: "auth"
});

export const hasPermission = (action) => {
    return async (req, res, next) => {
        try {
            // find the user first
            const user = await UserModel.findById(req.auth?.id);
            if (!user) {
                return res.status(404).json({ message:'User not found' });
            }
            // find permissions for the role
            const permission = permissions.find(item => item.role === user.role);
            if (!permission) {
                return res.status(403).json({ message:'Role has no permissions configured' });
            }
            // check if action is allowed
            if (!permission.actions.includes(action)) {
                return res.status(403).json({ message:'Forbidden' });
            }
            // everything is fine
            next();

        } catch (error) {
            next(error);
        }
    };
};

