const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const Product = require("./productModel");

const category = sequelize.define(
  "category",
  {
    name: {
      type: DataTypes.STRING,
      required: true,
    },
    description: {
      type: DataTypes.STRING,
      required: true,
    },
  },
  {
    tableName: "categories",
  },
);

module.exports = category;
