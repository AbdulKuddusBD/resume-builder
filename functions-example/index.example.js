/**
 * Example only. Not deployed by default.
 * Keep API keys on the server side. Never expose them in frontend JavaScript.
 */

const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

exports.resumeAi = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { task, resume } = req.body || {};
    if (!task || !resume) return res.status(400).json({ error: "Missing task or resume" });

    // Replace this demo response with OpenAI/Gemini call using a server-side secret.
    return res.json({
      summary: `Results-driven ${resume.targetTitle || resume.jobTitle || "professional"} with strong experience and measurable achievements.`
    });
  });
});
