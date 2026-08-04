const express = require("express");
const {
  receiveOTP,
  confirmOTP,
  resetPassword,
  changePassword,
} = require("../controller/resetPasswordController");
const router = express.Router();

// Route to receive OTP for password reset
router.post("/receive-otp", receiveOTP);

// Route to reset password using OTP
router.post("/reset-password", resetPassword);

// Route to change password for authenticated users
router.post("/change-password", changePassword);

// Route to confirm OTP
router.post("/confirm-otp", confirmOTP);

module.exports = router;
