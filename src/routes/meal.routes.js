const express = require('express');
const auth = require('../controllers/auth.controller');
const meal = require('../controllers/meal.controller');

const router = express.Router();

router.use(express.json());

router.post('/', auth.validateToken, meal.create);

router.put('/:mealid', auth.validateToken, meal.update);

router.get('/', meal.getAll);

router.get('/:mealid', meal.getById);

router.delete('/:mealid', auth.validateToken, meal.delete);

module.exports = router;
