const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "No session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    return res.status(200).json({
      payment_intent: session.payment_intent
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get session" });
  }
};
