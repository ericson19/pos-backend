const sequelize = require("../config/db");
const User = require("./userModel");
const { DataTypes } = require("sequelize");
const Product = require("./productModel");
const Store = require("./storesModel");
const Customer = require("./customersModel");

const Sale = sequelize.define(
  "Sales",
  {
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amountRemaining: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM("debt", "completed", "balance"),
      allowNull: false,
    },

    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Customer,
        key: "id",
      },
    },
    sellerName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    taxRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    saleType: {
      type: DataTypes.ENUM("in-store", "client"),
      allowNull: false,
    },
    soldBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    storeId: {
      type: DataTypes.INTEGER,
      required: true,
      references: {
        model: "Stores",
        key: "id",
      },
    },
  },
  {
    tableName: "sales",
  },
);
Sale.belongsTo(User, { foreignKey: "soldBy" });
User.hasMany(Sale, { foreignKey: "soldBy" });
Sale.belongsTo(Store, { foreignKey: "storeId" });
Store.hasMany(Sale, { foreignKey: "storeId" });
Sale.belongsTo(Customer, { foreignKey: "customerId" });
Customer.hasMany(Sale, { foreignKey: "customerId" });

module.exports = Sale;
