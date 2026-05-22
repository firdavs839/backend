const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `Sen matematik va fanlar viktorinasi yaratuvchi yordamchisisisan.
Foydalanuvchi so'roviga qarab, aniq JSON formatida savol-javoblar to'plami yarat.
Faqat quyidagi JSON formatida javob ber (hech qanday izoh yoki qo'shimcha matn qo'shma):
{
  "title": "Viktorina nomi",
  "problems": [
    {
      "id": 1,
      "expression": "Savol matni yoki matematik ifoda",
      "options": ["variant A", "variant B", "variant C", "variant D"],
      "correct": 0,
      "time_limit": 20
    }
  ]
}
Qoidalar:
- "correct" = to'g'ri javobning "options" massividagi indeksi (0-3).
- Aniq 5 ta savol yarat.
- "time_limit" soniyalarda (10-60 oralig'ida).
- Variantlar orasida faqat bitta to'g'ri javob bo'lsin.
- Savollar mos darajada qiyin bo'lsin.`;

export const askMathAI = async (req, res) => {
  const { message } = req.body ?? {};

  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: "Mavzu kiritilmagan." });
  }

  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({
      success: false,
      message: "ANTHROPIC_API_KEY sozlanmagan. backend/.env fayliga qo'shing.",
    });
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API xatosi:", response.status, err);
      return res.status(502).json({ success: false, message: "AI javob bermadi." });
    }

    const data = await response.json();
    const raw  = data?.content?.[0]?.text ?? "";

    if (!raw) {
      return res.status(502).json({ success: false, message: "AI bo'sh javob qaytardi." });
    }

    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let quizData;
    try {
      quizData = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        success: false,
        message: "AI to'g'ri JSON qaytarmadi. Qayta urinib ko'ring.",
        raw,
      });
    }

    if (!quizData.title || !Array.isArray(quizData.problems) || quizData.problems.length === 0) {
      return res.status(500).json({
        success: false,
        message: "AI noto'g'ri format qaytardi. Qayta urinib ko'ring.",
      });
    }

    return res.json({ success: true, answer: JSON.stringify(quizData) });
  } catch (error) {
    console.error("AI Error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "AI server xatosi. Biroz kutib qayta urinib ko'ring.",
    });
  }
};
