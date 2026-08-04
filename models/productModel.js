const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const User = require("./userModel");
const category = require("./categoryModel");
const Store = require("./storesModel");

const product = sequelize.define("Product", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  barCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lowAlert: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  storeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Stores",
      key: "id",
    },
  },
});
User.hasMany(product, { foreignKey: "addedBy" });
product.belongsTo(User, { foreignKey: "addedBy" });
category.hasMany(product, { foreignKey: "categoryId" });
product.belongsTo(category, { foreignKey: "categoryId" });
product.belongsTo(Store, { foreignKey: "storeId" });
Store.hasMany(product, { foreignKey: "storeId" });

module.exports = product;
