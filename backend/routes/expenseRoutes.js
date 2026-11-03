const express = require("express");
const router = express.Router();
console.log("Expense routes loaded!");

const Expense = require("../models/Expense");

// GET: Fetch all expenses
router.get("/", async (req, res) => {
    console.log("GET expenses route called!");

    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Add a new expense
router.post("/", async (req, res) => {
    try {
        const { title, amount, category } = req.body;

        const expense = new Expense({
            title,
            amount,
            category,
        });

        const savedExpense = await expense.save();

        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE: Delete an expense
router.delete("/:id", async (req, res) => {
    try {
        const deletedExpense = await Expense.findByIdAndDelete(req.params.id);

        if (!deletedExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;