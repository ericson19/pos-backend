const Supplier = require("../models/supplierModel");
const Purchase = require("../models/purchaseModel");

// Create a new supplier
exports.createSupplier = async (req, res) => {
  try {
    const { name, contactInfo, address, storeId } = req.body;
    const newSupplier = await Supplier.create({
      name,
      contactInfo,
      address,
      storeId,
    });
    res.status(201).json({
      message: "Supplier created successfully",
      supplier: newSupplier,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();
    res.status(200).json({ suppliers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Get a supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;
    const supplier = await Supplier.findOne({ where: { id, storeId } });
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.status(200).json({ supplier });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactInfo, address } = req.body;
    const [updated] = await Supplier.update(
      { name, contactInfo, address },
      { where: { id } },
    );
    if (updated) {
      const updatedSupplier = await Supplier.findByPk(id);
      return res
        .status(200)
        .json({ message: "Supplier updated", supplier: updatedSupplier });
    }
    res.status(404).json({ message: "Supplier not found" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const purchases = await Purchase.findOne({ where: { supplierId: id } });
    if (purchases) {
      return res
        .status(500)
        .json({ message: "Cannot delete supplier with associated purchases" });
    }
    const deleted = await Supplier.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.status(200).json({ message: "Supplier deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
