-- Set Max Connections (Increase if necessary)
SET GLOBAL max_connections = 500;

-- Set Wait Timeout and Interactive Timeout (Increase for longer idle times)
SET GLOBAL wait_timeout = 28800;      -- 8 hours
SET GLOBAL interactive_timeout = 28800; -- 8 hours

-- Set Max Allowed Packet (Increase to handle larger queries)
SET GLOBAL max_allowed_packet = 64 * 1024 * 1024; -- 64MB, adjust based on your needs

-- Set Long Query Time (Log slow queries that take more than 1 second)
SET GLOBAL long_query_time = 1;

-- Enable Slow Query Log (Useful for diagnosing slow queries)
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL slow_query_log_file = '/var/lib/mysql/slow_query.log';

-- Increase InnoDB Buffer Pool Size (adjust according to available memory)
SET GLOBAL innodb_buffer_pool_size = 8 * 1024 * 1024 * 1024; -- 8GB (adjust based on available RAM)

-- Set Thread Cache Size (Increase to improve thread reuse and performance)
SET GLOBAL thread_cache_size = 50; -- Adjust based on traffic load

-- Set InnoDB Flush Log At Timeout (adjust based on workload)
SET GLOBAL innodb_flush_log_at_trx_commit = 2;

-- Enable InnoDB File-Per-Table (Best for performance and better storage management)
SET GLOBAL innodb_file_per_table = 1;

-- Set innodb_lock_wait_timeout (Set an appropriate value for locking behavior)
SET GLOBAL innodb_lock_wait_timeout = 50; -- Adjust based on your use case

-- Configure the maximum size for temporary tables
SET GLOBAL tmp_table_size = 256 * 1024 * 1024; -- 256MB (adjust according to needs)
SET GLOBAL max_heap_table_size = 256 * 1024 * 1024; -- 256MB

-- Set default storage engine to InnoDB (for better performance with ACID compliance)
SET GLOBAL default_storage_engine = 'InnoDB';

-- Optional: Set maximum allowed packet size for large BLOBs or complex queries
SET GLOBAL max_allowed_packet = 64 * 1024 * 1024;  -- 64MB (for large BLOBs or queries)

-- Optional: Configure connection retries to avoid premature connection failure
SET GLOBAL connect_timeout = 10;  -- Timeout for new connections (in seconds)
SET GLOBAL net_read_timeout = 30;  -- Timeout for reading data from the client (in seconds)
SET GLOBAL net_write_timeout = 30;  -- Timeout for writing data to the client (in seconds)