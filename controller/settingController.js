const Setting = require("../models/settingModel");
const { deleteFileIfExists } = require("../utils/helpers");

// create settings
const createSettings = async (req, res) => {
  try {
    const {
      siteName,
      siteUrl,
      currency,
      taxRate,
      bankName,
      bankAccountNumber,
      bankAccountName,
      discountRate,
      address,
      city,
      country,
      email,
      phone,
      emailHost,
      emailPort,
      emailUsername,
      emailPassword,
    } = req.body;
    const newSetting = await Setting.create({
      siteName,
      siteUrl,
      logo: req.files["logo"][0].path,
      siteFavicon: req.files["favicon"][0].path,
      frontPicture: req.files["frontPic"][0].path,
      currency,
      taxRate,
      bankName,
      bankAccountNumber,
      bankAccountName,
      discountRate,
      address,
      city,
      country,
      email,
      phone,
      emailHost: emailHost,
      emailPort: emailPort,
      emailUsername: emailUsername,
      emailPassword: emailPassword,
    });
    res
      .status(201)
      .json({ message: "Settings created successfully", newSetting });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//update settings
const updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      "siteName",
      "siteUrl",

      "currency",
      "taxRate",
      "bankName",
      "bankAccountNumber",
      "bankAccountName",
      "discountRate",
      "address",
      "city",
      "country",
      "email",
      "phone",
      "emailHost",
      "emailPort",
      "emailUsername",
      "emailPassword",
    ];
    const data = {};
    allowedFields.forEach((field) => {
      if (
        req.body[field] !== undefined &&
        req.body[field] !== null &&
        req.body[field] !== ""
      ) {
        data[field] = req.body[field];
      }
    });
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    console.log("Request Files:", req.files);
    if (req.files) {
      if (req.files["logo"]) {
        deleteFileIfExists(settings.logo);
        data.logo = req.files["logo"][0].path;
      }
      if (req.files["favicon"]) {
        deleteFileIfExists(settings.siteFavicon);
        data.siteFavicon = req.files["favicon"][0].path;
      }
      if (req.files["frontPic"]) {
        deleteFileIfExists(settings.frontPicture);
        data.frontPicture = req.files["frontPic"][0].path;
      }
    }
    console.log(data);
    await settings.update(data);
    res
      .status(200)
      .json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//Get settings
const getSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// export the createSettings function
module.exports = {
  createSettings,
  updateSettings,
  getSettings,
};
