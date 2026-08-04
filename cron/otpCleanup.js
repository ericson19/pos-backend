const otp = require("../models/otpModel");
const { Op } = require("sequelize");

// Function to clean up expired OTP tokens
const otpCleanup = async () => {
  try {
    const now = new Date();
    const result = await otp.destroy({
      where: {
        expiredAt: {
          [Op.lt]: now,
        },
      },
    });
    console.log(`OTP Cleanup: Deleted ${result} expired OTP tokens.`);
  } catch (error) {
    console.error("Error during OTP cleanup:", error);
  }
};

module.exports = otpCleanup;
