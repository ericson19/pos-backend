const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");
const Product = require("./productModel");
const User = require("./userModel");
const Store = require("./storesModel");

const Damage = sequelize.define("Damage", {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: "id",
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Store,
      key: "id",
    },
  },
});

Product.hasMany(Damage, { foreignKey: "productId" });
Damage.belongsTo(Product, { foreignKey: "productId" });
User.hasMany(Damage, { foreignKey: "userId" });
Damage.belongsTo(User, { foreignKey: "userId" });
Store.hasMany(Damage, { foreignKey: "storeId" });
Damage.belongsTo(Store, { foreignKey: "storeId" });

module.exports = Damage;
