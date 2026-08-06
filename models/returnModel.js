const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const Purchase = require("./purchaseModel");
const Product = require("./productModel");
const Supplier = require("./supplierModel");
const User = require("./userModel");

const returnPurchase = sequelize.define(
  "return",
  {
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Products",
        key: "id",
      },
    },

    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Purchases",
        key: "id",
      },
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Suppliers",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reason: {
      type: DataTypes.ENUM("damaged", "not_needed", "wrong_items"),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantityReturned: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amountReturned: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // status: {
    //   type: DataTypes.ENUM("pending", "approved", "rejected"),
    //   allowNull: false,
    // },
  },
  {
    tableName: "returns",
  },
);

Purchase.hasMany(returnPurchase, { foreignKey: "purchaseId" });
returnPurchase.belongsTo(Purchase, { foreignKey: "purchaseId" });
Product.hasMany(returnPurchase, { foreignKey: "productId" });
returnPurchase.belongsTo(Product, { foreignKey: "productId" });
User.hasMany(returnPurchase, { foreignKey: "userId" });
returnPurchase.belongsTo(User, { foreignKey: "userId" });
Supplier.hasMany(returnPurchase, { foreignKey: "supplierId" });
returnPurchase.belongsTo(Supplier, { foreignKey: "supplierId" });

module.exports = returnPurchase;
