require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Groq = require("groq-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
app.post("/generate-quiz", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const difficulty = req.body.difficulty || "medium";
    const syllabusText = req.file.buffer.toString();

    const prompt = `
Generate 10 ${difficulty} level multiple choice questions 
from this syllabus:

${syllabusText}

Return ONLY valid JSON in this format:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "one of the options exactly"
  }
]
Only JSON. No explanation.
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;

    // Extract JSON safely
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(500).json({ error: "AI did not return valid JSON" });
    }

    const jsonString = text.slice(jsonStart, jsonEnd);
    const questions = JSON.parse(jsonString);

    res.json(questions);

  } catch (error) {
    console.error("GROQ ERROR:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});