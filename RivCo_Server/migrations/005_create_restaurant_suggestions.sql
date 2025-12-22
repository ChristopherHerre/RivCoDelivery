-- Create restaurant_suggestions table as a buffer for restaurant suggestions
CREATE TABLE IF NOT EXISTS restaurant_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    suggested_by VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by VARCHAR(255) NULL,
    -- Restaurant fields (same as restaurants table)
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    category VARCHAR(255),
    city_name VARCHAR(255),
    city_slug VARCHAR(255),
    FOREIGN KEY (suggested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_suggested_by (suggested_by),
    INDEX idx_created_at (created_at)
);
