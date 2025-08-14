const express = require("express");
const mysql = require("mysql2/promise");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session setup
app.use(
  session({
    secret: "library-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Database connection - UPDATE YOUR PASSWORD HERE
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Lal@122005", // PUT YOUR MYSQL PASSWORD HERE
  database: "library_management",
};

let db;

async function initializeDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL database");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.log("Make sure to update your MySQL password in server.js");
    process.exit(1);
  }
}

// Helper function to calculate penalty
function calculatePenalty(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * 5 : 0; // $5 per day
}

// ROUTES

// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

app.get("/user-dashboard.html", (req, res) => {
  if (!req.session.userId) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "user-dashboard.html"));
});

app.get("/admin-dashboard.html", (req, res) => {
  if (!req.session.adminId) return res.redirect("/admin-login");
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

// User login - NO ENCRYPTION
app.post("/api/user/login", async (req, res) => {
  const { party_id, password } = req.body;

  console.log("🔍 User Login attempt:", party_id, password);

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE party_id = ?", [
      party_id,
    ]);

    if (rows.length === 0) {
      console.log("❌ User not found");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];
    console.log("🔍 Database password:", user.password);

    // Simple password comparison - NO ENCRYPTION
    if (password !== user.password) {
      console.log("❌ Password mismatch");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    req.session.userId = user.party_id;
    req.session.userName = user.name;
    console.log("✅ User login successful");
    res.json({
      success: true,
      message: "Login successful",
      user: { party_id: user.party_id, name: user.name },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin login - NO ENCRYPTION
app.post("/api/admin/login", async (req, res) => {
  const { admin_id, password } = req.body;

  console.log("🔍 Admin Login attempt:", admin_id, password);

  try {
    const [rows] = await db.execute("SELECT * FROM admins WHERE admin_id = ?", [
      admin_id,
    ]);

    if (rows.length === 0) {
      console.log("❌ Admin not found");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const admin = rows[0];
    console.log("🔍 Database password:", admin.password);

    // Simple password comparison - NO ENCRYPTION
    if (password !== admin.password) {
      console.log("❌ Password mismatch");
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    req.session.adminId = admin.admin_id;
    req.session.adminName = admin.name;
    console.log("✅ Admin login successful");
    res.json({
      success: true,
      message: "Login successful",
      admin: { admin_id: admin.admin_id, name: admin.name },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Search books
app.get("/api/books/search", async (req, res) => {
  const { query } = req.query;

  try {
    let sql = "SELECT * FROM books WHERE available_copies > 0";
    let params = [];

    if (query) {
      sql += " AND (title LIKE ? OR author LIKE ? OR category LIKE ?)";
      params = [`%${query}%`, `%${query}%`, `%${query}%`];
    }

    const [rows] = await db.execute(sql, params);
    res.json({ success: true, books: rows });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all books (admin)
app.get("/api/books", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM books ORDER BY title");
    res.json({ success: true, books: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Borrow book
app.post("/api/books/borrow", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  const { book_id } = req.body;
  const party_id = req.session.userId;

  try {
    // Check borrowed count
    const [borrowedCount] = await db.execute(
      'SELECT COUNT(*) as count FROM borrowed_books WHERE party_id = ? AND status = "borrowed"',
      [party_id]
    );

    if (borrowedCount[0].count >= 3) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You can only borrow up to 3 books at a time",
        });
    }

    // Check availability
    const [bookRows] = await db.execute(
      "SELECT * FROM books WHERE book_id = ? AND available_copies > 0",
      [book_id]
    );

    if (bookRows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Book not available" });
    }

    const borrowDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Create borrow record
    await db.execute(
      "INSERT INTO borrowed_books (party_id, book_id, borrow_date, due_date) VALUES (?, ?, ?, ?)",
      [party_id, book_id, borrowDate, dueDate]
    );

    // Update available copies
    await db.execute(
      "UPDATE books SET available_copies = available_copies - 1 WHERE book_id = ?",
      [book_id]
    );

    res.json({
      success: true,
      message: "Book borrowed successfully",
      due_date: dueDate,
    });
  } catch (error) {
    console.error("Borrow error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get user's borrowed books
app.get("/api/user/borrowed-books", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  try {
    const [rows] = await db.execute(
      `
            SELECT bb.*, b.title, b.author 
            FROM borrowed_books bb 
            JOIN books b ON bb.book_id = b.book_id 
            WHERE bb.party_id = ? AND bb.status = 'borrowed'
            ORDER BY bb.borrow_date DESC
        `,
      [req.session.userId]
    );

    const booksWithPenalty = rows.map((book) => ({
      ...book,
      calculated_penalty: calculatePenalty(book.due_date),
    }));

    res.json({ success: true, books: booksWithPenalty });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Return book
app.post("/api/books/return", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  const { borrow_id } = req.body;

  try {
    const [borrowRows] = await db.execute(
      'SELECT * FROM borrowed_books WHERE borrow_id = ? AND party_id = ? AND status = "borrowed"',
      [borrow_id, req.session.userId]
    );

    if (borrowRows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Borrow record not found" });
    }

    const penalty = calculatePenalty(borrowRows[0].due_date);
    const returnDate = new Date().toISOString().split("T")[0];

    // Update borrow record
    await db.execute(
      'UPDATE borrowed_books SET status = "returned", return_date = ?, penalty_amount = ? WHERE borrow_id = ?',
      [returnDate, penalty, borrow_id]
    );

    // Update available copies
    await db.execute(
      "UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ?",
      [borrowRows[0].book_id]
    );

    res.json({
      success: true,
      message: "Book returned successfully",
      penalty: penalty,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: Add book
app.post("/api/admin/books", async (req, res) => {
  if (!req.session.adminId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated as admin" });
  }

  const { title, author, category, total_copies } = req.body;

  try {
    await db.execute(
      "INSERT INTO books (title, author, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)",
      [title, author, category, total_copies, total_copies]
    );

    res.json({ success: true, message: "Book added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: Delete book
app.delete("/api/admin/books/:id", async (req, res) => {
  if (!req.session.adminId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated as admin" });
  }

  const { id } = req.params;

  try {
    await db.execute("DELETE FROM books WHERE book_id = ?", [id]);
    res.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin: Get all borrowed books
app.get("/api/admin/borrowed-books", async (req, res) => {
  if (!req.session.adminId) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated as admin" });
  }

  try {
    const [rows] = await db.execute(`
            SELECT bb.*, b.title, b.author, u.name as user_name 
            FROM borrowed_books bb 
            JOIN books b ON bb.book_id = b.book_id 
            JOIN users u ON bb.party_id = u.party_id 
            ORDER BY bb.borrow_date DESC
        `);

    res.json({ success: true, books: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: "Logged out" });
});

// Start server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`👤 User login: http://localhost:${PORT}`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/admin-login`);
    console.log("\n📋 Test Credentials (Plain Text):");
    console.log("User - ID: user123, Password: user123");
    console.log("User - ID: user456, Password: pass123");
    console.log("Admin - ID: admin123, Password: admin123");
    console.log("Admin - ID: admin456, Password: admin456");
  });
}

startServer();
