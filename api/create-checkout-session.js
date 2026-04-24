const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lessonType, selectedDate, selectedTime } = req.body;

    let unitAmount = 0;
    let lessonLabel = "";

    if (lessonType == 25) {
      unitAmount = 1000; // $10
      lessonLabel = "25分レッスン";
    } else if (lessonType == 50) {
      unitAmount = 1800; // $18
      lessonLabel = "50分レッスン";
    } else {
      return res.status(400).json({ error: "Invalid lesson type" });
    }

    const origin = req.headers.origin || "https://ami-app-eta.vercel.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: lessonLabel,
              description: `日付: ${selectedDate} / 時間: ${selectedTime}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/success.html`,
      cancel_url: `${origin}/cancel.html`,
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to create checkout session",
      message: error.message
    });
  }
};
