//damaged goods,
//stock adjustment
//stock transfer between stores
//view stock flow history
//low stock alerts
//stock audits

const stockFlow = require("../models/stockflowModel");
const Product = require("../models/productModel");
const Damaged = require("../models/damageModel");
const StockFlow = require("../models/stockflowModel");
const User = require("../models/userModel");
const Store = require("../models/storesModel");
const { where } = require("sequelize");

// save damaged goods record
const recordDamagedGoods = async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;
    const doneBy = req.user.id;
    const storeId = req.user.storeId;
    const product = await Product.findOne({
      where: { id: productId, storeId: storeId },
    });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found in the store" });
    }
    if (quantity > product.stock) {
      return res
        .status(400)
        .json({ message: "Damaged quantity exceeds available stock" });
    }
    product.stock -= Number(quantity);
    product.updatedAt = new Date();
    await product.save();
    await Damaged.create({
      productId: product.id,
      quantity: Number(quantity),
      userId: doneBy,
      storeId: storeId,
      reason,
    });
    const stockRecord = await stockFlow.create({
      productId: product.id,
      quantity: Number(quantity),
      movementType: "damage",
      flowType: "out",
      oldStock: product.stock + Number(quantity),
      newStock: product.stock,
      // product: product.name,
      doneBy,
      storeId,
    });
    res.status(201).json({
      message: "Damaged goods recorded successfully",
      stockRecord,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//stock adjustment
const adjustStock = async (req, res) => {
  try {
    const { quantity, adjustmentType, storeId } = req.body;
    const { productId } = req.params;
    const doneBy = req.user.id;
    const product = await Product.findOne({
      where: { id: productId, storeId: storeId },
    });
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found in the store" });
    }
    let oldStock = product.stock;
    if (adjustmentType === "increase") {
      product.stock += quantity;
    } else if (adjustmentType === "decrease") {
      if (quantity > product.stock) {
        return res
          .status(400)
          .json({ message: "Adjustment quantity exceeds available stock" });
      }
      product.stock -= quantity;
    } else {
      return res.status(400).json({ message: "Invalid adjustment type" });
    }

    product.updatedAt = new Date();
    await product.save();
    const stockRecord = await stockFlow.create({
      productId: product.id,
      quantity,
      movementType: "adjustment",
      flowType: adjustmentType === "increase" ? "in" : "out",
      oldStock,
      newStock: product.stock,
      // product: product.name,
      doneBy,
      storeId,
    });
    res.status(201).json({
      message: "Stock adjusted successfully",
      stockRecord,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//stock transfer between stores
const transferStock = async (req, res) => {
  try {
    const { productId, quantity, toStoreId } = req.body;
    const doneBy = req.user.id;
    const fromStoreId = req.user.storeId;
    const productFrom = await Product.findOne({
      where: { id: productId, storeId: fromStoreId },
    });
    if (!productFrom) {
      return res
        .status(404)
        .json({ message: "Product not found in the source store" });
    }
    if (quantity > productFrom.stock) {
      return res
        .status(400)
        .json({ message: "Transfer quantity exceeds available stock" });
    }
    if (fromStoreId === toStoreId) {
      return res
        .status(400)
        .json({ message: "Source and destination stores cannot be the same" });
    }
    let productTo = await Product.findOne({
      where: { barCode: productFrom.barCode, storeId: toStoreId },
    });
    if (!productTo) {
      productTo = await Product.create({
        name: productFrom.name,
        barCode: productFrom.barCode,
        price: productFrom.price,
        description: productFrom.description,
        categoryId: productFrom.categoryId,
        image: productFrom.image,
        addedBy: doneBy,
        stock: 0,
        storeId: toStoreId,
        lowAlert: productFrom.lowAlert,
      });
    }
    productFrom.stock -= Number(quantity);
    productFrom.updatedAt = new Date();
    await productFrom.save();

    productTo.stock += Number(quantity);
    productTo.updatedAt = new Date();
    await productTo.save();
    const stockRecordFrom = await stockFlow.create({
      productId: productFrom.id,
      quantity,
      movementType: "transfer-out",
      flowType: "out",
      oldStock: productFrom.stock + Number(quantity),
      newStock: productFrom.stock,
      // product: productFrom.name,
      doneBy,
      storeId: fromStoreId,
      sourceStoreId: fromStoreId,
      destinationStoreId: toStoreId,
    });
    const stockRecordTo = await stockFlow.create({
      productId: productTo.id,
      quantity,
      movementType: "transfer-in",
      flowType: "in",
      oldStock: productTo.stock - Number(quantity),
      newStock: productTo.stock,
      // product: productTo.name,
      doneBy,
      storeId: toStoreId,
      sourceStoreId: fromStoreId,
      destinationStoreId: toStoreId,
    });
    res.status(201).json({
      message: "Stock transferred successfully",
      stockRecordFrom,
      stockRecordTo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//view stock flow history
const viewStockFlowHistory = async (req, res) => {
  try {
    const { productId, storeId } = req.query;
    const stockFlows = await stockFlow.findAll({
      where: { productId, storeId },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(stockFlows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//low stock alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const lowStockProducts = await Product.findAll({
      where: {
        storeId,
        stock: { [Op.lte]: Sequelize.col("lowAlert") },
      },
    });
    res.status(200).json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//update stock alert level
const updateStockAlertLevel = async (req, res) => {
  try {
    const { productId } = req.params;
    const { lowAlert } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.lowAlert = lowAlert;
    await product.save();
    res
      .status(200)
      .json({ message: "Stock alert level updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//return stocks to supplier
// const returnStocksToSupplier = async (req, res) => {
//   const { productId, quantity, supplierId } = req.body;
//   const doneBy = req.user.id;
//   const storeId = req.user.storeId;
//   try {
//     const product = await Product.findOne({
//       where: { id: productId, storeId: storeId },
//     });
//     if (!product) {
//       return res
//         .status(404)
//         .json({ message: "Product not found in the store" });
//     }
//     if (quantity > product.stock) {
//       return res
//         .status(400)
//         .json({ message: "Return quantity exceeds available stock" });
//     }
//     product.stock -= Number(quantity);
//     await product.save();
//     await StockFlow.create({
//       productId: product.id,
//       quantity: Number(quantity),
//       movementType: "return",
//       flowType: "out",
//       oldStock: product.stock + Number(quantity),
//       newStock: product.stock,
//       doneBy,
//       storeId,
//     });
//     res
//       .status(200)
//       .json({ message: "Stocks returned to supplier successfully", product });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

module.exports = {
  updateStockAlertLevel,
  recordDamagedGoods,
  adjustStock,
  transferStock,
  viewStockFlowHistory,
  getLowStockAlerts,
  // returnStocksToSupplier,
};
