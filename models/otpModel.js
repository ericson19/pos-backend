const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const { permission } = require("../middleware/authMiddleware");

const otp = sequelize.define("otp", {
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  expiredAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM("admin", "staff", "client"),
  },
  permission: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});

module.exports = otp;
