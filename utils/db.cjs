
// Get the client
require('dotenv').config();

const mysql = require('mysql2/promise');

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length) {
  throw new Error(`Missing database environment variables: ${missingVariables.join(', ')}`);
}

// Create the connection to database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

module.exports = pool;