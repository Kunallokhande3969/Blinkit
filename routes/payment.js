// payment.js
require("dotenv").config();
const { paymentModel } = require("../models/payment");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const express = require("express");
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order API
router.post("/create/orderId", async (req, res) => {
  const { totalAmount } = req.body; // Dynamically pass totalAmount from frontend

  const options = {
    amount: totalAmount * 100, // amount in smallest currency unit (paisa)
    currency: "INR",
  };

  try {
    const order = await razorpay.orders.create(options);
    res.send(order);

    // Save order details in the database
    const newPayment = await paymentModel.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "pending",
    });
  } catch (error) {
    res.status(500).send("Error creating order");
  }
});

// Verify Payment API
router.post("/api/payment/verify", async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    // Manually verify the signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature === signature) {
      const payment = await paymentModel.findOne({
        orderId: razorpayOrderId,
        status: "pending",
      });

      payment.paymentId = razorpayPaymentId;
      payment.signature = signature;
      payment.status = "completed";
      await payment.save();

      res.json({ status: "success" });
    } else {
      res.status(400).send("Invalid signature");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Error verifying payment");
  }
});

module.exports = router;
