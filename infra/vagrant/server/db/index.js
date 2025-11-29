import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

// Setup postgresql connection pool
// MODIFIED: Handle database name case sensitivity - PostgreSQL converts unquoted identifiers to lowercase
// If database was created with quotes (case-sensitive), ensure exact match
const poolConfig = {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
};

// Only include password if it exists, is not empty, and is a valid string
// PostgreSQL SCRAM authentication requires a non-empty string password
// if (process.env.PG_PASSWORD &&
//     typeof process.env.PG_PASSWORD === 'string' &&
//     process.env.PG_PASSWORD.trim() !== '') {
//     poolConfig.password = process.env.PG_PASSWORD.trim();
// } else {
//     // Log warning if password is missing (for debugging)
//     console.warn('Warning: PG_PASSWORD is not set or is empty. Connection may fail if password authentication is required.');
// }

const pool = new Pool(poolConfig);

// Set search_path to 'public' schema for all connections and add diagnostic logging
pool.on('connect', async (client) => {
    try {
        // Set search_path to public schema
        await client.query('SET search_path TO public');
        
        // Diagnostic: Verify current database and schema
        const dbResult = await client.query('SELECT current_database(), current_schema()');
        console.log(`Database connection established - Database: ${dbResult.rows[0].current_database}, Schema: ${dbResult.rows[0].current_schema}`);
        
        // Diagnostic: Check if products table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'products'
            );
        `);
        console.log(`Products table exists: ${tableCheck.rows[0].exists}`);
    } catch (err) {
        console.error('Error initializing database connection:', err);
    }
});

// Test connection with diagnostics
pool.connect()
.then((client) => {
    console.log('Database connection successful');
    console.log(`Connected to database: ${poolConfig.database} on ${poolConfig.host}:${poolConfig.port}`);
    client.release();
})
.catch((err) => {
    console.error('Error connecting to database:', err.stack);
    console.error('Connection config:', {
        host: poolConfig.host,
        port: poolConfig.port,
        user: poolConfig.user,
        database: poolConfig.database,
        hasPassword: !!poolConfig.password
    });
});

export default pool;