const express = require("express");
const {
  updateStockAlertLevel,
  recordDamagedGoods,
  adjustStock,
  transferStock,
  viewStockFlowHistory,
  getLowStockAlerts,
} = require("../controller/stockController");
const { protect, permission } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/adjust-Stock", protect, permission("manage"), adjustStock);
router.post("/transfer-Stock", protect, permission("manage"), transferStock);
router.post(
  "/Damaged-Goods",
  protect,
  permission("manage"),
  recordDamagedGoods,
);
router.get(
  "/Stock-Flow-History",
  protect,
  permission("manage"),
  viewStockFlowHistory,
);
router.get(
  "/Low-Stock-Alerts/:storeId",
  protect,
  permission("manage"),
  getLowStockAlerts,
);
router.put(
  "/update-Stock-Alert-Level/:productId",
  protect,
  permission("manage"),
  updateStockAlertLevel,
);

module.exports = router;
