const express = require("express");
const { protect, permission } = require("../middleware/authMiddleware");
const {
  regController,
  createPermission,
  updatePermission,
  getPermissions,
  getUsers,
  updateUser,
  deleteUser,
  getAllUsers,
  getUsersWithPurchasePermission,
  verifyOTP,
  resendOTP,
} = require("../controller/userController");
const {
  loginController,
  logoutController,
} = require("../controller/loginController");

const router = express.Router();

router.post("/login", loginController);

router.post("/logout", logoutController);

router.post("/reg", protect, permission("manage"), regController);

router.post("/permission", protect, permission("manage"), createPermission);

router.get("/permissions", protect, getPermissions);

router.get("/users", protect, getUsers);

router.put("/permissions/:id", protect, permission("manage"), updatePermission);

router.put("/updateuser/:id", protect, permission("manage"), updateUser);

router.delete("/deleteuser/:id", protect, permission("manage"), deleteUser);

router.get("/sales-users", protect, getAllUsers);

router.get("/purchase-users", protect, getUsersWithPurchasePermission);

router.post("/verify-otp", verifyOTP);

router.post("/resend-otp", resendOTP);

module.exports = router;
