const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const loginMailConfig = require("../config/loginMailConfig");
const Store = require("../models/storesModel");
// const generateToken = require("../utils/generateToken");
const Permission = require("../models/userPermission");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const loginController = async (req, res, next) => {
  const { email, password, storeId } = req.body;
  try {
    if (!email || !password || !storeId) {
      return res.status(400).json({ message: "please fill all fields" });
    }

    const user = await User.findOne({ where: { email, storeId } });

    if (!user) {
      return res.status(400).json({
        message: "invalid credentials, email or password does not exist",
      });
    } else {
      const comparepass = await bcrypt.compare(password, user.password);
      if (!comparepass) {
        return res.status(400).json({
          message: "invalid credentials, email or password does not exist",
        });
      }
      const ExistingPermissions = await user.getPermissions();
      if (ExistingPermissions.length === 0) {
        return res.status(403).json({ message: "no permissions assigned" });
      }
      const store = await Store.findByPk(user.storeId);

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.SAMESITE || "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        message: "successfully logged in",
        // token: generateToken(user.id),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId,
          storeName: store.name,
          storeLocation: store.location,
          permissions: ExistingPermissions.map((perm) => perm.name),
        },
      });

      loginMailConfig(user.name, store.name);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//logout controller
const logoutController = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAMESITE || "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { loginController, logoutController };
