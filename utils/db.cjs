

require('dotenv').config();

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length) {
  throw new Error(`Missing database environment variables: ${missingVariables.join(', ')}`);
}

// Ruta del certificado SSL
const certificadoPath = process.env.DB_SSL_CA
  ? path.resolve(process.env.DB_SSL_CA)
  : path.join(__dirname, '../certificados/isrgrootx1.pem');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,

  ssl: {
    ca: fs.readFileSync(certificadoPath),
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

module.exports = pool;

