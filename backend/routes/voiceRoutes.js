
const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const Expense = require("../models/Expense");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const categories = [
    "Food",
    "Drinks",
    "Travel",
    "Shopping",
    "Health",
    "Education",
    "Other",
];

router.post("/expense", async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript || !transcript.trim()) {
            return res.status(400).json({
                message: "Voice transcript is required",
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: `Extract expense details from this sentence:
"${transcript}"

Return JSON with exactly these fields:
title, amount, category.

Choose exactly one category:
Food, Drinks, Travel, Shopping, Health, Education, Other.

Category rules:
- Food: breakfast, lunch, dinner, snacks, pizza, etc.
- Drinks: tea, coffee, juice, milk, water, soft drinks, etc.
- Travel: bus, train, cab, petrol, flight, etc.
- Shopping: clothes, shoes, gadgets, etc.
- Health: medicine, doctor, hospital, etc.
- Education: books, courses, fees, etc.
- Other: anything that does not fit above.

Extract the actual amount as a number.
Do not guess an amount.
Return only valid JSON.`,
            config: {
                responseMimeType: "application/json",
            },
        });

        const details = JSON.parse(response.text);

        if (
            !details.title ||
            !Number.isFinite(Number(details.amount)) ||
            Number(details.amount) <= 0
        ) {
            return res.status(400).json({
                message: "Could not understand expense details",
            });
        }

        const category = categories.includes(details.category)
            ? details.category
            : "Other";

        const expense = await Expense.create({
            title: details.title,
            amount: Number(details.amount),
            category,
        });

        res.status(201).json({
            message: "Expense added successfully",
            expense,
        });

    } catch (error) {
        console.error("Gemini Error:", error);

        res.status(500).json({
            message: "Could not process voice expense",
        });
    }
});

module.exports = router;
