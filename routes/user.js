const express = require('express');
const router = express.Router();
const user = require('../data/user');

router.use(express.json());

// PUT: Update logged in user
router.put('/:userid', (req, res) => {
  res.send('/user PUT request received');
});

// DELETE: Delete logged in user
router.delete('/', (req, res) => {
  res.send('/user DELETE request received');
});

// GET: Get logged in user
router.get('/profile', (req, res) => {
  let token = req.get('Authorization');
  if(token == undefined) {
    sendAuthorizationError(res);
    return;
  }

  user.getByToken(token, (result) => {
    res.status(result.status).json(result);
  })
});

// GET: Get all users
router.get('/', (req, res) => {
  let token = req.get('Authorization');
  if(token == undefined) {
    sendAuthorizationError(res);
    return;
  }

  if(req.params.length > 2) {
    res.status(400).json({
      'status': 400,
      'message': 'Bad request. Maximum query count is 2.',
      'data': {}
    })
  }

  user.getAll(token, req.query, function (result) {
    res.status(result.status).json(result);
  });
});

// GET: Get user profile by id
router.get('/:userid', (req, res) => {
  let token = req.get('Authorization');
  if(token == undefined) {
    sendAuthorizationError(res);
    return;
  }

  let id = req.params.userid;

  user.getById(token, id, (result) => {
    res.status(result.status).json(result);
  })
});

function sendAuthorizationError(res) {
    res.status(400).json({
      'status': 400,
      'message': 'Authorization header required',
      'data': {}
    });
    return;
}

module.exports = router;
