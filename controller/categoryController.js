const category = require("../models/categoryModel");
const Product = require("../models/productModel");

const addCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    const existingCategory = await category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ message: "category already exists" });
    }
    const newCategory = await category.create({ name, description });
    if (newCategory) {
      res
        .status(201)
        .json({ message: "category created successfully", newCategory });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const viewCategory = async (req, res) => {
  try {
    const categories = await category.findAll({
      order: [["name", "ASC"]],
    });
    res.status(201).json({ message: "categories fetched", categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const checkProduct = await Product.findOne({
      where: { categoryId: categoryId },
    });
    if (checkProduct) {
      return res
        .status(500)
        .json({ message: "Cannot delete category that have products." });
    }
    await category.destroy({ where: { id: categoryId } });
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
module.exports = { addCategory, viewCategory, deleteCategory };
