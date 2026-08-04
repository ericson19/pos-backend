const Store = require("../models/storesModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");

const createStore = async (req, res) => {
  const { name, location } = req.body;
  try {
    const newStore = await Store.create({
      name,
      location,
    });
    res.status(201).json({
      message: "Store created successfully",
      store: newStore,
    });
  } catch (error) {
    res.status(501).json({
      message: error.errors ? error.errors[0].message : error.message,
    });
  }
};
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll();
    res.status(200).json({
      message: "Stores retrieved successfully",
      stores,
    });
  } catch (error) {
    res.status(501).json({
      message: error.errors ? error.errors[0].message : error.message,
    });
  }
};
const deleteStore = async (req, res) => {
  const { storeId } = req.params;
  try {
    const checkUser = await User.findOne({
      where: { storeId: storeId },
    });
    if (checkUser) {
      return res
        .status(500)
        .json({ message: "Cannot delete store that have users." });
    }
    const checkProduct = await Product.findOne({
      where: { storeId: storeId },
    });
    if (checkProduct) {
      return res
        .status(500)
        .json({ message: "Cannot delete store that have products." });
    }
    await Store.destroy({
      where: { id: storeId },
    });
    res.status(200).json({
      message: "Store deleted successfully",
    });
  } catch (error) {
    res.status(501).json({ message: error.errors });
  }
};

module.exports = { createStore, getAllStores, deleteStore };
