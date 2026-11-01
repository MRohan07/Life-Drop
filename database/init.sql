-- LifeDrop PostgreSQL Initialization Script for Docker / Cross-Platform Setup
-- Initializes primary database and test database for automated testing

SELECT 'CREATE DATABASE lifedrop_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lifedrop_test')\gexec

GRANT ALL PRIVILEGES ON DATABASE lifedrop TO lifedrop_user;
GRANT ALL PRIVILEGES ON DATABASE lifedrop_test TO lifedrop_user;

