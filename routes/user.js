const express = require('express');
const logger = require('../utils/logger').logger;
const router = express.Router();
const user = require('../data/user');

router.use(express.json());

// PUT: Update logged in user
router.put('/:userid', (req, res) => {
  logger.log(`[PUT] /api/user/${req.params.userid}`);

  let token = req.get('Authorization');
  if(token == undefined) {
    sendAuthorizationError(res);
    return;
  }

  let id = req.params.userid;

  user.update(token, id, req.body, (response) => {
    res.status(response.status).json(response);
  })
});

// DELETE: Delete logged in user
router.delete('/:userid', (req, res) => {
  logger.log(`[DELETE] /api/user/${req.params.userid}`);
  let token = req.get('Authorization');
  if(token == undefined) {
    sendAuthorizationError(res);
    return;
  }

  let id = req.params.userid;

  user.delete(token, id, (response) => {
    res.status(response.status).json(response);
  })
});

// GET: Get logged in user
router.get('/profile', (req, res) => {
  logger.log(`[GET] /api/user/profile`);
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
  logger.log(`[GET] /api/user/`);
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
  logger.log(`[GET] /api/user/${req.params.userid}`);
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
