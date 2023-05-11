const express = require('express');
const logger = require('../utils/logger').logger;
const router = express.Router();
const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');

router.use(express.json());

// PUT: Update logged in user
router.put('/:userid', auth.validateToken, user.update);

// DELETE: Delete logged in user
router.delete('/:userid', auth.validateToken, user.delete);

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
router.get('/', auth.validateToken, user.getAll);

// POST: Create user
router.post('/', user.create);

// GET: Get user profile by id
router.get('/:userid', auth.validateToken, user.getById);

module.exports = router;
