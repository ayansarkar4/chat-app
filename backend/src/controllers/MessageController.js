import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/UserModel.js";
import { Message } from "../models/MessageModel.js";
import cloudinary from "../utils/cloudinary.js";
import { io, userSocketMap } from "../app.js";

//get all users except the logged in user
const getUsersForSidebar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
    "-password"
  );
  //count number of unread messages for each user
  const unseenMessages = {};
  const promises = filteredUsers.map(async (user) => {
    const messages = await Message.find({
      senderId: user._id,
      receiverId: userId,
      seen: false,
    });
    if (messages.length > 0) {
      unseenMessages[user._id] = messages.length;
    }
  });
  await Promise.all(promises);
  return res.status(200).json({
    success: true,
    message: "Users fetched successfully.",
    users: filteredUsers,
    unseenMessages,
  });
});

//get all messages for selected user
const getMessages = asyncHandler(async (req, res) => {
  const { id: selectedUserId } = req.params;
  const userId = req.user._id;

  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: selectedUserId },
      { senderId: selectedUserId, receiverId: userId },
    ],
  });
  await Message.updateMany(
    { senderId: selectedUserId, receiverId: userId },
    { seen: true }
  );
  return res.status(200).json({
    success: true,
    message: "Messages fetched successfully.",
    messages,
  });
});

//api to mark message as seen
const markMessageAsSeen = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Message.findByIdAndUpdate(id, { seen: true });
  return res
    .status(200)
    .json({ success: true, message: "Message marked as seen" });
});

//send messages to selected user
const sendMessage = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  const receiverId = req.params.id;
  const senderId = req.user._id;

  let imageUrl;
  if (image) {
    const upload = await cloudinary.uploader.upload(image);
    imageUrl = upload.secure_url;
  }
  const newMessage = await Message.create({
    text,
    image: imageUrl,
    senderId,
    receiverId,
  });
  //emit new message to the receiver's socket

  if (!newMessage) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to send message" });
  }
  //emit the new message to the receiver's socket
  const receiverSocketId = userSocketMap[receiverId];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }
  return res.status(200).json({
    success: true,
    message: "Message sent successfully.",
    newMessage,
  });
});

export { getUsersForSidebar, getMessages, markMessageAsSeen, sendMessage };
