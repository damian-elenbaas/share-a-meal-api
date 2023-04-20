const express = require('express');
const app = express();
const port = 3000;
const api = require('./routes/api');
const user = require('./routes/user');

app.use('/api', api);
app.use('/api/user', user);
app.use('*', (req, res) => {
  res.status(404).json({
    'status': 404,
    'message': 'Endpoint not found',
    'data': {}
  });
});
console.log("test");

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
