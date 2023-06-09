const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');

router.use(express.json());

// PUT: Update logged in user
router.put('/:userid', auth.validateToken, user.update);

// DELETE: Delete logged in user
router.delete('/:userid', auth.validateToken, user.delete);

// GET: Get logged in user
router.get('/profile', auth.validateToken, user.getByToken);

// GET: Get all users
router.get('/', auth.validateToken, user.getAll);

// POST: Create user
router.post('/', user.create);

// GET: Get user profile by id
router.get('/:userid', auth.validateToken, user.getById);

module.exports = router;
