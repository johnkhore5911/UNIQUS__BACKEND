const express = require("express");
const {
  createOrder,
  checkPaymentStatus,
} = require("../controllers/paymentController");

const router = express.Router();

// payment
router.route("/payment/create-order").post(createOrder);
router.route("/payment/check-status").post(checkPaymentStatus);

module.exports = router;
