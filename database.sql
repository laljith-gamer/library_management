DROP DATABASE IF EXISTS library_management;
CREATE DATABASE library_management;
USE library_management;

-- Users table
CREATE TABLE users (
    party_id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100)
);

-- Admins table
CREATE TABLE admins (
    admin_id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- Books table
CREATE TABLE books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1
);

-- Borrowed books table
CREATE TABLE borrowed_books (
    borrow_id INT AUTO_INCREMENT PRIMARY KEY,
    party_id VARCHAR(50),
    book_id INT,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'borrowed',
    FOREIGN KEY (party_id) REFERENCES users(party_id),
    FOREIGN KEY (book_id) REFERENCES books(book_id)
);

-- Insert test users with PLAIN passwords
INSERT INTO users (party_id, password, name, email) VALUES 
('user123', 'user123', 'John Doe', 'john@email.com'),
('user456', 'pass123', 'Jane Smith', 'jane@email.com');

INSERT INTO admins (admin_id, password, name) VALUES 
('admin123', 'admin123', 'System Admin'),
('admin456', 'admin456', 'Library Manager');

-- Insert sample books
INSERT INTO books (title, author, category, total_copies, available_copies) VALUES 
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 5, 5),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 3, 3),
('1984', 'George Orwell', 'Science Fiction', 4, 4),
('Pride and Prejudice', 'Jane Austen', 'Romance', 2, 2),
('The Catcher in the Rye', 'J.D. Salinger', 'Fiction', 3, 3),
('Harry Potter', 'J.K. Rowling', 'Fantasy', 6, 6);
