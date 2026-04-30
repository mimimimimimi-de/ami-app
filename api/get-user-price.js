const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;

module.exports = async function handler(req, res) {
  try {
    const { userId, lessonType } = req.query;

    if (!userId || !lessonType) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const url =
      `${GAS_WEB_APP_URL}?action=getUserPrice` +
      `&userId=${encodeURIComponent(userId)}` +
      `&lessonType=${encodeURIComponent(lessonType)}`;

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error("get-user-price error:", error);
    return res.status(500).json({ ok: false, error: "Failed to get user price" });
  }
};
