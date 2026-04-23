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
    let priceLabel = "";

    if (lessonType === 25) {
      unitAmount = 1000; // $10.00
      lessonLabel = "25分レッスン";
      priceLabel = "$10";
    } else if (lessonType === 50) {
      unitAmount = 1800; // $18.00
      lessonLabel = "50分レッスン";
      priceLabel = "$18";
    } else {
      return res.status(400).json({ error: "Invalid lesson type" });
    }

    const origin = req.headers.origin || "https://ami-app-eta.vercel.app";

    // 先にスプレッドシートへ仮保存
    await fetch("https://script.google.com/macros/s/AKfycbzRX0UZSwDW3h9V7tUGA1grjhNlfU9e60H4hGzABbAJl0cWn40VFwy4D2mY-vgEvSY/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "LINEユーザー",
        date: selectedDate,
        time: selectedTime,
        lesson: lessonLabel,
        price: priceLabel,
        email: "",
        status: "決済前"
      })
    });

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
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
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
