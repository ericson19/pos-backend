const Product = require("../models/productModel");
const payment = require("../models/paymentModel");
const clientSales = require("../models/clientSalesModel");
const { where, Op } = require("sequelize");

exports.makePayment = async (req, res) => {
  const invoiceNumber = "CINV-" + Date.now();
  const name = req.user.name;
  try {
    const { paymentMethod, amount, items } = req.body;
    const newPayment = await payment.create({
      name,
      paymentMethod,
      amount,
      status: "pending",
      invoiceNumber,
      userId: req.user.id,
    });
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ID ${item.productId} not found` });
      }
      if (product && product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ID ${item.productId}`,
        });
      }
      if (product) {
        await clientSales.create({
          paymentId: newPayment.id,
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
        product.stock -= item.quantity;
        await product.save();
      }
    }
    res.status(201).json({
      message: "Payment recorded successfully",
      payment: newPayment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get payment info for a client sale
exports.getClientPaymentInfo = async (req, res) => {
  try {
    const { invoiceNumber } = req.body;
    const paymentInfo = await payment.findOne({
      where: { saleId: invoiceNumber },
    });
    if (!paymentInfo) {
      return res.status(404).json({ message: "Payment info not found" });
    }
    res.status(200).json({ message: "Payment info retrieved", paymentInfo });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
