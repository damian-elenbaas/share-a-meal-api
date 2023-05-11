const express = require('express');
const logger = require('../utils/logger').logger;
const router = express.Router();
const user = require('../controllers/user.controller');

router.use(express.json());

router.post('/login', user.login);

router.get('/info', (req, res) => {
  logger.log(`[GET] /api/info`);
  res.status(200).json({
    'status': 200,
    'message': 'Server info-endpoint',
    'data': {
      'studentName': 'Damian Elenbaas',
      'studentNumber': 2198478,
      'description': 'Welcome at the share-a-meal API'
    }
  });
});

module.exports = router;
