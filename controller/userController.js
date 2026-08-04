const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Store = require("../models/storesModel");
const Permission = require("../models/permission");
const Otp = require("../models/otpModel");
const mailTransporter = require("../config/mailConfig");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { permission } = require("../middleware/authMiddleware");
const { userMail, otpMail } = require("../mails/mailTemplate");
// const generateToken = require("../utils/generateToken");

const regController = async (req, res, next) => {
  const { name, email, role, password, permissionIds, storeId } = req.body;
  try {
    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: "please fill all fields" });
    }

    const regmail = await User.findOne({
      where: {
        email: email.toLowerCase(),
        [Op.or]: [storeId ? { storeId: storeId } : null, { role: "admin" }],
      },
    });

    // Check if store exists and you can register user or admin in it
    if (role !== "admin") {
      if (!storeId) {
        return res
          .status(400)
          .json({ message: "storeId is required for non-admin users" });
      }
      const store = await Store.findByPk(storeId);
      if (!store) {
        return res.status(400).json({ message: "store does not exist" });
      }
    }

    // console.log("Registering email:", email);
    // console.log("Found existing user:", regmail);
    if (regmail) {
      return res
        .status(400)
        .json({ message: "email already exists in this store" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    const token = await Otp.create({
      otp: hashedOtp,
      expiredAt: expiredAt,
      name,
      email,
      storeId: storeId || null,
      password: hashedPass,
      role,
      permission: permissionIds,
    });
    res.status(201).json({
      message: "User registered successfully. Please verify OTP sent to email.",
      email: email,
      otp: otp,
      permission: token.permission,
      expiredAt: expiredAt,
    });
    // Send OTP via email
    mailTransporter(email, "OTP Verification", otpMail(otp, name));
  } catch (error) {
    console.log(error);

    res.status(501).json({
      message: error.errors ? error.errors[0].message : error.message,
    });
  }
};
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpRecord = await Otp.findOne({
      where: {
        email: email,
        expiredAt: { [Op.gt]: new Date() }, // Check if token is not expired
      },
      order: [["createdAt", "DESC"]],
    });
    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp);
    console.log("OTP Record:", { otpRecord: otpRecord.otp, isMatch });
    if (!isMatch) {
      await otpRecord.destroy({ where: { email: email } }); // Invalidate the OTP after failed attempt
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (otpRecord) {
      const userId = otpRecord.id;

      const user = await User.create({
        name: otpRecord.name,
        email: otpRecord.email,
        role: otpRecord.role,
        storeId: otpRecord.storeId,

        password: otpRecord.password,
      });
      const permissions = [];
      let permissionData = otpRecord.permission;
      if (typeof permissionData === "string") {
        permissionData = JSON.parse(permissionData);
      }

      if (!permissionData || !Array.isArray(permissionData)) {
        return res
          .status(400)
          .json({ message: "permissions must be an array of ids" });
      }
      for (let perm of permissionData) {
        const [permission] = await Permission.findOrCreate({
          where: { name: perm.name },
        });
        permissions.push(permission);
      }
      await user.setPermissions(permissions); // <- must be Sequelize instances
      await Otp.destroy({
        where: {
          email: email,
          expiredAt: { [Op.lt]: new Date() }, // Delete expired tokens
        },
      });
      await otpRecord.destroy({ where: { email: email } }); // Delete token after successful verification

      if (user) {
        res.status(201).json({
          message: "User successfully registered",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            // store: store.name,
          },
        });
      } else {
        res
          .status(401)
          .json({ message: "something went wrong, could'nt register" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const otpRecord = await Otp.findOne({
      where: { email: email },
    });
    if (otpRecord) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
      const hashedOtp = await bcrypt.hash(otp.toString(), 10);
      await Otp.update(
        { otp: hashedOtp, expiredAt: expiredAt },
        { where: { email: email } },
      );
      mailTransporter(email, otp, otpRecord.name);
      res.status(200).json({
        message: "OTP resent successfully",
        email: email,
        otp: otp,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// //logout controller
// const logoutController = async (req, res) => {
//   res.cookie("token", "", {
//     httpOnly: true,
//     expires: new Date(0),
//   });
//   res.status(200).json({ message: "Logged out successfully" });
// };

const createPermission = async (req, res) => {
  const { name, description } = req.body;
  try {
    const permission = await Permission.findOne({ where: { name: name } });
    if (permission) {
      return res.status(400).json({ message: "permission exists" });
    }
    const newPermission = await Permission.create({ name, description });
    res.status(201).json({
      message: "permission created successfully",
      permission: newPermission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePermission = async (req, res) => {
  const id = req.params.id;
  const { permissionIds } = req.body;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const permissions = [];
    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res
        .status(400)
        .json({ message: "permissions must be an array of ids" });
    }
    for (let perm of permissionIds) {
      const [permission] = await Permission.findOrCreate({
        where: { name: perm.name },
      });
      permissions.push(permission);
    }
    await user.setPermissions(permissions); // <- must be Sequelize instances
    res.status(200).json({
      message: "Permissions updated successfully",
      userId: user.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//client registration
const regClient = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "please fill all fields" });
    }
    const regmail = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (regmail) {
      return res.status(400).json({ message: "email exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email,
      role: "client",
      password: hashedPass,
    });
    if (user) {
      res.status(201).json({
        message: "Client successfully registered",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          token: generateToken(user.id),
        },
      });
    } else {
      res
        .status(401)
        .json({ message: "something went wrong, could'nt register" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get all permissions
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.status(200).json({ permissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Permission }, { model: Store }],
      order: [["name", "ASC"]],
      attributes: { exclude: ["password"] },
    });

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//get all users for sales page
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { storeId: req.user.storeId },
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get users that has purchase permission
const getUsersWithPurchasePermission = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Permission,
          where: { name: "purchase" },
        },
      ],
      attributes: { exclude: ["password"] },
    });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update user deatails
const updateUser = async (req, res) => {
  const id = req.params.id;
  const edit = req.body;
  try {
    const user = await User.update(edit, { where: { id: id } });
    if (user) {
      const updatedUser = await User.findOne({
        where: { id: id },
        attributes: { exclude: ["password"] },
      });
      user.updatedAt = new Date();
      await updatedUser.save();
      res
        .status(200)
        .json({ message: "User updated successfully", updatedUser });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete user
const deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  regController,
  verifyOTP,
  getUsers,
  createPermission,
  updatePermission,
  getPermissions,
  regClient,
  updateUser,
  deleteUser,
  getAllUsers,
  getUsersWithPurchasePermission,
  resendOTP,
};
