import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { level, taskType, question, passage, email, essay, wordCount } = req.body;

    if (!essay || essay.trim().length === 0) {
      return res.status(400).json({ error: "Essay is required" });
    }

    const prompt = `
あなたは日本の高校生を指導する英語教師です。
英検ライティングの答案を、やさしく具体的に添削してください。

【級】
${level}

【形式】
${taskType}

【問題】
${question || ""}

【本文・Eメール】
${passage || email || ""}

【生徒の解答】
${essay}

【語数】
${wordCount} words

以下のJSON形式だけで返してください。

{
  "score": {
    "content": 0,
    "organization": 0,
    "vocabulary": 0,
    "grammar": 0,
    "total": 0
  },
  "overallComment": "日本語で総評",
  "goodPoints": ["良い点1", "良い点2"],
  "improvementPoints": ["改善点1", "改善点2"],
  "grammarCorrections": [
    {
      "original": "元の表現",
      "corrected": "修正例",
      "explanation": "日本語で説明"
    }
  ],
  "improvedAnswer": "改善後の英文例",
  "nextAdvice": "次回へのアドバイス"
}

採点は、意見論述・要約は16点満点、Eメールは9点満点を意識してください。
厳しすぎず、授業で使える実用的なコメントにしてください。
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt
    });

    const text = response.output_text;

    let feedback;
    try {
      feedback = JSON.parse(text);
    } catch {
      feedback = {
        overallComment: text,
        goodPoints: [],
        improvementPoints: [],
        grammarCorrections: [],
        improvedAnswer: "",
        nextAdvice: ""
      };
    }

    return res.status(200).json({ feedback });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "AI feedback failed",
      detail: error.message
    });
  }
}
