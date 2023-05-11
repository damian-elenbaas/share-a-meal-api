// get the client
const mysql = require('mysql2');

// create the connection to database
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   database: 'share_a_meal'
// });

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'share_a_meal',
  waitForConnections: true,
  connectionLimit: 10,
  idleTimeout: 60000,
  queueLimit: 0
});

pool.getConnection((err, conn) => {
  conn.query(
    'SELECT * FROM `user`',
    function(err, results, fields) {
      console.log(results); // results contains rows returned by server
    }
  );

  pool.releaseConnection(conn);
})


// simple query
// pool.query(
//   'SELECT * FROM `user`',
//   function(err, results, fields) {
//     console.log(results); // results contains rows returned by server
//   }
// );

// with placeholder
// connection.query(
//   'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
//   ['Page', 45],
//   function(err, results) {
//     console.log(results);
//   }
// );
