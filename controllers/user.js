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