const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const Product = require("./productModel");
const Sale = require("./salesModel");

const SaleItems = sequelize.define(
  "SaleItems",
  {
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Sales",
        key: "id",
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Products",
        key: "id",
      },
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "saleitems",
  },
);

Sale.hasMany(SaleItems, { foreignKey: "saleId" });
SaleItems.belongsTo(Sale, { foreignKey: "saleId" });
SaleItems.belongsTo(Product, { foreignKey: "productId" });
module.exports = SaleItems;
