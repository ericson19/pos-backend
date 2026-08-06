const sequelize = require("../config/db");
const User = require("./userModel");
const Permission = require("./permission");

User.belongsToMany(Permission, {
  through: "userpermissions",
  foreignKey: "UserId",
  otherKey: "PermissionId",
});

Permission.belongsToMany(User, {
  through: "userpermissions",
  foreignKey: "PermissionId",
  otherKey: "UserId",
});

module.exports = { sequelize, User, Permission };
