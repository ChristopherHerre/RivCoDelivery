ALTER TABLE restaurants
  ADD COLUMN city_name VARCHAR(100) NULL,
  ADD COLUMN city_slug VARCHAR(120) NULL,
  ADD INDEX idx_restaurants_city_slug (city_slug);


