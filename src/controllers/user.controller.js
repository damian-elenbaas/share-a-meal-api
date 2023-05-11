const { logger, privateKey } = require('../utils/utils');
const joi = require('joi');
const pool = require('../utils/mysql-db');
const jwt = require('jsonwebtoken');

let database = require('../utils/database');


const userSchema = joi.object({
  emailAddress: joi.string()
    .pattern(new RegExp(/^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/))
    .message('Invalid email address')
    .required(),
  firstName: joi.string()
    .required(),
  lastName: joi.string()
    .required(),
  street: joi.string()
    .required(),
  city: joi.string()
    .required(),
  isActive: joi.boolean(),
  // TODO: minsts 1 hoofd letter en 1 cijfer
  password: joi.string()
    .min(8)
    .required(),
  phoneNumber: joi.string()
    .pattern(new RegExp(/^\+(?:[0-9] ?){6,14}[0-9]$/))
    .message('Invalid phone number')
    .required(),
  token: joi.string()
})

let user = {};

/**
 * Function that creates a new user
 *
 * @param {object} body - body that contains emailAddress, firstName, lastName, street, city, isActive, password and phoneNumber
 * @param {Function} callback - callback that handles response
 */
user.create = function (req, res) {
  logger.info('Creating user');

  let body = req.body;

  const validation = userSchema.validate(body);
  if(validation.error) {
    return res.status(400).json({
      'status': 400,
      'message': validation.error.details[0].message,
      'data': {}
    });
  }

  pool.getConnection((err, conn) => {
    if(err) {
      return res.status(500).json({
        'status': 500,
        'message': err.message,
        'data': {}
      });
    } else {

      conn.query(
        'INSERT INTO user (firstName, lastName, isActive, emailAddress, password, phoneNumber, street, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [body.firstName, body.lastName, body.isActive, body.emailAddress, body.password, body.phone, body.street, body.city], 
        (sqlError, sqlResults) => {
          if(sqlError) {
            logger.error('SQL error: ', sqlError);
            if(sqlError.code == 'ER_DUP_ENTRY') {
              logger.debug('Email address already in use');
              return res.status(403).json({
                'status': 403,
                'message': 'User with specified email address already exists',
                'data': {}
              })
            } else {
              return res.status(403).json({
                'status': 500,
                'message': 'Internal server error',
                'data': {}
              })
            }
          } else {
            conn.query(`SELECT * FROM user WHERE id = ${sqlResults.insertId}`, (sqlError, sqlResults) => {
              if(sqlError) {
                logger.error('SQL error: ', sqlError);
                return res.status(500).json({
                  'status': 500,
                  'message': 'Internal server error',
                  'data': {}
                })
              } else {
                return res.status(201).json({
                  'status': 201,
                  'message': 'User successfully registered',
                  'data': sqlResults[0]
                });
              }
            });
          }
      });

    }
  });
}

/**
 * Function that gets all existing users with setted filter options
 */
user.getAll = function (req, res) {
  logger.info('Getting all users');
  logger.info('Params:', req.query);

  const queryFields = Object.entries(req.query);

  if(queryFields.length > 2) {
    res.status(400).json({
      'status': 400,
      'message': 'Bad request. Maximum query count is 2.',
      'data': {}
    });
  }

  if(queryFields.length > 0) {
    logger.log('Filter fields found');
    let schema = userSchema.describe().keys;
    for(const [field, value] of queryFields) {
      if(!Object.keys(schema).includes(field)) {
        return res.status(400).json({
          'status': 400,
          'message': `Bad request. ${field} field does not exist`,
          'data': {}
        })
      }
    }
  }

  let query = req.query;

  // TODO: Add filtering feature to DB

  pool.getConnection((err, conn) => {
    if(err) {
      res.status(500).json({
        'status': 500,
        'message': err.message,
        'data': {}
      })
    } else {
      conn.query(
        'SELECT * FROM `user`',
        (err, results, fields) => {
          if(err) {
            res.status(500).json({
              'status': 500,
              'message': err.message,
              'data': {}
            })
          } else {
            res.status(200).json({
              'status': 200,
              'message': 'All users',
              'data': results
            })
          }
        }
      )
    }
  })
}

/**
 * Function that logs in user
 */
user.login = function (req, res) {
  logger.log(`[POST] /api/login`);
  logger.info('Logging into user')

  let credentials = req.body;

  logger.debug(`Credentials: ${credentials}`);
  if(!(credentials.hasOwnProperty('emailAddress') 
    && credentials.hasOwnProperty('password'))
  ) {
    logger.debug('Invalid body');
    return res.status(400).json({
      'status': 400,
      'message': 'Invalid body',
      'data': {}
    });
  }

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error('Pool error:', err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM user WHERE emailAddress = ?', [credentials.emailAddress], (sqlError, sqlResults) => {
      if(sqlError) {
        logger.error('SQL error:', sqlError);
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        });
      }

      if(sqlResults.length == 0) {
        return res.status(404).json({
          'status': 404,
          'message': 'Account with specified email address does not exist',
          'data': {}
        });
      }

      const { password, ...user } = sqlResults[0];

      if(credentials.password == password) {
        logger.log('Signing token');
        jwt.sign({ 'id': user.id }, privateKey, (err, token) => {
          if(err) {
            logger.error('JWT error:', err);
            return res.status(500).json({
              'status': 500,
              'message': 'Internal server error',
              'data': {}
            });
          }
          return res.status(200).json({
            'status': 200,
            'message': 'Logged in succesfully',
            'data': { ...user, token }
          })
        });
      } else {
        return res.status(404).json({
          'status': 400,
          'message': 'Invalid credentials',
          'data': {}
        });
      }
    });
  });
}

/**
 * Function that updates user information
 */
user.update = function (req, res) {
  logger.log(`[PUT] /api/user/${req.params.userid}`);
  logger.info('Updating user');

  // TODO: Implement JWT validation

  let userid = req.params.userid;

  const validation = userSchema.validate(body);
  if(validation.error) {
    return res.status(400).json({
      'status': 400,
      'message': validation.error.details[0].message,
      'data': {}
    });
  }

  pool.getConnection((err, conn) => {
    if(err) {
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM user WHERE id = ?', [userid], (sqlError, sqlResults) => {
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
          'message': 'User not found',
          'data': {}
        });
      }

      conn.query('UPDATE user SET firstName = ?, lastName = ?, isActive = ?, emailAddress = ?, password = ?, phoneNumber = ?, street = ?, city = ?',
        [body.firstName, body.lastName, body.isActive, body.emailAddress, body.password, body.phone, body.street, body.city],
        (sqlError, sqlResults) => {
          if(sqlError) {
            return res.status(403).json({
              'status': 403,
              'message': 'User with specified email address already exists',
              'data': {}
            });
          }

          return res.status(200).json({
            'status': 200,
            'message': 'User successfully updated',
            'data': {}
          });
      });
    });
  });
}

/**
 * Function that gets user by given token
 */
user.getByToken = function (req, res) {
  logger.info('Getting user profile by token');

  let id =  res.locals.decoded;
  logger.log(id);

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error('Pool error:', err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM user WHERE id = ?', [id], (sqlError, sqlResults) => {
      if(sqlError) {
        logger.error('SQL error:', sqlError);
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        });
      }

      if(sqlResults.length == 0) {
        return res.status(401).json({
          'status': 401,
          'message': 'Invalid token',
          'data': {}
        });
      }

      let user = sqlResults[0];
      
      const { password, ...userInfo } = user;

      res.status(200).json({
        'status': 200,
        'message': 'Profile found',
        'data': userInfo 
      })
    })
  });

  logger.debug('Profile found');
  result.status = 200;
  result.message = "Profile succesfully received";
  result.data = filtered[0];
}

/**
 * Function that gets user by given id
 */
user.getById = function (req, res) {
  logger.log(`[GET] /api/user/${req.params.userid}`);

  logger.info('Getting user by id');

  let userid = req.params.userid;

  // TODO: Implement JWT
  //
  // if(!this.isTokenValid(token)) {
  //   logger.debug('Invalid token');
  //   result.status = 401;
  //   result.message = "Invalid token";
  //   result.data = {}; 
  //   callback(result);
  //   return;
  // }

  pool.getConnection((err, conn) => {
    if(err) {
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM user WHERE id = ?', [userid], (sqlError, sqlResults) => {
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
          'message': 'User not found',
          'data': {}
        });
      }

      return res.status(200).json({
        'status': 200,
        'message': 'User successfully found',
        'data': sqlResults[0]
      });
    });
  });
}

/**
 * Deletes user with given id
  */
user.delete = function (req, res) {
  logger.log(`[DELETE] /api/user/${req.params.userid}`);
  logger.info('Deleting user');

  // TODO: Implement JWT
  // if(!this.isTokenValid(token)) {
  //   logger.debug('Token invalid');
  //   result.status = 401;
  //   result.message = 'Invalid token';
  //   result.data = {}; 
  //   callback(result);
  //   return;
  // }

  let userid = req.params.userid;

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error('Pool error: ', err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    } 

    conn.query('SELECT * FROM user WHERE id = ?', [userid], (sqlError, sqlResults) => {
      if(sqlError) {
        logger.error('SQL error: ', sqlError);
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        });
      }

      if(sqlResults.length == 0) {
        return res.status(404).json({
          'status': 404,
          'message': `User with ID ${userid} is not found`,
          'data': {}
        });
      }

      // TODO: Check if current user is owner of requested user (403)
      //
      // if(user.token != token) {
      //   logger.debug('Not the owner of the user');
      //   result.status = 403;
      //   result.message = `You are not the owner of user with ID ${userid}`;
      //   result.data = {}; 
      //   callback(result);
      //   return;
      // }
      
      conn.query('DELETE FROM user WHERE id = ?', [userid], (sqlError, sqlResults) => {
        if(sqlError) {
          logger.error('SQL error: ', sqlError);
          return res.status(500).json({
            'status': 500,
            'message': 'Internal server error',
            'data': {}
          });
        }

        return res.status(200).json({
          'status': 200,
          'message': `User with ID ${userid} is deleted`,
          'data': {}
        });
      });
    })
  });
}

module.exports = user;
