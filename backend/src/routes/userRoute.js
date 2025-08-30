import { Router } from "express";
import {
  signup,
  loginUser,
  checkUserAuth,
  updateProfile,
} from "../controllers/UserController.js";
import authUser from "../middlewares/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", loginUser);
router.get("/check", authUser, checkUserAuth);
router.put("/update-profile", authUser, updateProfile);

export default router;
