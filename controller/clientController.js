const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
// const generateToken = require("../utils/generateToken");

exports.regClient = async (req, res) => {
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
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: process.env.SAMESITE,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.status(201).json({
        message: "Client successfully registered",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          // token: generateToken(user.id),
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
