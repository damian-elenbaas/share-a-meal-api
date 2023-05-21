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
        allergenes += ',';
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
        allergenes 
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

  let mealId = req.params.mealId;
  let payloadId = res.locals.decoded.id;
  let updatedMeal = req.body;

  const validation = required.validate(req.body);
  if(validation.error) {
    return res.status(400).json({
      'status': 400,
      'message': validation.error.details[0].message,
      'data': {}
    });
  }

  if(updatedMeal.dateTime) {
    updatedMeal.dateTime = new Date(updatedMeal.dateTime).toISOString().slice(0, 19).replace('T', ' ');
  } 

  if(updatedMeal.createDate) {
    updatedMeal.createDate = new Date(updatedMeal.createDate).toISOString().slice(0, 19).replace('T', ' ');
  }
  
  if(updatedMeal.updateDate) {
    updatedMeal.updateDate = new Date(updatedMeal.updateDate).toISOString().slice(0, 19).replace('T', ' ');
  }

  let allergenes = '';
  let firstAllergene = true;
  updatedMeal.allergenes.forEach((allergene) => {
    if(!firstAllergene) {
      allergenes += ',';
    }

    allergenes += allergene;

    firstAllergene = false;
  })

  if(allergenes.length > 0) {
    updatedMeal.allergenes = allergenes;
  }

  let sql = "UPDATE meal SET ";
  let fieldCount = 0;
  Object.entries(updatedMeal).forEach(([key, value]) => {
    if(fieldCount == 0) {
      sql = sql + `${key} = ?`;
    } else {
      sql = sql + `, ${key} = ?`;
    }
    fieldCount = fieldCount + 1;
  })
  sql = sql + " WHERE id = ?";

  let values = Object.values(updatedMeal);
  values.push(mealId);

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM meal WHERE id = ?', [mealId], (sqlError, sqlResults) => {
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
          conn.query(
            'SELECT * FROM meal WHERE id = ?', [mealId], (sqlError, sqlResults) => {
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
                'data': sqlResults[0] 
              });
            }
          )
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

      let meals = sqlResults.map((m) => {
        m.isActive = (m.isActive === 1);
        m.isVega = (m.isVega === 1);
        m.isVegan = (m.isVegan === 1);
        m.isToTakeHome = (m.isToTakeHome === 1);

        return m;
      });

      return res.status(200).json({
        'status': 200,
        'message': 'All meals',
        'data': meals 
      })
    })

    pool.releaseConnection(conn);
  });

}

meal.getById = function (req, res) {
  let id = req.params.mealId;

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
      
      let foundedMeal = sqlResults[0];
      foundedMeal.isActive = (foundedMeal.isActive === 1);
      foundedMeal.isVega = (foundedMeal.isVega === 1);
      foundedMeal.isVegan = (foundedMeal.isVegan === 1);
      foundedMeal.isToTakeHome = (foundedMeal.isToTakeHome === 1);

      return res.status(200).json({
        'status': 200,
        'message': `Meal info with ID ${id}`,
        'data': foundedMeal 
      })
    })

    pool.releaseConnection(conn);
  });
}

meal.delete = function (req, res) {
  res.status(404).json({
    'status': 404,
    'message': 'Not implemented yet',
    'data': {}
  });
}

meal.participate = function (req, res) {
  let mealId = req.params.mealId;
  let payloadId = res.locals.decoded.id;

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM meal WHERE id = ?', [mealId], (sqlError, sqlResults) => {
      if(sqlError) {
        logger.error(sqlError);
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        });
      }

      if(sqlResults.length == 0) {
        return res.status(404).json({
          'status': 404,
          'message': 'Meal not found',
          'data': {}
        });
      }

      let requestedMeal = sqlResults[0];

      conn.query(
        `SELECT COUNT(*) as 'count' FROM meal_participants_user WHERE mealId = ?`, 
        [mealId],
        (sqlError, sqlResults) => {
          if(sqlError) {
            logger.error(sqlError);
            return res.status(500).json({
              'status': 500,
              'message': 'Internal server error',
              'data': {}
            });
          }

          if(sqlResults.length == 0) {
            return res.status(500).json({
              'status': 500,
              'message': 'Internal server error',
              'data': {}
            });
          }

          if(sqlResults[0].count >= requestedMeal.maxAmountOfParticipants) {
            return res.status(200).json({
              'status': 200,
              'message': 'Maximum aantal aanmeldingen is bereikt',
              'data': {}
            })
          }

          conn.query(
            'INSERT INTO meal_participants_user (mealId, userId) VALUES (?, ?)', 
            [mealId, payloadId],
            (sqlError, sqlResults) => {
              if(sqlError) {
                if(sqlError.code == 'ER_DUP_ENTRY') {
                  return res.status(200).json({
                    'status': 200,
                    'message': `User met ID ${payloadId} is aangemeld voor maaltijd met ID ${mealId}`,
                    'data': {}
                  })
                }

                logger.error(sqlError);
                return res.status(500).json({
                  'status': 500,
                  'message': 'Internal server error',
                  'data': {}
                });
              }

              return res.status(200).json({
                'status': 200,
                'message': `User met ID ${payloadId} is aangemeld voor maaltijd met ID ${mealId}`,
                'data': {}
              })
            }
          )
        })
    });
    pool.releaseConnection(conn);
  });
}

meal.removeParticipant = function (req, res) {
  let mealId = req.params.mealId;
  let payloadId = res.locals.decoded.id;

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM meal WHERE id = ?', [mealId], (sqlError, sqlResults)=> {
      if(sqlError) {
        logger.error(sqlError);
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        });
      }

      if(sqlResults.length == 0) {
        return res.status(404).json({
          'status': 404,
          'message': 'Meal not found',
          'data': {}
        });
      }

      conn.query(
        'SELECT * FROM meal_participants_user WHERE mealId = ? AND userId = ?',
        [mealId, payloadId], 
        (sqlError, sqlResults) => {
          if(sqlError) {
            logger.error(sqlError);
            return res.status(500).json({
              'status': 500,
              'message': 'Internal server error',
              'data': {}
            });
          }

          if(sqlResults.length == 0) {
            return res.status(404).json({
              'status': 404,
              'message': 'Participation not found',
              'data': {}
            });
          }

          conn.query(
            'DELETE FROM meal_participants_user WHERE mealId = ? AND userId = ?',
            [mealId, payloadId],
            (sqlError, sqlResults) => {
              if(sqlError) {
                logger.error(sqlError);
                return res.status(500).json({
                  'status': 500,
                  'message': 'Internal server error',
                  'data': {}
                });
              }

              return res.status(200).json({
                'status': 200,
                'message': `User met ID ${payloadId} succesvol afgemeld voor meal met ID ${mealId}`,
                'data': {}
              })
            }
          )
        });
    });
    pool.releaseConnection(conn);
  });
}

meal.getParticipants = function (req, res) {
  res.status(404).json({
    'status': 404,
    'message': 'Not implemented yet',
    'data': {}
  });
}

meal.getParticipantById = function (req, res) {
  res.status(404).json({
    'status': 404,
    'message': 'Not implemented yet',
    'data': {}
  });
}

module.exports = meal;
