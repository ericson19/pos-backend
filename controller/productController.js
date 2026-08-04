const { where } = require("sequelize");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Store = require("../models/storesModel");
const path = require("path");
const stockFlow = require("../models/stockflowModel");
const User = require("../models/userModel");
const { error } = require("console");
const { Op } = require("sequelize");

const addProduct = async (req, res) => {
  const {
    categoryId,
    name,
    stock,
    barCode,
    price,
    description,
    storeId,
    lowAlert,
  } = req.body;
  const existingProducts = await Product.findOne({ where: { name, storeId } });
  const imagePath = req.file ? req.file.path : null;
  try {
    const existingCategory = await Category.findOne({
      where: { id: categoryId },
    });
    if (!existingCategory) {
      return res.status(400).json({ message: "category does not exist" });
    }
    const addedBy = req.user.name;
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(400).json({ message: "store does not exist" });
    }

    if (existingProducts) {
      existingProducts.stock = Number(existingProducts.stock) + Number(stock);
      existingProducts.updatedAt = new Date();
      await existingProducts.save();
      const stockRecord = await stockFlow.create({
        productId: existingProducts.id,
        quantity: stock,
        movementType: "adjustment",
        flowType: "in",
        oldStock: existingProducts.stock - stock,
        newStock: existingProducts.stock,
        product: existingProducts.name,
        doneBy: req.user.id,
        storeId,
      });
      if (!stockRecord) {
        return res
          .status(500)
          .json({ message: "Failed to create stock flow record" });
      }
      const result = await stockFlow.findOne({
        where: { id: stockRecord.id },
        include: [
          { model: Product, attributes: ["name"] },
          { model: Store, attributes: ["name"] },
          { model: User, attributes: ["name"] },
        ],
      });

      return res.status(201).json({
        message: "product successfully added",
        product: {
          ...result.toJSON(),
          stock: existingProducts.stock,
          createdAt: existingProducts.createdAt,
          updatedAt: existingProducts.updatedAt,
        },
      });
    }

    const newProd = await Product.create({
      name,
      categoryId: existingCategory.id,
      stock,
      barCode,
      price,
      description,
      image: imagePath,
      lowAlert,
      addedBy: req.user.id,
      storeId,
    });
    if (newProd) {
      const stockRecord = await stockFlow.create({
        productId: newProd.id,
        quantity: stock,
        movementType: "adjustment",
        flowType: "in",
        oldStock: newProd.stock - stock,
        newStock: newProd.stock,
        // product: newProd.name,
        doneBy: req.user.id,
        storeId,
      });
      if (!stockRecord) {
        return res
          .status(500)
          .json({ message: "Failed to create stock flow record" });
      }
      res.status(201).json({
        message: "product added successfully",
        newProd,
        addedBy: addedBy,
        store: store.name,
      });
    }
  } catch (error) {
    res.status(501).json({
      message: error.errors ? error.errors[0].message : error.message,
    });
  }
};
const viewProduct = async (req, res) => {
  const Id = req.params.id;
  const storeId = req.user.storeId;
  const product = await Product.findOne({ where: { id: Id, storeId } });
  try {
    if (product) {
      res.status(201).json({ message: "product seen", product });
    }

    res.status(404).json({ message: "product not found" });
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};
const viewProductByBarCode = async (req, res) => {
  const { barCode } = req.params;
  const storeId = req.user.storeId;

  try {
    if (!barCode) {
      return res.status(400).json({ message: "barCode parameter is required" });
    }
    if (!storeId) {
      return res.status(400).json({ message: "storeId is required" });
    }
    const product = await Product.findOne({ where: { barCode, storeId } });
    if (product) {
      return res.status(201).json({ message: "product seen", product });
    }
    res.status(404).json({ message: "product not found" });
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};

const viewProductByNameLike = async (req, res) => {
  const { name } = req.params;
  const storeId = req.user.storeId;
  try {
    if (!name) {
      return res.status(400).json({ message: "name parameter is required" });
    }
    if (!storeId) {
      return res.status(400).json({ message: "storeId is required" });
    }
    const product = await Product.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`,
        },
        storeId,
      },
    });
    if (product) {
      return res.status(201).json({ message: "product seen", product });
    }
    res.status(404).json({ message: "product not found" });
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};

const viewProductByName = async (req, res) => {
  const { productId, storeId } = req.query;
  // const storeId = req.user.storeId;
  try {
    if (!productId) {
      return res
        .status(400)
        .json({ message: "productId parameter is required" });
    }
    if (!storeId) {
      return res.status(400).json({ message: "storeId is required" });
    }
    const product = await Product.findOne({
      where: {
        id: productId,
        storeId,
      },
    });
    if (product) {
      return res.status(201).json({ message: "product seen", product });
    }
    res.status(404).json({ message: "product not found" });
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};

const viewAllProduct = async (req, res) => {
  try {
    const product = await Product.findAll({
      order: [["name", "ASC"]],
    });
    if (product.length === 0) {
      return res.status(404).json({ message: "no products found" });
    }
    res.status(201).json({ message: "product seen all", product });
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};

const viewAllProductUser = async (req, res) => {
  const storeId = req.user.storeId;
  try {
    const products = await Product.findAll({
      where: { storeId },
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],

      order: [["name", "ASC"]],
    });
    if (products.length === 0) {
      return res.status(404).json({ message: "no products found" });
    }

    res.status(201).json({ message: "products retrieved", products });
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};

const editProduct = async (req, res) => {
  const Id = req.params.id;
  const edit = req.body;
  try {
    const [product] = await Product.update(edit, {
      where: { id: Id },
    });
    if (product) {
      const updatedProduct = await Product.findByPk(Id);
      res.status(200).json({ message: "updated successfully", updatedProduct });
    } else {
      res.status(404).json({ message: "product not found" });
    }
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};

//Delete product
const deleteProduct = async (req, res) => {
  const Id = req.params.id;
  try {
    const deletedStockFlows = await stockFlow.destroy({
      where: { productId: Id },
    });
    console.log(
      `Deleted ${deletedStockFlows} stock flow records associated with product ID ${Id}`,
    );

    const deleted = await Product.destroy({ where: { id: Id } });
    if (deleted) {
      res.status(200).json({ message: "product deleted successfully" });
    } else {
      res.status(404).json({ message: "product not found" });
    }
  } catch (error) {
    res.status(501).json({ message: error.message });
  }
};

const viewByCategory = async (req, res) => {
  const categoryId = req.params.id;
  const storeId = req.user.storeId;
  console.log("👉 categoryId from req.params:", categoryId);
  try {
    const category = await Category.findOne({ where: { id: categoryId } });
    console.log("👉 category found:", category);
    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }
    console.log(categoryId);
    console.log(category);

    const products = await Product.findAll({
      where: { categoryId: category.id, storeId },
      include: [{ model: Category, as: "category" }],
    });
    res.status(200).json({ message: "products retrieved", products });
  } catch (error) {
    console.error("🔥 Error:", error);
    res.status(500).json({ message: error.message });
  }
};

//view product by store
const viewProductByStore = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const product = await Product.findAll({
      where: { storeId },
      order: [["name", "ASC"]],
    });
    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addProduct,
  viewProduct,
  editProduct,
  viewAllProduct,
  viewByCategory,
  viewProductByBarCode,
  viewProductByName,
  viewProductByNameLike,
  viewAllProductUser,
  viewProductByStore,
  deleteProduct,
};
