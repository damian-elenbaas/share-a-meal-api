const express = require('express');
const app = express();
const logger = require('./utils/logger').logger;
const port = 3000;
const api = require('./routes/api');
const user = require('./routes/user');

app.use('/api', api);
app.use('/api/user', user);
app.use('*', (req, res) => {
  logger.info(`[*] Invalid Endpoint`);
  res.status(404).json({
    'status': 404,
    'message': 'Endpoint not found',
    'data': {}
  });
});

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});

module.exports = app;
