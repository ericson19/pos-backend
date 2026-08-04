const express = require("express");
const router = express.Router();
const {
  getAllCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  sendEmailToCustomer,
} = require("../controller/customersController");
const { protect, permission } = require("../middleware//authMiddleware");

// Route to get all customers
router.get("/customers", protect, getAllCustomers);

// Route to create a new customer
router.post("/add-customer", protect, permission("sales"), createCustomer);

// Route to get a customer by ID
router.get(
  "/get-By-customers/:id",
  protect,
  permission("sales"),
  getCustomerById,
);

// Route to update a customer by ID
router.put(
  "/update-customers/:id",
  protect,
  permission("sales"),
  updateCustomer,
);

// Route to delete a customer by ID
router.delete(
  "/delete-customers/:id",
  protect,
  permission("sales"),
  deleteCustomer,
);

// Route to send email to a customer
router.post("/send-email", protect, permission("sales"), sendEmailToCustomer);

module.exports = router;
