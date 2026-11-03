
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully!"))
    .catch((error) => console.log("MongoDB Error:", error.message));

// Test routes
app.get("/", (req, res) => {
    res.send("Voice Expense Tracker Backend is Running!");
});

app.get("/test", (req, res) => {
    res.send("Correct server.js is running!");
});

// Import expense routes
const expenseRoutes = require("./routes/expenseRoutes");
const voiceRoutes = require("./routes/voiceRoutes");

// Use expense routes
app.use("/api/expenses", expenseRoutes);
app.use("/api/voice", voiceRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
