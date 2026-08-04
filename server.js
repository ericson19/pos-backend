const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const jwt = require("jsonwebtoken");
const path = require("path");

dotenv.config();

const { sequelize } = require("./models/userPermission");

//Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const saleRoutes = require("./routes/saleRoutes");
const reportRoutes = require("./routes/reportRoutes");
const clientPayment = require("./routes/publicRoutes");
const Store = require("./routes/storesRoutes");
const supplier = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const returnRoutes = require("./routes/returnRoutes");
const Stock = require("./routes/stockRoutes");
const resetPasswordRoutes = require("./routes/resetPasswordRoutes");
const Setting = require("./routes/settingRoutes");
const customersRoutes = require("./routes/customersRoutes");

// Cron job for OTP cleanup
const otpCleanup = require("./cron/otpCleanup");

const app = express();

//test DB connection and sync
try {
  sequelize.sync();
  console.log("All models were synchronized successfully.");
} catch (error) {
  console.error("Unable to synchronize the models:", error);
}

// Schedule OTP cleanup every hour
cron.schedule("0 0 * * *", otpCleanup);

// expose my API to frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // frontend URL
    credentials: true, // Allow cookies to be sent
  }),
);

// Body parser middleware
app.use(express.json());

// Cookie parser middleware
app.use(cookieParser());

//Expose FIles to public
app.use("/uploads", express.static("uploads"));

//Routes middleware
app.use("/users", userRoutes);
app.use("/product", productRoutes);
app.use("/sales", saleRoutes);
app.use("/report", reportRoutes);
app.use("/client", clientPayment);
app.use(Store);
app.use("/supplier", supplier);
app.use("/purchase", purchaseRoutes);
app.use("/return", returnRoutes);
app.use("/stock", Stock);
app.use("/password", resetPasswordRoutes);
app.use("/customers", customersRoutes);
app.use("/settings", Setting);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

//serve React frontend
app.use(express.static(path.join(__dirname, "../pos-frontend/dist")));

// Handle all other routes and serve the React frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../pos-frontend/dist", "index.html"));
});
// Test route
app.use("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
