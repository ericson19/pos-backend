const express = require("express");
const {
  purchaseItem,
  updatePayment,
  getPurchaseByInvoice,
  getPurchasesBySupplierAndDate,
  getAllPurchases,
  getPurchasesByDateRange,
  getPurchasesByReceivedByAndDate,
  getPaymentMethods,
} = require("../controller/purchaseController");
// const { returnPurchase } = require("../controller/returnPurchase");
const { protect, permission } = require("../middleware/authMiddleware");
const router = express.Router();

//purchase routes
router.post("/purchaseItem", protect, permission("purchase"), purchaseItem);
router.put(
  "/updatePayment/:invoice",
  protect,
  permission("purchase"),
  updatePayment
);

router.get("/return", protect, permission("purchase"), getPurchaseByInvoice);

//get purchases by supplier and date range
router.get(
  "/supplier/:supplierId",
  protect,
  permission("report"),
  getPurchasesBySupplierAndDate
);

//get all purchases
router.get("/allPurchases", protect, permission("report"), getAllPurchases);

//get purchases by date range
router.get(
  "/dateRange",
  protect,
  permission("report"),
  getPurchasesByDateRange
);

//get purchases by received by and date
router.get(
  "/receivedBy/:userId",
  protect,
  permission("report"),
  getPurchasesByReceivedByAndDate
);
//get payment methods
router.get("/paymentMethods", protect, getPaymentMethods);

module.exports = router;
