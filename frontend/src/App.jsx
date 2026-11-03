
import { useEffect, useState } from "react";
import "./App.css";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CATEGORIES = [
  "Food",
  "Drinks",
  "Travel",
  "Shopping",
  "Health",
  "Education",
  "Other",
];

const COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#64748b",
];

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const fetchExpenses = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/expenses");
      if (!response.ok) throw new Error("Could not fetch expenses");
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.log("Error fetching expenses:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert("Please enter a valid title and amount.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5001/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category,
        }),
      });

      if (!response.ok) throw new Error("Failed to add expense");

      setTitle("");
      setAmount("");
      await fetchExpenses();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5001/api/expenses/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete expense");

      await fetchExpenses();
    } catch (error) {
      alert(error.message);
    }
  };

  const saveVoiceExpense = async (spokenText) => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5001/api/voice/expense",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: spokenText }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      await fetchExpenses();

      const speech = new SpeechSynthesisUtterance(
        `Expense saved successfully. ${data.expense.title}, ${data.expense.amount} rupees, ${data.expense.category}.`
      );

      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.log("Voice expense error:", error);
      alert(error.message || "Could not save expense.");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    let hasProcessed = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      if (hasProcessed) return;
      hasProcessed = true;

      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);

      const speech = new SpeechSynthesisUtterance(
        `I heard: ${spokenText}. Say yes to save this expense, or no to cancel.`
      );

      speech.onend = () => {
        const confirmation = new SpeechRecognition();
        confirmation.lang = "en-IN";
        confirmation.continuous = false;
        confirmation.interimResults = false;

        let confirmationProcessed = false;

        confirmation.onstart = () => setListening(true);

        confirmation.onresult = (event) => {
          if (confirmationProcessed) return;
          confirmationProcessed = true;

          const answer = event.results[0][0].transcript
            .toLowerCase()
            .trim();

          console.log("Confirmation heard:", answer);

          if (/\b(yes|yeah|yep|yup|correct|save|sure)\b/.test(answer)) {
            saveVoiceExpense(spokenText);
          } else if (/\b(no|nope|cancel|don't|dont)\b/.test(answer)) {
            window.speechSynthesis.speak(
              new SpeechSynthesisUtterance("Okay, expense cancelled.")
            );
          } else {
            alert(`I heard "${answer}". Please say Yes or No.`);
          }
        };

        confirmation.onerror = (event) => {
          console.log("Confirmation error:", event.error);
          alert("Could not hear your confirmation. Please try again.");
        };

        confirmation.onend = () => setListening(false);
        confirmation.start();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    };

    recognition.onerror = (event) => {
      console.log("Voice error:", event.error);
      alert("Voice recognition failed. Please try again.");
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  };
  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTotal = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);

      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const categoryTotals = CATEGORIES.map((item) => ({
    name: item,
    total: expenses
      .filter((expense) => expense.category === item)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
  })).filter((item) => item.total > 0);

  const filteredExpenses =
    filterCategory === "All"
      ? expenses
      : expenses.filter(
        (expense) => expense.category === filterCategory
      );

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Voice Expense Tracker</h1>
          <p className="subtitle">
            Track your spending with your voice or manually.
          </p>
        </div>
      </header>

      <section className="stats">
        <div className="stat-card">
          <p>Total Expenses</p>
          <h2>₹{total.toLocaleString("en-IN")}</h2>
        </div>

        <div className="stat-card">
          <p>Total Transactions</p>
          <h2>{expenses.length}</h2>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Add New Expense</h2>

          <form onSubmit={addExpense} className="expense-form">
            <label>Expense title</label>
            <input
              type="text"
              placeholder="Example: Tea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label>Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              required
            />

            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Please wait..." : "Add Expense"}
            </button>
          </form>
        </div>

        <div className="panel voice-panel">
          <h2>Voice Assistant</h2>
          <p>Try saying:</p>
          <p className="example">
            "I spent 80 rupees on tea today."
          </p>

          <button
            className="voice-btn"
            onClick={startListening}
            disabled={listening || loading}
          >
            {listening ? "Listening..." : "🎤 Start Voice Input"}
          </button>

          <div className="transcript">
            <strong>Recognized Text</strong>
            <p>{transcript || "Nothing recorded yet"}</p>
          </div>
        </div>
      </section>

      <section className="panel category-panel">
        <h2>Spending by Category</h2>

        {categoryTotals.length === 0 ? (
          <p className="empty">No expenses to show yet.</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryTotals}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryTotals.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="panel transactions-panel">
        <h2>Recent Transactions</h2>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>

          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {filteredExpenses.length === 0 ? (
          <p className="empty">No transactions found.</p>
        ) : (
          <div className="transactions">
            {filteredExpenses.map((expense) => (
              <div className="transaction" key={expense._id}>
                <div>
                  <strong>{expense.title}</strong>
                  <p>{expense.category}</p>
                </div>

                <div className="transaction-right">
                  <strong>
                    ₹{Number(expense.amount).toLocaleString("en-IN")}
                  </strong>
                  <button
                    className="delete-btn"
                    onClick={() => deleteExpense(expense._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
