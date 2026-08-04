const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/settings/");
  },
  filename: (req, file, cb) => {
    const uploadName = file.fieldname;
    const ext = path.extname(file.originalname);
    cb(null, `${uploadName}${ext}`);
  },
});
const filter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg") {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed (png, jpg, jpeg)"), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: filter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
