const returnPurchase = require("../models/returnModel");
const Purchase = require("../models/purchaseModel");
const StockFlow = require("../models/stockflowModel");
const Supplier = require("../models/supplierModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");

// Process a return purchase
const processReturn = async (req, res) => {
  const { invoiceNumber, quantityReturned, reason, notes } = req.body;
  const userId = req.user.id;
  const storeId = req.user.storeId;
  try {
    const purchase = await Purchase.findOne({
      where: { invoiceNumber: invoiceNumber },
    });
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }
    if (quantityReturned > purchase.quantity) {
      return res
        .status(400)
        .json({ message: "Return quantity exceeds purchased quantity" });
    }
    if (!purchase.purchasePrice) {
      return res.status(400).json({
        message:
          "Purchase price not set for this purchase, cannot process return.",
      });
    }

    // const suppliedBy = await Supplier.findByPk(purchase.supplierId);
    const product = await Product.findByPk(purchase.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.stock -= Number(quantityReturned);
    product.updatedAt = new Date();
    await product.save();
    const amountReturned = quantityReturned * purchase.purchasePrice;

    const returnRecord = await returnPurchase.create({
      purchaseId: purchase.id,
      productId: purchase.productId,
      unitPrice: purchase.unitPrice,
      amountReturned,
      supplierId: purchase.supplierId,
      userId,
      storeId,
      invoiceNumber,
      quantityReturned,
      reason,
      notes,
    });
    const retult = await returnPurchase.findOne({
      where: { id: returnRecord.id },
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
      ],
    });
    await StockFlow.create({
      productId: product.id,
      quantity: Number(quantityReturned),
      movementType: "return",
      flowType: "out",
      oldStock: product.stock + Number(quantityReturned),
      newStock: product.stock,
      doneBy: userId,
      storeId,
    });
    res.status(201).json({
      message: "Return processed successfully",
      returnDetails: {
        ...retult.toJSON(),
        returnedBy: req.user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllReturns = async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  const offset = (page - 1) * limit;
  try {
    const { count, rows } = await returnPurchase.findAndCountAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      limit,
      offset,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ returns: rows, totalPages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get return by invoice number
const getReturnByInvoice = async (req, res) => {
  const { invoiceNumber } = req.params;
  try {
    const returnDetails = await returnPurchase.findOne({
      where: { invoiceNumber },
      include: [
        { model: Product, attributes: ["name"] },
        { model: Supplier, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
    });
    if (!returnDetails) {
      return res.status(404).json({ message: "no return recorded here" });
    }
    res.status(201).json({ message: "return seen", returnDetails });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get return date filter
const getReturnsByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const returns = await returnPurchase.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
      order: [["createdAt", "DESC"]],
    });
    if (returns.length === 0) {
      return res
        .status(404)
        .json({ message: "no returns found in this date range" });
    }
    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//get return by supplier
const getReturnsBySupplier = async (req, res) => {
  const { supplierId } = req.params;
  try {
    const returns = await returnPurchase.findAll({
      where: { supplierId },
      order: [["createdAt", "DESC"]],
    });
    if (returns.length === 0) {
      return res
        .status(404)
        .json({ message: "no returns found for this supplier" });
    }
    res.status(200).json({ returns });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//get return by received by user
const getReturnsByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const returns = await returnPurchase.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    if (returns.length === 0) {
      return res
        .status(404)
        .json({ message: "no returns found for this user" });
    }
    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  processReturn,
  getAllReturns,
  getReturnsBySupplier,
  getReturnsByUser,
  getReturnByInvoice,
  getReturnsByDateRange,
};
// module.exports = { processReturn, getAllReturns };
