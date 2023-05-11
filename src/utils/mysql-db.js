const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'share_a_meal',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  multipleStatements: true
});

module.exports = pool;

