import { Router } from "express";
import { adminOnly, hasPermission, isAuthenticated } from "../middlewares/auth.js";
import { upload } from "../middlewares/cloudinary.js";
import { deleteUser, getAllUsers, getProfile, loginUser, registerUser, updateProfile } from "../controllers/user.js";


// Create a router
const userRouter = Router();

// Define routes
userRouter.post("/users/register", upload.single("profilePicture"), registerUser);

userRouter.post("/users/login", loginUser);

userRouter.get("/users/me", isAuthenticated, hasPermission("get_profile"), getProfile);

userRouter.patch("/users/:id", isAuthenticated, hasPermission("update_profile"), upload.single("profilePicture"), updateProfile);


// Protected routes — admin only
userRouter.get("/users/all", isAuthenticated, hasPermission("get_all_users"), adminOnly, getAllUsers);
// userRouter.patch("/users/:id/role", isAuthenticated, hasPermission(""),isAdmin, updateUserRole);
userRouter.delete('/users/:id', isAuthenticated, hasPermission("delete_user"), adminOnly, deleteUser);


// export router
export default userRouter;
