// User Dashboard JavaScript
let currentBooks = [];
let borrowedBooks = [];

// Load dashboard on page load
document.addEventListener("DOMContentLoaded", function () {
  loadAllBooks();
  loadBorrowedBooks();
});

// Search functionality
document
  .getElementById("searchInput")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchBooks();
    }
  });

async function searchBooks() {
  const query = document.getElementById("searchInput").value.trim();

  try {
    const response = await fetch(
      `/api/books/search?query=${encodeURIComponent(query)}`
    );
    const result = await response.json();

    if (result.success) {
      currentBooks = result.books;
      displayBooks(result.books);
    } else {
      showAlert("Error searching books", "error");
    }
  } catch (error) {
    showAlert("Error searching books", "error");
  }
}

async function loadAllBooks() {
  try {
    const response = await fetch("/api/books/search");
    const result = await response.json();

    if (result.success) {
      currentBooks = result.books;
      displayBooks(result.books);
    } else {
      showAlert("Error loading books", "error");
    }
  } catch (error) {
    showAlert("Error loading books", "error");
  }
}

function displayBooks(books) {
  const booksGrid = document.getElementById("booksGrid");

  if (books.length === 0) {
    booksGrid.innerHTML =
      '<p style="text-align: center; color: #666;">No books found.</p>';
    return;
  }

  booksGrid.innerHTML = books
    .map(
      (book) => `
        <div class="book-card">
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Category:</strong> ${book.category}</p>
            <p class="availability ${getAvailabilityClass(
              book.available_copies
            )}">
                <strong>Available:</strong> ${book.available_copies}/${
        book.total_copies
      }
            </p>
            ${
              book.available_copies > 0
                ? `<button onclick="borrowBook(${book.book_id})" class="btn">Borrow Book</button>`
                : `<button disabled class="btn" style="background: #ccc;">Not Available</button>`
            }
        </div>
    `
    )
    .join("");
}

function getAvailabilityClass(available) {
  if (available === 0) return "out";
  if (available <= 2) return "low";
  return "";
}

async function borrowBook(bookId) {
  try {
    const response = await fetch("/api/books/borrow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ book_id: bookId }),
    });

    const result = await response.json();

    if (result.success) {
      showAlert(
        `Book borrowed successfully! Due date: ${result.due_date}`,
        "success"
      );
      loadAllBooks(); // Refresh books
      loadBorrowedBooks(); // Refresh borrowed books
    } else {
      showAlert(result.message, "error");
    }
  } catch (error) {
    showAlert("Error borrowing book", "error");
  }
}

async function loadBorrowedBooks() {
  try {
    const response = await fetch("/api/user/borrowed-books");
    const result = await response.json();

    if (result.success) {
      borrowedBooks = result.books;
      displayBorrowedBooks(result.books);
    } else {
      showAlert("Error loading borrowed books", "error");
    }
  } catch (error) {
    showAlert("Error loading borrowed books", "error");
  }
}

function displayBorrowedBooks(books) {
  const tbody = document.querySelector("#borrowedBooksTable tbody");

  if (books.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: #666;">No borrowed books</td></tr>';
    return;
  }

  tbody.innerHTML = books
    .map((book) => {
      const isOverdue =
        new Date(book.due_date) < new Date() && book.calculated_penalty > 0;
      return `
            <tr style="${isOverdue ? "background-color: #fff3cd;" : ""}">
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${formatDate(book.borrow_date)}</td>
                <td>${formatDate(book.due_date)}</td>
                <td style="color: ${
                  book.calculated_penalty > 0 ? "#dc3545" : "#28a745"
                }; font-weight: bold;">
                    $${book.calculated_penalty}
                </td>
                <td>
                    <button onclick="returnBook(${
                      book.borrow_id
                    })" class="btn btn-success">Return</button>
                </td>
            </tr>
        `;
    })
    .join("");
}

async function returnBook(borrowId) {
  if (!confirm("Are you sure you want to return this book?")) {
    return;
  }

  try {
    const response = await fetch("/api/books/return", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ borrow_id: borrowId }),
    });

    const result = await response.json();

    if (result.success) {
      const penaltyMsg =
        result.penalty > 0 ? ` Penalty: $${result.penalty}` : " No penalty.";
      showAlert(`${result.message}${penaltyMsg}`, "success");
      loadAllBooks(); // Refresh books
      loadBorrowedBooks(); // Refresh borrowed books
    } else {
      showAlert(result.message, "error");
    }
  } catch (error) {
    showAlert("Error returning book", "error");
  }
}

async function logout() {
  try {
    const response = await fetch("/api/logout", { method: "POST" });

    if (response.ok) {
      window.location.href = "/";
    } else {
      showAlert("Error logging out", "error");
    }
  } catch (error) {
    showAlert("Error logging out", "error");
  }
}

function showAlert(message, type) {
  document.getElementById(
    "alert"
  ).innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    document.getElementById("alert").innerHTML = "";
  }, 5000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}
