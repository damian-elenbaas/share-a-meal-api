const express = require('express');
const app = express();
const logger = require('./src/utils/logger').logger;
const port = process.env.PORT || 3000;
const api = require('./src/routes/api.routes');
const user = require('./src/routes/user.routes');
const meal = require('./src/routes/meal.routes');

app.use('*', (req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl}`);
  next();
});
app.use('/api', api);
app.use('/api/user', user);
app.use('/api/meal', meal);
app.use('*', (req, res) => {
  logger.info(`[*] Invalid Endpoint`);
  res.status(404).json({
    'status': 404,
    'message': 'Endpoint not found',
    'data': {}
  });
});

app.listen(port, '0.0.0.0', () => {
  logger.info(`Example app listening on port ${port}`);
});

module.exports = app;
