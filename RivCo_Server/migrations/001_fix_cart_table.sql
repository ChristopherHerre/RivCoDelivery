-- Drop existing cart table if it exists
DROP TABLE IF EXISTS cart;

-- Create new cart table with proper user_id handling
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    ingredients TEXT,
    user_id VARCHAR(255) NOT NULL,
    size1 VARCHAR(255),
    val1 INT DEFAULT 0,
    size2 VARCHAR(255),
    val2 INT DEFAULT 0,
    size3 VARCHAR(255),
    val3 INT DEFAULT 0,
    size4 VARCHAR(255),
    val4 INT DEFAULT 0,
    halfer TEXT,
    arrs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 