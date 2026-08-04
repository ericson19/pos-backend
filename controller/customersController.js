const Customer = require("../models/customersModel");
const Sale = require("../models/salesModel");
const mailTransporter = require("../config/mailConfig");
const { userMail } = require("../mails/mailTemplate");

//crrate a new customer
exports.createCustomer = async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    const checkExisting = await Customer.findOne({ where: { phone } });
    if (checkExisting) {
      return res
        .status(400)
        .json({ message: "Customer with this phone nu already exists" });
    }
    const newCustomer = await Customer.create({
      name,
      email,
      phone,
      address,
    });
    res.status(201).json({
      message: "Customer created successfully",
      customer: newCustomer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.status(200).json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//get customer by id
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const [customer] = await Customer.update(
      { name, email, phone, address },
      { where: { id } },
    );
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res
      .status(200)
      .json({ message: "Customer updated successfully", customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const salesRecords = await Sale.findOne({ where: { customerId: id } });
    if (salesRecords) {
      return res.status(500).json({
        message: "Cannot delete customer that have made sales records.",
      });
    }
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await customer.destroy();
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//send email to customer
exports.sendEmailToCustomer = async (req, res) => {
  try {
    const { subject, message, email, name } = req.body;
    // Implement email sending logic here using a library like nodemailer
    console.log("Email sent to:", email);
    console.log("Subject:", subject);
    console.log("Message:", message);
    console.log("Name:", name);
    await mailTransporter(
      email,
      subject,
      userMail(subject, message, name === "" ? "Customer" : name),
    );
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
