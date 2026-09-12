CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT_CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
('Arnab', 'arnab@example.com'),
('Test User', 'test@example.com');
