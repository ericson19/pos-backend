const sequelize = require("../config/db");
const User = require("./userModel");
const Permission = require("./permission");

User.belongsToMany(Permission, { through: "UserPermissions" });
Permission.belongsToMany(User, { through: "UserPermissions" });

module.exports = { sequelize, User, Permission };
