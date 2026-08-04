const express = require("express");
const {
  processReturn,
  getAllReturns,
} = require("../controller/returnPurchaseController");
const { protect, permission } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/return", protect, permission("purchase"), processReturn);
router.get("/returns", protect, permission("purchase"), getAllReturns);

module.exports = router;
