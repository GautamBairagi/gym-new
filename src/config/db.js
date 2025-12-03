import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: "localhost",
  user:"root",
  password:"",
  database:"gym_db",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ MySQL connected successfully!');
    connection.release();
  }
});

// Optional: default export for convenience
export const db = pool.promise();
