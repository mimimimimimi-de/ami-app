const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    return res.status(200).json({
      payment_intent: session.payment_intent || "",
      metadata: session.metadata || {}
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to retrieve session" });
  }
};
