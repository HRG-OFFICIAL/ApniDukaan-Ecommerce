# Database Configuration Guide

## PostgreSQL Setup

### 1. Install PostgreSQL
```bash
# Windows (using Chocolatey)
choco install postgresql

# macOS (using Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
```

### 2. Start PostgreSQL Service
```bash
# Windows
net start postgresql-x64-13

# macOS
brew services start postgresql

# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Create Database and User
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE shopsphere;

-- Create user
CREATE USER shopsphere_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE shopsphere TO shopsphere_user;

-- Connect to the database
\c shopsphere

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO shopsphere_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shopsphere_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shopsphere_user;

-- Exit
\q
```

### 4. Environment Variables
Add to your `.env` file:
```bash
POSTGRES_URL=postgresql://shopsphere_user:your_secure_password@localhost:5432/shopsphere
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=shopsphere
POSTGRES_USER=shopsphere_user
POSTGRES_PASSWORD=your_secure_password
```

## MongoDB Setup

### 1. Install MongoDB
```bash
# Windows (using Chocolatey)
choco install mongodb

# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org
```

### 2. Start MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Environment Variables
Add to your `.env` file:
```bash
MONGODB_URI=mongodb://localhost:27017/shopsphere
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB=shopsphere
```

## Redis Setup

### 1. Install Redis
```bash
# Windows (using Chocolatey)
choco install redis-64

# macOS (using Homebrew)
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server
```

### 2. Start Redis
```bash
# Windows
redis-server

# macOS
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis
sudo systemctl enable redis
```

### 3. Environment Variables
Add to your `.env` file:
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Database Connection Strings

### Development
```bash
# PostgreSQL
DATABASE_URL=postgresql://shopsphere_user:password@localhost:5432/shopsphere

# MongoDB
MONGODB_URI=mongodb://localhost:27017/shopsphere

# Redis
REDIS_URL=redis://localhost:6379
```

### Production
```bash
# PostgreSQL (example with cloud provider)
DATABASE_URL=postgresql://user:password@host:5432/shopsphere?sslmode=require

# MongoDB (example with MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/shopsphere?retryWrites=true&w=majority

# Redis (example with cloud provider)
REDIS_URL=redis://user:password@host:6379
```

## Database Schema

### PostgreSQL Tables
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MongoDB Collections
```javascript
// Users collection
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  profile: {
    firstName: String,
    lastName: String,
    avatar: String
  },
  role: String,
  createdAt: Date,
  updatedAt: Date
}

// Products collection
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: ObjectId,
  images: [String],
  stock: Number,
  ratings: {
    average: Number,
    count: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```
