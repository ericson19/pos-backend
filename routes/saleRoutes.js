const express = require("express");
const {
  createSale,
  getSaleById,
  getAllSales,
  getSalesByUser,
  getSalesByDateRange,
  getSalesByCustomerName,
  getSalesBySellerAndDateRange,
  getClientPaymentInfo,
  getSalesByPaymentStatus,
  getSalesItemsByInvoice,
} = require("../controller/salesController");
const { protect, permission } = require("../middleware/authMiddleware");
const router = express.Router();

// Route to create a new sale
router.post("/create-sale", protect, permission("sales"), createSale);
//Route to get a sale by ID
router.get("/sale/:id", protect, getSaleById);
// Route to get all sales
router.get("/sales", protect, getAllSales);
// Route to get sales by user
router.get("/user/:userId", protect, getSalesByUser);
// Route to get sales by date range
router.get("/date-range", protect, getSalesByDateRange);
// Route to get sales by customer name
router.get("/customer-name/:customerId", protect, getSalesByCustomerName);
// Route to get sales by seller and date range
router.get("/seller-date-range", protect, getSalesBySellerAndDateRange);

// Route to get sales by payment status
router.get("/payment-status", protect, getSalesByPaymentStatus);

// Route to get client payment info
router.post("/clientInfo", protect, permission("sales"), getClientPaymentInfo);

// Route to get sales items by invoice number
router.get("/sale-items/:invoiceNumber", protect, getSalesItemsByInvoice);

module.exports = router;
