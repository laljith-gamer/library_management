# Library Management System

A complete library management system with user and admin panels built with Node.js, Express, MySQL, and vanilla JavaScript.

## Features

### User Panel
- User authentication with party_id and password
- Search books by title, author, or category
- View available books with copy counts
- Borrow up to 3 books at a time
- 7-day borrowing period
- Automatic penalty calculation for late returns ($5/day)
- View borrowed books and return them

### Admin Panel
- Admin authentication with admin_id and password
- Add new books to the library
- Edit existing book details
- Delete books (only if not currently borrowed)
- View all borrowed books with user details
- Track penalties and overdue books

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: bcrypt for password hashing
- **Sessions**: express-session for user sessions
- **Database Driver**: mysql2

## Installation

1. **Prerequisites**
   - Node.js (v14 or higher)
   - MySQL (v8.0 or higher)
   - npm (comes with Node.js)

2. **Clone or create the project**
"# library_management" 
