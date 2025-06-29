import { Router } from "express";
import { hasPermission, isAuthenticated } from "../middlewares/auth.js";
import { upload } from "../middlewares/cloudinary.js";
import { getProfile, loginUser, registerUser, updateProfile } from "../controllers/user.js";


// Create a router
const userRouter = Router();

// Define routes
userRouter.post("/users/register", upload.single("profilePicture"), registerUser);

userRouter.post("/users/login", loginUser);

userRouter.get("/users/me", isAuthenticated, hasPermission("get_profile"), getProfile);

userRouter.patch("/users/:id", isAuthenticated, hasPermission("update_profile"), upload.single("profilePicture"), updateProfile);


// export router
export default userRouter;
