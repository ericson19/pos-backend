const sequelize = require("../config/db");
const User = require("./userModel");
const { DataTypes } = require("sequelize");
const Product = require("./productModel");
const Store = require("./storesModel");
const product = require("./productModel");

const StockFlow = sequelize.define("StockFlow", {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: "id",
    },
  },

  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  newStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  oldStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  inflowDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  movementType: {
    type: DataTypes.ENUM(
      "purchase",
      "return",
      "adjustment",
      "sold",
      "damage",
      "transfer-in",
      "transfer-out"
    ),
    allowNull: false,
  },
  flowType: {
    type: DataTypes.ENUM("in", "out"),
    allowNull: false,
  },

  doneBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Store,
      key: "id",
    },
  },
  sourceStoreId: {
    type: DataTypes.INTEGER,
    allowNull: true, // nullable for non-transfer transactions
    references: { model: Store, key: "id" },
  },
  destinationStoreId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Store, key: "id" },
  },
});
StockFlow.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(StockFlow, { foreignKey: "productId" });
StockFlow.belongsTo(User, { foreignKey: "doneBy" });
User.hasMany(StockFlow, { foreignKey: "doneBy" });
StockFlow.belongsTo(Store, { foreignKey: "storeId" });
Store.hasMany(StockFlow, { foreignKey: "storeId" });
module.exports = StockFlow;
