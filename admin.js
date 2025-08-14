// Admin Dashboard JavaScript
let currentBooks = [];
let borrowedBooks = [];

// Load dashboard on page load
document.addEventListener("DOMContentLoaded", function () {
  loadAllBooks();
  loadAllBorrowedBooks();
});

// Book form submission
document.getElementById("addBookForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch("/api/admin/books", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      showAlert(result.message, "success");
      e.target.reset(); // Clear form
      loadAllBooks(); // Refresh books list
    } else {
      showAlert(result.message, "error");
    }
  } catch (error) {
    showAlert("Error adding book", "error");
  }
});

async function loadAllBooks() {
  try {
    const response = await fetch("/api/books");
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
  const tbody = document.querySelector("#booksTable tbody");

  if (books.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: #666;">No books found</td></tr>';
    return;
  }

  tbody.innerHTML = books
    .map(
      (book) => `
        <tr>
            <td>${book.book_id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>${book.total_copies}</td>
            <td style="color: ${getAvailabilityColor(
              book.available_copies,
              book.total_copies
            )}; font-weight: bold;">
                ${book.available_copies}
            </td>
            <td>
                <button onclick="deleteBook(${
                  book.book_id
                })" class="btn btn-danger" 
                        ${
                          book.available_copies !== book.total_copies
                            ? 'disabled title="Cannot delete - book is borrowed"'
                            : ""
                        }>
                    Delete
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function getAvailabilityColor(available, total) {
  if (available === 0) return "#dc3545"; // Red
  if (available <= total * 0.3) return "#ffc107"; // Yellow
  return "#28a745"; // Green
}

async function loadAllBorrowedBooks() {
  try {
    const response = await fetch("/api/admin/borrowed-books");
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
      '<tr><td colspan="8" style="text-align: center; color: #666;">No borrowed books</td></tr>';
    return;
  }

  tbody.innerHTML = books
    .map((book) => {
      const isOverdue =
        book.status === "borrowed" && new Date(book.due_date) < new Date();
      const penalty =
        book.status === "borrowed"
          ? calculatePenalty(book.due_date)
          : book.penalty_amount;

      return `
            <tr style="${isOverdue ? "background-color: #fff3cd;" : ""}">
                <td>${book.user_name}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${formatDate(book.borrow_date)}</td>
                <td>${formatDate(book.due_date)}</td>
                <td>${
                  book.return_date
                    ? formatDate(book.return_date)
                    : "Not returned"
                }</td>
                <td>
                    <span style="color: ${
                      book.status === "borrowed" ? "#ffc107" : "#28a745"
                    }; font-weight: bold;">
                        ${book.status}
                    </span>
                </td>
                <td style="color: ${
                  penalty > 0 ? "#dc3545" : "#28a745"
                }; font-weight: bold;">
                    $${penalty}
                </td>
            </tr>
        `;
    })
    .join("");
}

function calculatePenalty(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * 5 : 0;
}

async function deleteBook(bookId) {
  if (
    !confirm(
      "Are you sure you want to delete this book? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/books/${bookId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      showAlert(result.message, "success");
      loadAllBooks(); // Refresh books list
    } else {
      showAlert(result.message, "error");
    }
  } catch (error) {
    showAlert("Error deleting book", "error");
  }
}

async function logout() {
  try {
    const response = await fetch("/api/logout", { method: "POST" });

    if (response.ok) {
      window.location.href = "/admin-login";
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
