import express from "express";
import rateLimit from "express-rate-limit";

import {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  registerUser,
  login
} from "../controllers/authController.js";

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP requests. Please try again later."
  }
});

router.post("/send-otp", otpLimiter, sendRegistrationOTP);
router.post("/verify-otp", verifyRegistrationOTP);
router.post("/register", registerUser);
router.post("/login", login);

export default router;
