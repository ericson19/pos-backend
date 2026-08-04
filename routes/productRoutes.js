const express = require("express");
const {
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
} = require("../controller/productController");
const {
  addCategory,
  viewCategory,
  deleteCategory,
} = require("../controller/categoryController");
const { protect, permission } = require("../middleware/authMiddleware");
const upload = require("../config/uploadConfig");
const router = express.Router();

router.post(
  "/add-product",
  protect,
  upload.single("image"),
  permission("add"),
  addProduct,
);
router.get("/view-product/:id", protect, viewProduct);
router.put("/update-product/:id", protect, permission("edit"), editProduct);
router.get("/viewByBarcode/:barCode", protect, viewProductByBarCode);
router.get("/viewByName/", protect, viewProductByName);
router.get("/viewByNameLike/:name", protect, viewProductByNameLike);
router.get("/viewAll-product", protect, viewAllProduct);
router.get("/viewAll-product-user", protect, viewAllProductUser);
router.get("/viewby-category/:id", protect, viewByCategory);

//category routes
router.post("/add-category", protect, permission("add"), addCategory);
router.get("/view-category", protect, viewCategory);
router.delete(
  "/delete-category/:categoryId",
  protect,
  permission("add"),
  deleteCategory,
);

//view product by store
router.get("/viewbystore/product", protect, viewProductByStore);

//delete product
router.delete("/delete-product/:id", protect, permission("add"), deleteProduct);

module.exports = router;
