const Razorpay = require("razorpay");
const crypto = require("crypto");

const createOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_SECRET || !process.env.RAZORPAY_KEY_ID) {
      throw new Error(`Razorpay secret | Razorpay key not specified`);
    }

    const razor = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const amount = 15000;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_order_74394",
    };

    const order = await razor.orders.create(options);

    if (!order) throw new Error(`Order not created`);

    return res.json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Internal server error" });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    // getting the details back from our font-end
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);

    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);

    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature)
      return res.status(400).json({ msg: "Transaction not legit!" });

    // Save to DB

    return res.json({
      success: true,
      msg: "payment verified successfully | plan will be activated sooner",
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error });
  }
};

module.exports = { checkPaymentStatus, createOrder };
