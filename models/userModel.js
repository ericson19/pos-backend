// const mongoose = require("mongoose");

// const UserData = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: String,
//   role: {
//     type: String,
//     enum: ["admin", "storekeeper", "salesperson"],
//     default: ["saleperson"],
//   },
// });
// const User = mongoose.model("User", UserData);
// module.exports = User;
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Store = require("./storesModel");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,
  },
  storeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Store,
      key: "id",
    },
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("admin", "staff", "client"),
  },
});
User.belongsTo(Store, { foreignKey: "storeId" });
Store.hasMany(User, { foreignKey: "storeId" });
module.exports = User;
