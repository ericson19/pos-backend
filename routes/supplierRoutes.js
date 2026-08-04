const express = require("express");
const {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require("../controller/supplierController");
const { protect, permission } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/reg-supplier", protect, permission("suppliers"), createSupplier);
router.get("/suppliers", protect, getAllSuppliers);
router.get("/supplier/:id", protect, getSupplierById);
router.put("/supplier/:id", protect, permission("suppliers"), updateSupplier);
router.delete(
  "/delete-supplier/:id",
  protect,
  permission("suppliers"),
  deleteSupplier,
);

module.exports = router;
