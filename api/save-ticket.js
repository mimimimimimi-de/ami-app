const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, name, lesson, count, paymentIntentId } = req.body;

    if (!userId || !lesson || !count) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const gasRes = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "purchaseTicket",
        userId,
        name,
        lesson,
        count: Number(count),
        paymentIntentId: paymentIntentId || ""
      })
    });

    const gasText = await gasRes.text();

    let gasData;
    try {
      gasData = JSON.parse(gasText);
    } catch (e) {
      return res.status(500).json({ error: "GAS response parse error", raw: gasText });
    }

    if (!gasData.ok) {
      return res.status(500).json({ error: gasData.message || "GAS error" });
    }

    return res.status(200).json({ ok: true, ticketId: gasData.ticketId });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save ticket" });
  }
};
