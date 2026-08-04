const User = require("../models/userModel");
const Sales = require("../models/salesModel");
const Product = require("../models/productModel");
const Damaged = require("../models/damageModel");
const Category = require("../models/categoryModel");
const SaleItems = require("../models/salesItemsModel");
const Inflow = require("../models/stockflowModel");
const { Op, col, fn, Model } = require("sequelize");

const sequelize = require("../config/db");
const e = require("express");

exports.dateRangeReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  try {
    const sales = await Sales.sum("totalAmount", {
      where: { saleDate: { [Op.between]: [start, end] } },
    });
    if (!sales) {
      return res.status(404).json({ message: "no sales recorded on this day" });
    }
    return res.status(200).json({
      startDate: `date starts on ${start}`,
      endDate: `date ends on ${end}`,
      totalSold: sales,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.salesSummaryBySeller = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    const sales = await Sales.findAll({
      attributes: [
        "soldBy",
        [sequelize.fn("SUM", sequelize.col("Sales.totalAmount")), "totalSales"],
        [sequelize.fn("COUNT", sequelize.col("Sales.id")), "numberOfSales"],
      ],
      group: ["soldBy", "User.id"],
      include: [
        {
          model: User,
          attributes: ["name", "email"],
        },
      ],
      where: { soldBy: id },
    });
    if (!sales.length) {
      return res
        .status(404)
        .json({ message: "No sales found for " + user.name });
    }
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.sellerDate = async (req, res) => {
  const { name, startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  try {
    const user = await User.findOne({ where: { name: name } });
    const sales = await Sales.findAll({
      attributes: [
        "soldBy",
        [sequelize.fn("SUM", sequelize.col("Sales.totalAmount")), "totalSales"],
        [sequelize.fn("COUNT", sequelize.col("Sales.id")), "numberOfSales"],
      ],
      group: ["soldBy", "User.id"],
      include: [
        {
          model: User,
          attributes: ["name", "email"],
        },
      ],
      where: {
        soldBy: user.id,
        saleDate: { [Op.between]: [start, end] },
      },
    });
    if (!sales.length) {
      return res
        .status(404)
        .json({ message: "No sales found for " + user.name });
    }
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate product sales report
exports.productReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  try {
    const products = await SaleItems.findAll({
      attributes: [
        "productId",
        "productName",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantitySold"],
        [sequelize.fn("SUM", sequelize.col("totalPrice")), "totalSalesAmount"],
      ],
      group: ["productId", "productName"],
      include: [
        {
          model: Product,
          attributes: ["name", "price"],
        },
      ],
      order: [[sequelize.fn("SUM", sequelize.col("totalPrice")), "DESC"]],
      where: { createdAt: { [Op.between]: [start, end] } },
    });
    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products sold in this date range" });
    }
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate inventory report
exports.inventoryReport = async (req, res) => {
  try {
    const inflows = await Inflow.findAll({
      attributes: [
        "productId",
        "movementType",

        "flowType",
        "doneBy",
        [sequelize.fn("MAX", sequelize.col("inflowDate")), "latestInflowDate"],
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalInflow"],
      ],
      group: ["productId", "movementType", "flowType", "Product.id", "doneBy"],
      where: { flowType: "in", storeId: req.user.storeId },
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["latestInflowDate", "DESC"]],
    });
    if (!inflows.length) {
      return res.status(404).json({ message: "No inflows recorded" });
    }
    const outflows = await Inflow.findAll({
      attributes: [
        "productId",
        "movementType",

        "flowType",
        "doneBy",
        [sequelize.fn("MAX", sequelize.col("inflowDate")), "latestOutflowDate"],
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalOutflow"],
      ],
      group: ["productId", "movementType", "flowType", "Product.id", "doneBy"],
      where: { flowType: "out", storeId: req.user.storeId },
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["latestOutflowDate", "DESC"]],
    });
    if (!outflows.length) {
      return res.status(404).json({ message: "No outflows recorded" });
    }

    res.status(200).json({
      inflows: inflows,
      outflows: outflows,
      message: "Inventory report generated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate product inventory report
exports.productInventoryReport = async (req, res) => {
  const { productId } = req.params;
  try {
    const inflows = await Inflow.findAll({
      where: {
        productId: productId,
        flowType: "in",
        storeId: req.user.storeId,
      },
      attributes: [
        "productId",
        "movementType",
        "inflowDate",
        "flowType",
        "doneBy",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalInflow"],
      ],
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      group: [
        "productId",
        "movementType",
        "inflowDate",
        "Product.id",
        "doneBy",
      ],
    });
    const outflows = await Inflow.findAll({
      where: {
        productId: productId,
        flowType: "out",
        storeId: req.user.storeId,
      },
      attributes: [
        "productId",
        "movementType",
        "inflowDate",
        "flowType",
        "doneBy",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalOutflow"],
      ],
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      group: [
        "productId",
        "movementType",
        "inflowDate",
        "Product.id",
        "doneBy",
      ],
    });
    res.status(200).json({ inflows, outflows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate product and date range inventory report
exports.productAndDateInventoryReport = async (req, res) => {
  const { productId } = req.params;
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  // start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  try {
    const inflows = await Inflow.findAll({
      where: {
        productId: productId,
        flowType: "in",
        storeId: req.user.storeId,
        inflowDate: { [Op.between]: [start, end] },
      },
      attributes: [
        "productId",
        "movementType",

        "flowType",
        "doneBy",
        [sequelize.fn("MAX", sequelize.col("inflowDate")), "latestInflowDate"],
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalInflow"],
      ],
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      group: ["productId", "movementType", "Product.id", "doneBy"],
    });
    const outflows = await Inflow.findAll({
      where: {
        productId: productId,
        flowType: "out",
        storeId: req.user.storeId,
        inflowDate: { [Op.between]: [start, end] },
      },
      attributes: [
        "productId",
        "movementType",

        "flowType",
        "doneBy",
        [sequelize.fn("MAX", sequelize.col("inflowDate")), "latestOutflowDate"],
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalOutflow"],
      ],
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      group: ["productId", "movementType", "Product.id", "doneBy"],
    });
    res.status(200).json({ inflows, outflows });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate summary inventory report
exports.summaryInventoryReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  try {
    const summary = await Inflow.findAll({
      where: {
        storeId: req.user.storeId,
        inflowDate: { [Op.between]: [start, end] },
      },
      attributes: [
        "productId",
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "CASE WHEN flowType = 'in' THEN quantity ELSE 0 END",
            ),
          ),
          "totalQuantityIn",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "CASE WHEN flowType = 'out' THEN quantity ELSE 0 END",
            ),
          ),
          "totalQuantityOut",
        ],
      ],
      group: ["productId"],
      include: [{ model: Product, attributes: ["name"] }],
    });

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.auditSummary = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page);

    const offset = (page - 1) * limit || 0;
    const { count, rows } = await Inflow.findAndCountAll({
      where: { storeId: req.user.storeId },
      // order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      distinct: true,
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ auditLogs: rows, totalPages, totalLogs: count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.auditSummaryUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page);

    const offset = (page - 1) * limit || 0;
    const { count, rows } = await Inflow.findAndCountAll({
      where: { storeId: req.user.storeId, doneBy: userId },
      // order: [["createdAt", "DESC"]],
      limit: limit,
      offset: offset,
      distinct: true,
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    res.status(200).json({ auditLogs: rows, totalPages, totalLogs: count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.auditSummaryDate = async (req, res) => {
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const start = new Date(req.query.startDate);
  const end = new Date(req.query.endDate);
  const storeId = req.user.storeId;

  //configuration
  end.setHours(23, 59, 59, 999);
  const offset = (page - 1) * limit;

  try {
    if (!start || !end) {
      return res.status(400).json({ message: "Date not provided" });
    }
    const { count, rows } = await Inflow.findAndCountAll({
      where: {
        storeId: storeId,
        inflowDate: { [Op.between]: [start, end] },
      },
      limit: limit,
      offset: offset,
      distinct: true,
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["inflowDate", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      message: "successfully retrieve",

      auditLogs: rows,
      totalPages: totalPages,
      totalLogs: count,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};
exports.auditSummaryUserAndDate = async (req, res) => {
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const start = new Date(req.query.startDate);
  const end = new Date(req.query.endDate);
  const storeId = req.user.storeId;
  const userId = req.query.userId;

  //configuration
  end.setHours(23, 59, 59, 999);
  const offset = (page - 1) * limit;

  try {
    if (!start || !end) {
      return res.status(400).json({ message: "Date not provided" });
    }
    const { count, rows } = await Inflow.findAndCountAll({
      where: {
        storeId: storeId,
        doneBy: userId,
        inflowDate: { [Op.between]: [start, end] },
      },
      limit: limit,
      offset: offset,
      distinct: true,
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["inflowDate", "DESC"]],
    });
    console.log({
      storeId: storeId,
      doneBy: userId,
      inflowDate: { [Op.between]: [start, end] },
      req: req.query,
    });
    console.log("Rows:", rows);
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      message: "successfully retrieve",

      auditLogs: rows,
      totalPages: totalPages,
      totalLogs: count,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

//generate stock movement report
exports.stockMovementReport = async (req, res) => {
  const { actionType } = req.params;
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);
  const offset = (page - 1) * limit || 0;
  try {
    const { count, rows } = await Inflow.findAndCountAll({
      where: { movementType: actionType, storeId: req.user.storeId },
      include: [
        { model: Product, attributes: ["name"] },
        { model: User, attributes: ["name"] },
      ],
      order: [["inflowDate", "DESC"]],

      distinct: true,
      limit: limit,
      offset: offset,
    });
    const totalPages = Math.ceil(count / limit);
    res.status(200).json({
      message: "successfully retrieve",
      auditLogs: rows,
      totalPages: totalPages,
      totalLogs: count,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// view low stock alerts
exports.viewLowStockAlerts = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const lowStockProducts = await Product.findAll({
      where: {
        storeId,
        stock: { [Op.lte]: col("lowAlert") },
      },
      include: [
        { model: User, attributes: ["name"] },
        { model: Category, attributes: ["name"] },
      ],
    });
    if (!lowStockProducts.length) {
      return res.status(404).json({ message: "No low stock alerts" });
    }
    res.status(200).json({ lowStockProducts });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//get damaged products report
exports.damagedProductsReport = async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  const offset = (page - 1) * limit || 0;
  try {
    const storeId = req.user.storeId;
    const { count, rows } = await Damaged.findAndCountAll({
      where: { storeId: storeId },
      include: [
        { model: User, attributes: ["name"] },
        { model: Product, attributes: ["name"] },
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });
    const totalPages = Math.ceil(count / limit);
    if (!rows.length) {
      return res.status(404).json({ message: "No damaged products found" });
    }
    res.status(200).json({
      damages: rows,
      totalPages: totalPages,
      totalLogs: count,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
