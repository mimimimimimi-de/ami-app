const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "No paymentIntentId" });
    }

    await stripe.refunds.create({
      payment_intent: paymentIntentId
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Refund failed" });
  }
};
