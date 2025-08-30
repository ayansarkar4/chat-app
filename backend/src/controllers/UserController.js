import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/UserModel.js";
import { generateToken } from "../utils/token.js";
import cloudinary from "../utils/cloudinary.js";

// Signup
const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  if ([fullName, email, password, bio].some((field) => !field?.trim())) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter all required fields." });
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists." });
  }

  const user = await User.create({ fullName, email, password, bio });
  const token = generateToken(user._id);

  const safeUser = await User.findById(user._id).select("-password");
  return res.status(201).json({
    success: true,
    message: "User created successfully.",
    userData: safeUser,
    token,
  });
});

// Login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => !field?.trim())) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter all required fields." });
  }

  const existedUser = await User.findOne({ email });
  if (!existedUser) {
    return res
      .status(404)
      .json({ success: false, message: "User does not exist." });
  }

  const passwordCorrect = await existedUser.isPasswordCorrect(password);
  if (!passwordCorrect) {
    return res
      .status(400)
      .json({ success: false, message: "Password is incorrect." });
  }

  const token = generateToken(existedUser._id);
  const loggedInUser = await User.findById(existedUser._id).select("-password");

  return res.status(200).json({
    success: true,
    message: "User logged in successfully.",
    userData: loggedInUser,
    token,
  });
});

// Check user auth
const checkUserAuth = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User is authenticated.",
    user: req.user,
  });
});

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, profilePic, bio } = req.body;
  const userId = req.user._id;

  let updatedUser;
  if (profilePic) {
    const upload = await cloudinary.uploader.upload(profilePic);
    updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, profilePic: upload.secure_url, bio },
      { new: true }
    );
  } else {
    updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, bio },
      { new: true }
    );
  }

  return res.status(200).json({
    success: true,
    message: "User profile updated successfully.",
    user: updatedUser,
  });
});

export { signup, loginUser, checkUserAuth, updateProfile };
