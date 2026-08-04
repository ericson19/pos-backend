const Otp = require("../models/otpModel");
const User = require("../models/userModel");
const mailTransporter = require("../config/mailConfig");
const bcrypt = require("bcryptjs");
const { userMail, otpMail } = require("../mails/mailTemplate");

// Receive OTP for password reset
const receiveOTP = async (req, res) => {
  const { email, storeId } = req.body;

  try {
    const foundUser = await User.findOne({
      where: { email: email, storeId: storeId },
    });
    if (!foundUser) {
      return res
        .status(404)
        .json({ message: "email does not exist in this store" });
    }
    const otp = Math.floor(100000 + Math.random() * 90000).toString();
    const expiredAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now]
    const hashedToken = await bcrypt.hash(otp.toString(), 10);

    await Otp.create({
      storeId: storeId,
      email: foundUser.email,
      otp: hashedToken,
      expiredAt: expiredAt,
    });
    mailTransporter(
      foundUser.email,
      "OTP for password reset",
      otpMail(otp, foundUser.name),
    );
    return res.status(201).json({
      message: "OTP has been sent to your email address",
      expiredAt: expiredAt,
      user: foundUser.name,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//confirm otp
const confirmOTP = async (req, res) => {
  const { email, storeId, otp } = req.body;
  try {
    const foundUser = await User.findOne({
      where: { email: email, storeId: storeId },
      order: [["createdAt", "DESC"]],
    });
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const foundOtp = await Otp.findOne({
      where: { email: email, storeId: storeId },
    });
    if (!foundOtp) {
      return res.status(400).json({ message: "OTP not found" });
    }
    if (foundOtp.expiredAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    console.log("Comparing OTP:", otp.toString(), "with hash:", foundOtp.otp);
    const isValid = await bcrypt.compare(otp.toString(), foundOtp.otp);
    if (!isValid) {
      await foundOtp.destroy({ where: { email: email, storeId: storeId } }); // Invalidate the OTP after failed attempt
      return res.status(400).json({ message: "Invalid OTP" });
    }
    await foundOtp.destroy({ where: { email: email, storeId: storeId } }); // Invalidate the OTP after successful verification
    res.status(200).json({ message: "OTP is valid" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

//reset password
const resetPassword = async (req, res) => {
  const { email, storeId, newPassword, conPassword } = req.body;
  try {
    const foundUser = await User.findOne({
      where: { email: email, storeId: storeId },
    });
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (newPassword !== conPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    foundUser.password = hashedPassword;
    await foundUser.save();
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Change password when logged in
const changePassword = async (req, res) => {
  const { currentPassword, newPassword, conPassword } = req.body;
  const userId = req.user.id;
  const storeId = req.user.storeId;
  try {
    const foundUser = await User.findOne({
      where: { id: userId, storeId: storeId },
    });
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, foundUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    if (newPassword !== conPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    foundUser.password = hashedPassword;
    await foundUser.save();
    res.status(200).json({ message: "Password has been changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { receiveOTP, confirmOTP, resetPassword, changePassword };
