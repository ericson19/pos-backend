const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const Product = require("./productModel");
const Supplier = require("./supplierModel");
const User = require("./userModel");
const Store = require("./storesModel");

const Purchase = sequelize.define(
  "Purchase",
  {
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
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
    purchasePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amountRemaining: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM("debt", "completed", "partial"),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM("cash", "POS", "Bank_transfer"),
      allowNull: true,
      defaultValue: "cash",
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purchasedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
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
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Suppliers",
        key: "id",
      },
    },
    storeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Stores",
        key: "id",
      },
    },
  },
  {
    tableName: "purchases",
  },
);
Purchase.belongsTo(User, { foreignKey: "purchasedBy" });
User.hasMany(Purchase, { foreignKey: "purchasedBy" });
Purchase.belongsTo(Supplier, { foreignKey: "supplierId" });
Supplier.hasMany(Purchase, { foreignKey: "supplierId" });
Purchase.belongsTo(Store, { foreignKey: "storeId" });
Store.hasMany(Purchase, { foreignKey: "storeId" });
Purchase.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(Purchase, { foreignKey: "productId" });

module.exports = Purchase;
