const pool = require('../utils/mysql-db');
const { logger } = require('../utils/utils');
const joi = require('joi');

const mealSchema = joi.object({
  isActive: joi.boolean(),
  isVega: joi.boolean(),
  isVegan: joi.boolean(),
  isToTakeHome: joi.boolean(),
  dateTime: joi.date(),
  maxAmountOfParticipants: joi.number()
    .required(),
  price: joi.number()
    .required(),
  imageUrl: joi.string()
    .required(),
  cookId: joi.number(),
  createDate: joi.date(),
  updateDate: joi.date(),
  name: joi.string()
    .required(),
  description: joi.string()
    .required(),
  allergenes: joi.string().valid('gluten', 'lactose', 'noten')
});

let meal = {};

meal.create = function (req, res) {
  const newMeal = req.body;
  const userid = res.locals.decoded.id;
  
  const validation = mealSchema.validate(newMeal);
  if(validation.error) {
    return res.status(400).json({
      'status': 400,
      'message': validation.error.details[0].message,
      'data': {}
    });
  }

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': err.message,
        'data': {}
      });
    } 

    conn.query(`INSERT INTO MEAL 
        (isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, createDate, updateDate, name, description, allergenes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newMeal.isActive || false,
        newMeal.isVega || false,
        newMeal.isVegan || false,
        newMeal.isToTakeHome || true,
        newMeal.dateTime || new Date().toISOString(),
        newMeal.maxAmountOfParticipants || 6,
        newMeal.price || 0.00,
        newMeal.imageUrl || '',
        userid,
        newMeal.createDate || new Date().toISOString(),
        newMeal.updateDate || new Date().toISOString(),
        newMeal.name || '',
        newMeal.description || '',
        newMeal.allergenes || '' 
      ],
      (sqlError, sqlResults) => {
        if(sqlError) {
          logger.error(sqlError);
          return res.status(500).json({
            'status': 500,
            'message': 'Internal server error',
            'data': {}
          });
        }

        let insertedId = sqlResults.insertId;

        res.status(200).json({
          'status': 200,
          'message': 'Meal successfully added',
          'data': { id: insertedId, ...newMeal }
        })
      }
    )
  });
}

meal.update = function (req, res) {
  res.status(200).json({
    'status': 200,
    'message': 'Not implemented yet',
    'data': {}
  })
}

meal.getAll = function (req, res) {
  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      })
    }

    conn.query('SELECT * FROM meal', (sqlError, sqlResults) => {
      if(sqlError) {
        logger.error(sqlError);
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        })
      }

      return res.status(200).json({
        'status': 200,
        'message': 'All meals',
        'data': sqlResults
      })
    })

    pool.releaseConnection(conn);
  });

}

meal.getById = function (req, res) {
  let id = req.params.mealid;

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      })
    }

    conn.query('SELECT * FROM meal WHERE id = ?', [id], (sqlError, sqlResults) => {
      if(sqlError) {
        logger.error(sqlError);
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        })
      }

      return res.status(200).json({
        'status': 200,
        'message': `Meal info with ID ${id}`,
        'data': sqlResults[0]
      })
    })

    pool.releaseConnection(conn);
  });
}

meal.delete = function (req, res) {
  res.status(200).json({
    'status': 200,
    'message': 'Not implemented yet',
    'data': {}
  })
}

module.exports = meal;
