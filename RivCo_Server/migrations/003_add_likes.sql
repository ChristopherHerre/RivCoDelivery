-- Add likes column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;

-- Add likes column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;

-- Create restaurant_likes junction table
CREATE TABLE IF NOT EXISTS restaurant_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    restaurant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_restaurant_like (user_id, restaurant_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_restaurant_id (restaurant_id),
    INDEX idx_user_id (user_id)
);

-- Create menu_item_likes junction table
CREATE TABLE IF NOT EXISTS menu_item_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    menu_item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_menu_item_like (user_id, menu_item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    INDEX idx_menu_item_id (menu_item_id),
    INDEX idx_user_id (user_id)
);
