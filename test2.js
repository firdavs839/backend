import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config();

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function testAPI() {
  try {
    const completion = await openrouter.chat.send({
      chatRequest: {
        model: "inclusionai/ring-2.6-1t:free",
        messages: [
          {
            role: "system",
            content: `You are a math assistant. Solve problems and generate quizzes in JSON format when requested.`,
          },
          {
            role: "user",
            content: "\nGenerate 10 math quiz questions about Algebra.\n\nReturn ONLY JSON.\n\nFormat:\n{\n  \"title\": \"Quiz title\",\n  \"questions\": [\n    {\n      \"question\": \"\",\n      \"options\": [\"\", \"\", \"\", \"\"],\n      \"correct_index\": 0\n    }\n  ]\n}\n",
          },
        ],
      },
    });

    console.log("Success:", completion.choices[0].message.content);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

testAPI();