const Purchase = require("../models/purchaseModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Supplier = require("../models/supplierModel");
const Store = require("../models/storesModel");
const stockFlow = require("../models/stockflowModel");
const { Op } = require("sequelize");

//make a purchase
const purchaseItem = async (req, res) => {
  const {
    quantity,
    unitPrice,
    purchasePrice,
    paymentStatus,
    paymentMethod,
    invoiceNumber,
    amountPaid,
    amountRemaining,
    totalAmount,
    product,
    supplierId,
    storeId,
  } = req.body;
  const purchasedBy = req.user.id;
  try {
    const products = await Product.findOne({
      where: { name: product, storeId: storeId },
    });
    if (!products) {
      return res.status(404).json({
        message: "error, product not found, kindly add product in product list",
      });
    }
    if (products.price != unitPrice) {
      return res
        .status(400)
        .json({ message: "error, unit price does not match product price" });
    }

    products.stock = Number(products.stock) + Number(quantity);
    products.updatedAt = new Date();
    await products.save();

    const stockRecord = await stockFlow.create({
      productId: products.id,
      quantity,
      movementType: "purchase",
      flowType: "in",
      oldStock: products.stock - Number(quantity),
      newStock: products.stock,
      doneBy: purchasedBy,
      storeId,
    });

    const purchase = await Purchase.create({
      totalAmount,
      quantity,
      unitPrice,
      purchasePrice,
      paymentStatus,
      paymentMethod,
      invoiceNumber,
      amountPaid,
      amountRemaining,
      purchasedBy,
      productId: products.id,
      supplierId,
      storeId,
    });
    const result = await Purchase.findOne({
      where: { id: purchase.id },
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
        { model: User, attributes: ["name"] },
        { model: Store, attributes: ["name"] },
      ],
    });
    res.status(200).json({
      message: "purchase made successfully",

      purchase: result,
    });
    // console.log("Request body:", req.body);
    // console.log("Request params:", req.params);
    if (!purchase) {
      return res
        .status(404)
        .json({ message: "error, purchase not made successfully" });
    }
  } catch (error) {
    console.error("Error processing purchase:", error);
    res.status(500).json({ message: error.message });
  }
};
//get purchase by invoice number
const getPurchaseByInvoice = async (req, res) => {
  const { invoiceNumber } = req.body;
  try {
    const purchaseDetails = await Purchase.findOne({
      where: { invoiceNumber },
    });
    if (!purchaseDetails) {
      return res.status(404).json({ message: "no purchase recorded here" });
    }
    res.status(201).json({ message: "purchase seen", purchaseDetails });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update payment info for a purchase
const updatePayment = async (req, res) => {
  const { invoice } = req.params.invoice;
  const { amountPaid, paymentStatus } = req.body;
  try {
    const purchase = await Purchase.findOne({
      where: { invoiceNumber: invoice },
    });
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    purchase.amountPaid = amountPaid || purchase.amountPaid;
    purchase.amountRemaining = purchase.amountRemaining - purchase.amountPaid;
    if (purchase.amountRemaining <= 0) {
      purchase.paymentStatus = "completed";
    }

    // purchase.paymentStatus = paymentStatus || purchase.paymentStatus;
    await purchase.save();
    res.status(200).json({ message: "Payment updated successfully", purchase });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//get all purchases
const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
        { model: User, attributes: ["name"] },
        { model: Store, attributes: ["name"] },
      ],
    });
    res.status(200).json({ purchases });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get all purchases by supplier and date range
const getPurchasesBySupplierAndDate = async (req, res) => {
  const { supplierId } = req.params;
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  // start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  try {
    const purchases = await Purchase.findAll({
      where: {
        supplierId,
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
        { model: User, attributes: ["name"] },
        { model: Store, attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    if (purchases.length === 0) {
      return res.status(404).json({
        message: "no purchases found for this supplier in this date range",
      });
    }
    res.status(200).json({ purchases });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//get purchases by date range
const getPurchasesByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  // start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  try {
    const purchases = await Purchase.findAll({
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
        { model: User, attributes: ["name"] },
        { model: Store, attributes: ["name"] },
      ],

      order: [["createdAt", "DESC"]],
    });
    if (purchases.length === 0) {
      return res
        .status(404)
        .json({ message: "no purchases found in this date range" });
    }
    res.status(200).json({ purchases });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//get purchase by receivedBy on date range
const getPurchasesByReceivedByAndDate = async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  // start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  try {
    const purchases = await Purchase.findAll({
      where: {
        purchasedBy: userId,
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
        { model: User, attributes: ["name"] },
        { model: Store, attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    if (purchases.length === 0) {
      return res.status(404).json({
        message: "no purchases found for this receiver in this date range",
      });
    }
    res.status(200).json({ purchases });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get payment methods from enum
const getPaymentMethods = async (req, res) => {
  try {
    const enumValue = Purchase.rawAttributes.paymentMethod.values;
    res.status(200).json({ paymentMethods: enumValue });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  purchaseItem,
  getPurchaseByInvoice,
  updatePayment,
  getAllPurchases,
  getPurchasesBySupplierAndDate,
  getPurchasesByDateRange,
  getPurchasesByReceivedByAndDate,
  getPaymentMethods,
};
