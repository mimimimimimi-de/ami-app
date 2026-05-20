const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, lessonType, count, lang } = req.body;

    if (!userId || !lessonType || !count) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const lessonMinutes = Number(lessonType);
    const lessonCount = Number(count);

    if (lessonCount < 2) {
      return res.status(400).json({ error: "最低2回から購入できます" });
    }

    // 単価を取得
    const priceRes = await fetch(
      `${GAS_WEB_APP_URL}?action=getUserPrice&userId=${encodeURIComponent(userId)}&lessonType=${lessonMinutes}`
    );
    const priceJson = await priceRes.json();

    if (!priceJson.ok || !priceJson.price) {
      return res.status(400).json({ error: "Price not found" });
    }

    const unitPrice = Number(priceJson.price);
    const totalPrice = unitPrice * lessonCount;
    const unitAmount = totalPrice * 100;

    const lessonLabel = lessonMinutes === 50 ? "50分レッスン" : "25分レッスン";
    const langParam = lang && lang !== "ja" ? `&lang=${encodeURIComponent(lang)}` : "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${lessonLabel} × ${lessonCount}回券`,
              description: `有効期限：購入から3ヶ月 / 返金不可`
            },
            unit_amount: unitAmount
          },
          quantity: 1
        }
      ],
      metadata: {
        type: "ticket",
        userId,
        lessonType: String(lessonMinutes),
        count: String(lessonCount),
        unitPrice: String(unitPrice),
        totalPrice: String(totalPrice)
      },
      success_url: `https://ami-app-eta.vercel.app/success-ticket.html?session_id={CHECKOUT_SESSION_ID}${langParam}`,
      cancel_url: `https://ami-app-eta.vercel.app/ticket.html`
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create ticket session" });
  }
};
