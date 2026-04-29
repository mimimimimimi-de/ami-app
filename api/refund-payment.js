const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "No paymentIntentId" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.balance_transaction"]
    });

    const charge = paymentIntent.latest_charge;

    if (!charge) {
      return res.status(400).json({ error: "No charge found" });
    }

    const chargeAmount = charge.amount; // 例：$10.00 → 1000
    const chargeCurrency = charge.currency; // 例：usd

    const balanceTransaction = charge.balance_transaction;

    if (!balanceTransaction) {
      return res.status(400).json({ error: "No balance transaction found" });
    }

    const stripeFee = balanceTransaction.fee; // Stripe手数料
    const balanceAmount = balanceTransaction.amount; // Stripe側の処理金額
    const balanceCurrency = balanceTransaction.currency;

    let estimatedFeeInChargeCurrency;

    // 決済通貨と残高通貨が同じ場合
    if (chargeCurrency === balanceCurrency) {
      estimatedFeeInChargeCurrency = stripeFee;
    } else {
      // USD決済 → JPY入金のように通貨が違う場合
      // 残高側の手数料比率から、決済通貨側の手数料相当額を推定
      estimatedFeeInChargeCurrency = Math.ceil(
        chargeAmount * (stripeFee / balanceAmount)
      );
    }

    let refundAmount = chargeAmount - estimatedFeeInChargeCurrency;

    // 念のため安全処理
    if (refundAmount < 0) {
      refundAmount = 0;
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount
    });

    return res.status(200).json({
      success: true,
      refundAmount,
      chargeAmount,
      estimatedFeeInChargeCurrency,
      refund
    });

  } catch (error) {
    console.error("Refund failed:", error);
    return res.status(500).json({
      error: "Refund failed",
      message: error.message
    });
  }
};
