import { registerUserValidator, loginUserValidator, updateProfileValidator } from "../validators/user.js";
import { UserModel } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { mailTransport } from "../utils/mail.js";


export const registerUser = async (req, res, next) => {
  try {
    // Validate user input
    const { error, value } = registerUserValidator.validate(req.body);
    if (error) {
      return res.status(422).json(error);
    }
    // Check if user does not exist
    const user = await UserModel.findOne({ email: value.email });
    if (user) {
      return res.status(409).json("User already exists!");
    }
    // Hash their password
    const hashedPassword = bcrypt.hashSync(value.password, 10);

    const profilePictureUrl = req.file?.path;
    // Save user into database
    await UserModel.create({
      ...value,
      password: hashedPassword,
      role: value.role || "user",
      profilePicture: profilePictureUrl,
    });
    // Send comfirmation email
    await mailTransport.sendMail({
      to: value.email,
      subject: "Welcome to H. A. Farms!",
      text: "Hello ${value.email},\n\nThank you for signing up! We're excited to have you on board.\n\nBest regards"
    });
    // Reponse to request
    res.json("User registered!");
  } catch (error) {
    next(error);
  }
}

export const loginUser = async (req, res, next) => {
  try {
    // Validate user input
    const { error, value } = loginUserValidator.validate(req.body);
    if (error) {
      return res.status(422).json(error);
    }
    // Find one user with identifier
    const user = await UserModel.findOne({ email: value.email });
    if (!user) {
      return res.status(404).json("User does not exist!");
    }
    // Compare their passwords
    const correctPassword = bcrypt.compareSync(value.password, user.password);
    if (!correctPassword) {
      return res.status(401).json
        ("Invalid credentials!");
    }
    // sign a token for user
    const token = jwt.sign(
      { id: user.id, role: user.role }, process.env.JWT_PRIVATE_KEY, { expiresIn: "24h" }
    );
    // respond to resquest
    res.json({
      message: "User logged in !",
      accessToken: token,
      role: user.role
    })

  } catch (error) {
    next(error);
  }

}


export const getProfile = async (req, res, next) => {
  try {
    // Find authenticated user from database
    const user = await UserModel
      .findById(req.auth.id)
      .select({ password: false });
    // Response request
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    // validate user input
    const { error, value } = updateProfileValidator.validate({
      ...req.body,
      profilePicture: req.file?.path
    });
    if (error) {
      return res.status(422).json(error);
    }
    // update user
    await UserModel.findByIdAndUpdate(req.auth.id, value);
    // respond to request
    res.json("User profile updated");
  } catch (error) {
    next(error);
  }
}