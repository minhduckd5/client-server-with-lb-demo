import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

//Setup postgresql connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

//test connection
// pool.query('SELECT NOW()', (err, res) => {
//     if (err) {
//         console.error('Error testing database connection:', err);
//     } else {
//         console.log('Database connection successful:', res.rows[0]);
//     }
//     pool.end();
// });
pool.connect()
.then(() => console.log('Database connection successful'))
.catch((err) => console.error('Error connecting to database:', err.stack));

export default pool;