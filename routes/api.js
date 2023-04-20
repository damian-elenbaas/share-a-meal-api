const express = require('express');
const router = express.Router();
const user = require('../data/user');

router.use(express.json());

router.post('/login', (req, res) => {
  user.login(req.body, (result) => {
    res.status(result.status).json(result);
  })
})

router.get('/info', (req, res) => {
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

// POST: Create user
router.post('/register', (req, res) => {
  user.create(req.body, (result) => {
    res.status(result.status).json(result);
  });
});

module.exports = router;
