const express = require('express');
const auth = require('../controllers/auth.controller');
const meal = require('../controllers/meal.controller');

const router = express.Router();

router.use(express.json());

router.post('/', auth.validateToken, meal.create);

router.put('/:mealId', auth.validateToken, meal.update);

router.get('/', meal.getAll);

router.get('/:mealId', meal.getById);

router.delete('/:mealId', auth.validateToken, meal.delete);

router.post('/:mealId/participate', auth.validateToken, meal.participate);

router.delete('/:mealId/participate', auth.validateToken, meal.removeParticipant);

router.get('/:mealId/participants', auth.validateToken, meal.getParticipants);

router.get('/:mealId/participants/:participantId', auth.validateToken, meal.getParticipantById);

module.exports = router;
