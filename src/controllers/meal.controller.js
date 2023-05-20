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
  allergenes: joi.array().items(joi.string().valid('gluten', 'lactose', 'noten'))
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

    let dateTime, createDate, updateDate;

    if(newMeal.dateTime) {
      dateTime = new Date(newMeal.dateTime).toISOString().slice(0, 19).replace('T', ' ');
    } else {
      dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    if(newMeal.createDate) {
      createDate = new Date(newMeal.createDate).toISOString().slice(0, 19).replace('T', ' ');
    } else {
      createDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    if(newMeal.updateDate) {
      updateDate = new Date(newMeal.updateDate).toISOString().slice(0, 19).replace('T', ' ');
    } else {
      updateDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    let allergenes = '';
    let firstAllergene = true;
    newMeal.allergenes.forEach((allergene) => {
      if(!firstAllergene) {
        allergenes += ', ';
      }

      allergenes += allergene;

      firstAllergene = false;
    })

    conn.query(`INSERT INTO meal 
        (isActive, isVega, isVegan, isToTakeHome, dateTime, maxAmountOfParticipants, price, imageUrl, cookId, createDate, updateDate, name, description, allergenes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newMeal.isActive || false,
        newMeal.isVega || false,
        newMeal.isVegan || false,
        newMeal.isToTakeHome || true,
        dateTime,
        newMeal.maxAmountOfParticipants || 6,
        newMeal.price || 0.00,
        newMeal.imageUrl || '',
        userid,
        createDate,
        updateDate,
        newMeal.name || '',
        newMeal.description || '',
        `'${newMeal.allergenes}'` || '' 
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

        res.status(201).json({
          'status': 201,
          'message': 'Meal successfully added',
          'data': { id: insertedId, ...newMeal }
        })
      }
    )
  });
}

meal.update = function (req, res) {
  const required = joi.object({
    isActive: joi.boolean(),
    isVega: joi.boolean(),
    isVegan: joi.boolean(),
    isToTakeHome: joi.boolean(),
    dateTime: joi.date(),
    maxAmountOfParticipants: joi.number()
    .required(),
    price: joi.number()
    .required(),
    imageUrl: joi.string(),
    cookId: joi.number(),
    createDate: joi.date(),
    updateDate: joi.date(),
    name: joi.string()
    .required(),
    description: joi.string(),
    allergenes: joi.array().items(joi.string().valid('gluten', 'lactose', 'noten'))
  });

  let mealid = req.params.mealid;
  let payloadId = res.locals.decoded.id;

  const validation = required.validate(req.body);
  if(validation.error) {
    return res.status(400).json({
      'status': 400,
      'message': validation.error.details[0].message,
      'data': {}
    });
  }

  let sql = "UPDATE meal SET ";
  let fieldCount = 0;
  Object.entries(req.body).forEach(([key, value]) => {
    const keys = Object.entries(required.describe().keys);
    keys.forEach(([field, props]) => {
      if(field == key) {
        if(fieldCount == 0) {
          sql = sql + `${field} = ?`;
        } else {
          sql = sql + `, ${field} = ?`;
        }
        fieldCount = fieldCount + 1;
      }
    })
  })
  sql = sql + " WHERE id = ?";

  let values = Object.values(req.body);
  values.push(mealid);

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM meal WHERE id = ?', [mealid], (sqlError, sqlResults) => {
      if(sqlError) {
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        });
      }

      if(sqlResults.length == 0) {
        return res.status(404).json({
          'status': 404,
          'message': 'Maaltijd niet gevonden',
          'data': {}
        });
      }

      const m = sqlResults[0];
      if(m.cookId != payloadId) {
        return res.status(403).json({
          'status': 403,
          'message': 'Je bent niet de eigenaar van de maaltijd',
          'data': {}
        });
      }

      conn.query(
        sql,
        values,
        (sqlError, sqlResults) => {
          if(sqlError) {
            return res.status(500).json({
              'status': 500,
              'message': 'Internal server error',
              'data': {}
            });
          }

          return res.status(200).json({
            'status': 200,
            'message': 'Maaltijd succesvol gewijzigd',
            'data': {}
          });
        }
      );
    });
    pool.releaseConnection(conn);
  });
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

      if(sqlResults.length == 0) {
        return res.status(404).json({
          'status': 404,
          'message': 'Meal not found',
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
