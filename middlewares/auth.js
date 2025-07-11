import { expressjwt } from "express-jwt";
import { permissions } from "../utils/rbac.js";
import { UserModel } from "../models/user.js";

// 1. Authentication middleware
export const isAuthenticated = expressjwt({
  secret: process.env.JWT_PRIVATE_KEY,
  algorithms: ["HS256"],
  requestProperty: "auth" // attaches decoded token to req.auth
});

// 2. Role/Permission check middleware
export const hasPermission = (action) => {
  return async (req, res, next) => {
    try {
      // Fix: use userId from token
      const user = await UserModel.findById(req.auth?.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const permission = permissions.find(item => item.role === user.role);
      if (!permission) {
        return res.status(403).json({ message: 'Role has no permissions configured' });
      }

      if (!permission.actions.includes(action)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Admin-only route guard
export const adminOnly = (req, res, next) => {
  if (req.auth?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};
