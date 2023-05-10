const express = require('express');
const logger = require('../utils/logger').logger;
const router = express.Router();
const user = require('../controllers/user.controller');

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
router.delete('/:userid', user.delete);

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
router.get('/', user.getAll);

// POST: Create user
router.post('/', user.create);

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
  logger.debug('Send authorization error');
  res.status(400).json({
    'status': 400,
    'message': 'Authorization header required',
    'data': {}
  });
  return;
}

module.exports = router;
