import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing",
        detail: "VercelのEnvironment VariablesにGEMINI_API_KEYが設定されていません。"
      });
    }

    const {
      level,
      taskType,
      question,
      passage,
      email,
      essay,
      wordCount
    } = req.body;

    if (!essay || essay.trim().length === 0) {
      return res.status(400).json({
        error: "Essay is required",
        detail: "英作文が入力されていません。"
      });
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
Markdownや説明文は不要です。

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

採点基準：
- 意見論述と要約は16点満点を意識する
- Eメールは9点満点を意識する
- 厳しすぎず、授業で使える実用的なコメントにする
- 文法修正は最大3つまで
- 生徒が次に何を直せばよいか分かるようにする
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    let text = response.text || "";

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let feedback;

    try {
      feedback = JSON.parse(text);
    } catch {
      feedback = {
        score: null,
        overallComment: text || "Geminiからの応答を解析できませんでした。",
        goodPoints: [],
        improvementPoints: [],
        grammarCorrections: [],
        improvedAnswer: "",
        nextAdvice: ""
      };
    }

    return res.status(200).json({
      feedback
    });
  } catch (error) {
    console.error("Gemini feedback error:", error);

    return res.status(500).json({
      error: "Gemini feedback failed",
      detail: error.message
    });
  }
}
