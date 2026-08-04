const Sales = require("../models/salesModel");
const SaleItems = require("../models/salesItemsModel");
const Product = require("../models/productModel");
const clientPayment = require("../models/paymentModel");
const clientSales = require("../models/clientSalesModel");
const customer = require("../models/customersModel");
const User = require("../models/userModel");
const { where, Op } = require("sequelize");
const Store = require("../models/storesModel");
const sequelize = require("../config/db");
const stockFlow = require("../models/stockflowModel");
const Sale = require("../models/salesModel");

// Create a new sale
exports.createSale = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      paymentMethod,
      customerId,
      totalAmount,
      amountRemaining,
      paymentStatus,
      discount,
      taxRate,
      amountPaid,
      items,
      AdminStoreId,
    } = req.body;
    const soldBy = req.user.id;
    const storeId = req.user.storeId;
    const invoice = "INV-" + Date.now();

    console.log(invoice);

    const store = await Store.findByPk(storeId);
    let storeIdToUse;
    let storeUsed;
    if (req.user.role === "admin" && AdminStoreId) {
      // Use the provided AdminStoreId
      const adminStore = await Store.findByPk(AdminStoreId);
      if (!adminStore) {
        await t.rollback();
        return res
          .status(404)
          .json({ message: "the store that admin choose is not in existence" });
      }
      storeIdToUse = AdminStoreId;
      storeUsed = adminStore;
    } else {
      // Use the user's storeId
      storeIdToUse = storeId;
      storeUsed = store;
    }
    // const storeUsed = req.user.role === "admin" ? adminStore : store;
    const user = await User.findByPk(soldBy);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    const customerRecord = await customer.findByPk(customerId);
    if (customerId && !customerRecord) {
      await t.rollback();
      return res.status(404).json({ message: "Customer not found" });
    }

    console.log("Creating sale with customer:", customerId);
    const sale = await Sales.create(
      {
        paymentMethod,
        totalAmount,
        customerId,
        saleType: "in-store",
        invoice,
        amountRemaining,
        amountPaid,
        discount,
        taxRate,
        paymentStatus,
        soldBy: soldBy,
        storeId: storeIdToUse,
        sellerName: user.name,
      },
      { transaction: t },
    );

    for (const item of items) {
      try {
        const product = await Product.findOne({
          where: {
            id: item.id,
            storeId: storeIdToUse,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!product) {
          return res.status(404).json({
            message: `Product ID ${item.productId} not found on ${storeUsed.name}`,
          });
        }
        if (product && product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for product ID ${item.productId} on ${storeUsed.name}`,
          });
        }
        if (product) {
          await stockFlow.create(
            {
              productId: product.id,
              movementType: "sold",
              quantity: item.quantity,
              flowType: "out",
              // product: product.name,
              newStock: product.stock - item.quantity,
              oldStock: product.stock,
              doneBy: user.id,
              storeId: storeIdToUse,
            },
            { transaction: t },
          );
          // Create sale items and update stock
          await SaleItems.create(
            {
              saleId: sale.id,
              productId: item.id,
              productName: product.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.quantity * item.price,
            },
            { transaction: t },
          );

          // Update product stock
          product.stock -= item.quantity;
          await product.save({ transaction: t }); // stock should only be updated within the transaction
        }
      } catch (error) {
        await t.rollback();
        return res
          .status(500)
          .json({ message: "Server error", error: error.message });
      }
    }
    await t.commit();
    res.status(201).json({
      message: "Sale created successfully",
      saleId: sale.id,
      SaleInvoice: sale.invoice,
      customerName: customerRecord ? customerRecord.name : "Walk-in Customer",
      soldBy: user.name,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getSalesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Number(req.query.limit);
    const page = Number(req.query.page);
    const offset = (page - 1) * limit;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { count, rows: sales } = await Sales.findAndCountAll({
      where: { soldBy: user.id },
      include: [
        { model: SaleItems },
        { model: customer, attributes: ["phone", "name"] },
      ],
      limit: limit,
      offset: offset,
      distinct: true,
      order: [["saleDate", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    const totalAmount = await Sales.sum("totalAmount", {
      where: { soldBy: user.id },
    });
    const totalPaid = await Sales.sum("amountPaid", {
      where: { soldBy: user.id },
    });
    res.status(200).json({
      sales: sales,
      totalAmount: totalAmount || 0,
      totalPaid: totalPaid || 0,
      soldBy: user.name,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Get a sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sales.findByPk(id, {
      include: [{ model: SaleItems }],
    });
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  const storeId = req.user.storeId;
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const offset = (page - 1) * limit;
  try {
    const { count, rows: sales } = await Sales.findAndCountAll({
      where: { storeId: storeId },
      include: [
        { model: SaleItems },
        { model: customer, attributes: ["phone", "name"] },
      ],
      order: [["saleDate", "DESC"]],
      limit: limit,
      offset: offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);
    const totalAmount = await Sales.sum("totalAmount", {
      where: { storeId: storeId },
    });
    const totalPaid = await Sales.sum("amountPaid", {
      where: { storeId: storeId },
    });

    res.status(200).json({
      sales,
      totalAmount: totalAmount || 0,
      totalPaid: totalPaid || 0,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//Get sales by date range
exports.getSalesByDateRange = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { startDate, endDate } = req.query;
    const limit = Number(req.query.limit);
    const page = Number(req.query.page);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of the day

    const offset = (page - 1) * limit;
    const { count, rows: sales } = await Sales.findAndCountAll({
      where: {
        saleDate: {
          [Op.between]: [start, end],
        },
        storeId: storeId,
      },
      order: [["saleDate", "DESC"]],
      include: [
        { model: SaleItems },
        { model: customer, attributes: ["phone", "name"] },
      ],
      limit: limit,
      offset: offset,
    });
    const totalPages = Math.ceil(count / limit);
    const totalAmount = await Sales.sum("totalAmount", {
      where: {
        saleDate: {
          [Op.between]: [start, end],
        },
        storeId: storeId,
      },
    });
    const totalPaid = await Sales.sum("amountPaid", {
      where: {
        saleDate: {
          [Op.between]: [start, end],
        },
        storeId: storeId,
      },
    });
    res.status(200).json({
      sales: sales,
      totalAmount: totalAmount || 0,
      totalPaid: totalPaid || 0,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//ger sales by customer name
exports.getSalesByCustomerName = async (req, res) => {
  try {
    const { customerId } = req.params;
    const limit = Number(req.query.limit);
    const page = Number(req.query.page);
    const offset = (page - 1) * limit;
    const { count, rows: sales } = await Sales.findAndCountAll({
      where: { customerId: customerId },
      include: [
        { model: SaleItems },
        { model: customer, attributes: ["phone", "name"] },
      ],
      limit: limit,
      offset: offset,
    });
    const totalPages = Math.ceil(count / limit);
    const totalAmount = await Sales.sum("totalAmount", {
      where: { customerId: customerId },
    });
    const totalPaid = await Sales.sum("amountPaid", {
      where: { customerId: customerId },
    });
    res.status(200).json({
      sales,
      totalAmount: totalAmount || 0,
      totalPaid: totalPaid || 0,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get sales by seller name and date range
exports.getSalesBySellerAndDateRange = async (req, res) => {
  try {
    const { sellerId, startDate, endDate } = req.query;
    const limit = Number(req.query.limit);
    const page = Number(req.query.page);
    const offset = (page - 1) * limit;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of the day
    const { count, rows: sales } = await Sales.findAndCountAll({
      where: {
        soldBy: sellerId,
        saleDate: {
          [Op.between]: [start, end],
        },
      },
      order: [["saleDate", "DESC"]],
      include: [
        { model: SaleItems },
        { model: customer, attributes: ["phone", "name"] },
      ],
      limit: limit,
      offset: offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);
    const totalAmount = await Sales.sum("totalAmount", {
      where: {
        soldBy: sellerId,
        saleDate: {
          [Op.between]: [start, end],
        },
      },
    });
    const totalPaid = await Sales.sum("amountPaid", {
      where: {
        soldBy: sellerId,
        saleDate: {
          [Op.between]: [start, end],
        },
      },
    });
    res.status(200).json({
      sales,
      totalAmount: totalAmount || 0,
      totalPaid: totalPaid || 0,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get all sales from payment status
exports.getSalesByPaymentStatus = async (req, res) => {
  const storeId = req.user.storeId;
  const { paymentStatus } = req.query;
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const offset = (page - 1) * limit;
  try {
    const { count, rows: sales } = await Sales.findAndCountAll({
      where: { paymentStatus: paymentStatus, storeId: storeId },
      include: [
        { model: SaleItems },
        { model: customer, attributes: ["phone", "name"] },
      ],
      limit: limit,
      offset: offset,
      distinct: true,
      order: [["saleDate", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    const totalAmount = await Sales.sum("totalAmount", {
      where: { paymentStatus: paymentStatus, storeId: storeId },
    });
    const totalPaid = await Sales.sum("amountPaid", {
      where: { paymentStatus: paymentStatus, storeId: storeId },
    });
    res.status(200).json({
      sales,
      totalAmount: totalAmount || 0,
      totalPaid: totalPaid || 0,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get payment info for a client sale
exports.getClientPaymentInfo = async (req, res) => {
  try {
    const { invoiceNumber } = req.body;
    const paymentInfo = await clientPayment.findOne({
      where: { invoiceNumber: invoiceNumber },
    });
    if (!paymentInfo) {
      return res.status(404).json({ message: "Payment info not found" });
    }
    paymentInfo.status = "completed";
    await paymentInfo.save();
    const sale = await Sales.create({
      paymentMethod: paymentInfo.paymentMethod,
      totalAmount: paymentInfo.amount,
      customersName: paymentInfo.name,
      saleType: "client",
      invoice: paymentInfo.invoiceNumber,
      soldBy: req.user.id,
      sellerName: req.user.name,
    });

    const clientItems = await clientSales.findAll({
      where: { paymentId: paymentInfo.id },
    });
    for (const item of clientItems) {
      const product = await Product.findByPk(item.productId);
      await SaleItems.create({
        saleId: sale.id,
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    }
    res.status(200).json({
      message: "Payment info retrieved",
      paymentInfo,
      clientItems,
      sale,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get sales Items by invoice number
exports.getSalesItemsByInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const sale = await Sales.findOne({
      where: { invoice: invoiceNumber },
      include: [
        { model: SaleItems },
        { model: customer, attributes: ["phone", "name"] },
      ],
    });
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.status(200).json({ sale });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//get total sales count
// exports.getTotalSalesCount = async (req, res) => {
//   try {
//     const storeId = req.user.storeId;
//     const totalSales = await Sales.count({ where: { storeId: storeId } });
//     res.status(200).json({ totalSales });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
