const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Customers = sequelize.define(
  "customers",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "customers",
  },
);

module.exports = Customers;
