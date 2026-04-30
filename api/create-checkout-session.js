const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lessonType, selectedDate, selectedTime, userId } = req.body;

    if (!lessonType || !selectedDate || !selectedTime || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const lessonMinutes = Number(lessonType);

    if (![25, 50].includes(lessonMinutes)) {
      return res.status(400).json({ error: "Invalid lesson type" });
    }

    const priceRes = await fetch(
      `${GAS_WEB_APP_URL}?action=getUserPrice&userId=${encodeURIComponent(userId)}&lessonType=${lessonMinutes}`
    );

    const priceJson = await priceRes.json();

    if (!priceJson.ok || !priceJson.price) {
      return res.status(400).json({ error: "Price not found" });
    }

    const unitAmount = Number(priceJson.price) * 100;

    const priceData = {
      currency: "usd",
      product_data: {
        name: `${lessonMinutes}分レッスン`
      },
      unit_amount: unitAmount
    };

    const baseUrl = "https://ami-app-eta.vercel.app";

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
        selectedTime,
        userId,
        price: String(priceJson.price)
      },
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html`
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
};
