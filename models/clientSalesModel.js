const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const ClientSales = sequelize.define("ClientSales", {
  paymentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Payments",
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
});
// payment.hasMany(ClientSales, { foreignKey: "paymentId" });
// ClientSales.belongsTo(payment, { foreignKey: "paymentId" });
// ClientSales.belongsTo(Product, { foreignKey: "productId" });
module.exports = ClientSales;
