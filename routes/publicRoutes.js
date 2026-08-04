const express = require("express");
const router = express.Router();
const {
  viewAllProduct,
  viewByCategory,
  viewProduct,
} = require("../controller/productController");
const { makePayment } = require("../controller/publicController");
const { regClient } = require("../controller/userController");
const { protect } = require("../middleware/authMiddleware");

// public route to get all products
router.get("/products", protect, viewAllProduct);

// public route to get products by category
router.get("/products/category/:id", protect, viewByCategory);

// public route to get a single product by id
router.get("/products/:id", protect, viewProduct);

// public route to make a payment
router.post("/make-payment", protect, makePayment);

// public route to register a client
router.post("/register-client", regClient);

module.exports = router;
