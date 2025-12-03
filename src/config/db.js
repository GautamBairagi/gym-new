import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

// Make **promise pool directly**
export const pool = mysql
  .createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "gym_db",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();  // <<< THIS IS THE FIX

// Test MySQL connection
pool.getConnection()
  .then((connection) => {
    console.log('✅ MySQL connected successfully!');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ MySQL connection failed:', err.message);
  });

// Remove `db` export (no need)
// export const db = pool.promise();  // ❌ REMOVE
