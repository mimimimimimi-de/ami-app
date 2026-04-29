const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lessonType, selectedDate, selectedTime } = req.body;

    if (!lessonType || !selectedDate || !selectedTime) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const lessonMinutes = Number(lessonType);

    let priceData;

    if (lessonMinutes === 25) {
      priceData = {
        currency: "usd",
        product_data: {
          name: "25分レッスン"
        },
        unit_amount: 1000
      };
    } else if (lessonMinutes === 50) {
      priceData = {
        currency: "usd",
        product_data: {
          name: "50分レッスン"
        },
        unit_amount: 1800
      };
    } else {
      return res.status(400).json({
        error: "Invalid lesson type"
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: priceData,
          quantity: 1
        }
      ],
      metadata: {
        lessonType: String(lessonMinutes),
        selectedDate,
        selectedTime
      },
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html`
    });

    return res.status(200).json({
      url: session.url
    });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return res.status(500).json({
      error: "Failed to create checkout session"
    });
  }
};
