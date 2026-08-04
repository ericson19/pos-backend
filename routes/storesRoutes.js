const express = require("express");
const {
  createStore,
  getAllStores,
  deleteStore,
} = require("../controller/storeController");
const { protect, permission } = require("../middleware/authMiddleware");
const router = express.Router();

// Route to create a new store
router.post("/create-store", protect, permission("manage"), createStore);

// Route to get all stores
router.get("/stores", getAllStores);

// Route to delete a store
router.delete(
  "/delete-store/:storeId",
  protect,
  permission("manage"),
  deleteStore,
);

module.exports = router;
