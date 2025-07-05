import { registerUserValidator, loginUserValidator, updateProfileValidator } from "../validators/user.js";
import { UserModel } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { mailTransport } from "../utils/mail.js";


// Register User
export const registerUser = async (req, res, next) => {
  try {
    // Validate user input
    const { error, value } = registerUserValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: value.email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(value.password, 10);
    const profilePictureUrl = req.file?.path;

    // Save user to database
    const newUser = await UserModel.create({
      name: value.name,
      email: value.email,
      password: hashedPassword,
      role: value.role || "user",
      profilePicture: profilePictureUrl,
    });

    // Generate JWT token
    if (!process.env.JWT_PRIVATE_KEY) throw new Error("JWT_PRIVATE_KEY is not set.");
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: "7d" }
    );

    // Send welcome email
    await mailTransport.sendMail({
      to: value.email,
      subject: "Welcome to H. A. Farms!",
      text: `Hello ${value.name},\n\nThank you for signing up! We're excited to have you on board.\n\nBest regards,\nH. A. Farms`
    });

    // Send response
    res.status(201).json({
      message: "User registered!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profilePicture: newUser.profilePicture
      }
    });

  } catch (error) {
    next(error);
  }
};

// Login User
export const loginUser = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = loginUserValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    // Find user
    const user = await UserModel.findOne({ email: value.email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist!" });
    }

    // Compare password
    const correctPassword = await bcrypt.compare(value.password, user.password);
    if (!correctPassword) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Generate token
    if (!process.env.JWT_PRIVATE_KEY) throw new Error("JWT_PRIVATE_KEY is not set.");
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_PRIVATE_KEY,
      { expiresIn: "24h" }
    );

    // Respond with token and user data
    res.status(200).json({
      message: "User logged in!",
      accessToken: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get Profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await UserModel
      .findById(req.auth.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);

  } catch (error) {
    next(error);
  }
};

// Update Profile
export const updateProfile = async (req, res, next) => {
  try {
    const updateData = {
      ...req.body,
      profilePicture: req.file?.path
    };

    // Validate input
    const { error, value } = updateProfileValidator.validate(updateData);
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.auth.userId,
      value,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Get all users (with pagination & optional role filter)
// @route   GET /admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = role ? { role } : {};

    const users = await UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password'); // never return password hash

    const total = await UserModel.countDocuments(filter);

    res.json({
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// @desc    Delete a user
// @route   DELETE /admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
};


// @desc    Update user role
// @route   PATCH /admin/users/:id/role
// export const updateUserRole = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { role } = req.body;

//     if (!['admin', 'customer'].includes(role)) {
//       return res.status(400).json({ message: 'Invalid role specified' });
//     }

//     const user = await UserModel.findByIdAndUpdate(id, { role }, { new: true });

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json({ message: 'Role updated', user });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to update role', error: err.message });
//   }
// };

