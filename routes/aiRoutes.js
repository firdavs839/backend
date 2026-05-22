import express from "express";
import { askMathAI } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", askMathAI);

export default router;