const express = require("express");
const {
  createSettings,
  updateSettings,
  getSettings,
} = require("../controller/settingController");
const {
  protect,
  permission,
  adminOnly,
} = require("../middleware/authMiddleware");
const upload = require("../config/settingsConfig");
const router = express.Router();

//later change to permission to settings
const uploadFields = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "favicon", maxCount: 1 },
  { name: "frontPic", maxCount: 1 },
]);

router.post("/settings", adminOnly, uploadFields, createSettings);
router.put(
  "/update-settings",
  protect,
  adminOnly,
  uploadFields,
  updateSettings,
);
router.get("/fetch-settings", getSettings);
module.exports = router;
