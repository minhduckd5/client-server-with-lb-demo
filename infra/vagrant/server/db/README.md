# Database Setup Guide

## PostgreSQL Database Setup for ShoppingCS-LB

### Step 1: Create the Database

Connect to PostgreSQL as a superuser and run:

```sql
CREATE DATABASE "ShoppingCS-LB";
```

### Step 2: Run the Schema

Connect to the `ShoppingCS-LB` database and run the schema file:

```bash
psql -U your_username -d ShoppingCS-LB -f schema.sql
```

Or from within psql:

```sql
\c "ShoppingCS-LB"
\i schema.sql
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=ShoppingCS-LB
```

### Step 4: Verify Setup

The schema includes sample product data that will be automatically inserted. You can verify by querying:

```sql
SELECT * FROM products;
```

## Database Schema Overview

- **products**: Stores product information
- **cart_items**: Stores shopping cart items (session-based)
- **orders**: Stores order information
- **order_items**: Stores individual items within orders

All tables include proper indexes for performance optimization.

