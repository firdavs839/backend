import { Router } from "express";
import { buildQuestion } from "../utils/builder.js";

const router = Router();

function parseParams(source) {
  const count = Math.min(20, Math.max(1, Number(source.count) || 5));
  const difficulty = ["easy", "medium", "hard"].includes(source.difficulty)
    ? source.difficulty
    : "easy";
  return { count, difficulty };
}

router.get("/", (req, res) => {
  const { count, difficulty } = parseParams(req.query);
  res.json({ questions: Array.from({ length: count }, () => buildQuestion(difficulty)) });
});

router.post("/", (req, res) => {
  const { count, difficulty } = parseParams(req.body);
  res.json({ questions: Array.from({ length: count }, () => buildQuestion(difficulty)) });
});

export default router;
