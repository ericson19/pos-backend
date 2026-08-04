const jwt = require("jsonwebtoken");
const Users = require("../models/userModel");

const protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await Users.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "not authorized, token failed" });
  }
};
const permission = (requiredPermission) => {
  return async (req, res, next) => {
    const user = req.user;
    const userPermissions = await user.getPermissions();
    const userPermissionNames = userPermissions.map((perm) => perm.name);
    if (userPermissionNames.includes(requiredPermission)) {
      next();
    } else {
      res.status(403).json({ message: "forbidden: insufficient permissions" });
    }
  };
};

const adminOnly = async (req, res, next) => {
  const user = req.user;
  if (user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "forbidden: admin only access" });
  }
};

module.exports = { protect, permission, adminOnly };
