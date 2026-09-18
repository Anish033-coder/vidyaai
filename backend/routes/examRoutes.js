import express from "express";
import { evaluateTypedAnswers } from "../controllers/examController.js";

const router = express.Router();

router.post("/evaluate", evaluateTypedAnswers);

export default router;