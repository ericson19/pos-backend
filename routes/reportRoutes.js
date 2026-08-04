const express = require("express");

const {
  dateRangeReport,
  sellerDate,
  salesSummaryBySeller,
  productReport,
  inventoryReport,
  productInventoryReport,
  productAndDateInventoryReport,
  summaryInventoryReport,
  auditSummary,
  auditSummaryUser,
  auditSummaryDate,
  auditSummaryUserAndDate,
  stockMovementReport,
  viewLowStockAlerts,
  damagedProductsReport,
} = require("../controller/reportController");
const { protect, permission } = require("../middleware/authMiddleware");
const router = express.Router();

// Route to get sales report by date range
router.get("/dateRange", protect, permission("report"), dateRangeReport);

// Route to get sales summary report
router.get("/sellerDate", protect, permission("report"), sellerDate);

// Route to get sales summary by seller
router.get(
  "/sellerSummary/:id",
  protect,
  permission("report"),
  salesSummaryBySeller,
);

// Route to get product report
router.get("/product-report", protect, permission("report"), productReport);

// Route to get inventory report
router.get("/inventory-report", protect, inventoryReport);

// Route to get product inventory report
router.get(
  "/product-inventory-report/:productId",
  protect,
  productInventoryReport,
);
// Route to get product and date range inventory report
router.get(
  "/product-date-inventory-report/:productId",
  protect,
  productAndDateInventoryReport,
);
// Route to get summary inventory report
router.get("/inventory-summary", protect, summaryInventoryReport);

// Route to get audit summary report
router.get("/audit-summary", protect, permission("report"), auditSummary);

// get summary by user and date (place before :userId to avoid route clash)
router.get(
  "/audit-summaries-by-user-and-date",
  protect,
  permission("report"),
  auditSummaryUserAndDate,
);

// get summary by date
router.get("/audit-summaries", protect, permission("report"), auditSummaryDate);

// get summary by user
router.get(
  "/audit-summaries/:userId",
  protect,
  permission("report"),
  auditSummaryUser,
);

// Route to get stock movement report
router.get(
  "/stock-movement-report/:actionType",
  protect,
  permission("report"),
  stockMovementReport,
);

// Route to view low stock alerts
router.get("/low-stocks", protect, permission("report"), viewLowStockAlerts);

// Route to get damaged products report
router.get("/damages", protect, permission("report"), damagedProductsReport);

module.exports = router;
