const { logger, privateKey } = require('../utils/utils');
const joi = require('joi');
const pool = require('../utils/mysql-db');
const jwt = require('jsonwebtoken');

const userSchema = joi.object({
  emailAddress: joi.string()
    // Realistic email pattern, but not requested by design
    // .pattern(new RegExp(/^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/))
    .pattern(new RegExp(/^[a-zA-Z]{1}\.[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,3}$/))
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
  password: joi.string()
    .min(8)
    .pattern(new RegExp(/^(?=.*[A-Z])(?=.*[0-9]).+$/))
    .required(),
  phoneNumber: joi.string()
    // Realistic phone pattern, but not requested by design
    // .pattern(new RegExp(/^\+(?:[0-9] ?){6,14}[0-9]$/))
    .pattern(new RegExp(/^06[-\s]?\d{8}$/))
    .message('Invalid phone number')
    .required()
})

let user = {};

/**
 * Function that creates a new user
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
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': err.message,
        'data': {}
      });
    } else {

      conn.query(
        'INSERT INTO user (firstName, lastName, isActive, emailAddress, password, phoneNumber, street, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [body.firstName, body.lastName, body.isActive, body.emailAddress, body.password, body.phoneNumber, body.street, body.city], 
        (sqlError, sqlResults) => {
          if(sqlError) {
            if(sqlError.code == 'ER_DUP_ENTRY') {
              logger.debug('Email address already in use');
              return res.status(403).json({
                'status': 403,
                'message': 'Er bestaat al een user met opgegeven email adres',
                'data': {}
              })
            } else {
              logger.error(sqlError);
              return res.status(500).json({
                'status': 500,
                'message': 'Internal server error',
                'data': {}
              })
            }
          } else {
            conn.query(`SELECT * FROM user WHERE id = ${sqlResults.insertId}`, (sqlError, sqlResults) => {
              if(sqlError) {
                logger.error(sqlError);
                return res.status(500).json({
                  'status': 500,
                  'message': 'Internal server error',
                  'data': {}
                })
              } else {
                let newUser = sqlResults[0];
                let { isActive } = newUser;
                isActive = (isActive === 1);
                newUser.isActive = isActive;
                return res.status(201).json({
                  'status': 201,
                  'message': 'User succesvol geregistreerd',
                  'data': newUser 
                });
              }
            });
          }
      });

    }
    pool.releaseConnection(conn);
  });
}

/**
 * Function that gets all existing users with setted filter options
 */
user.getAll = function (req, res) {
  const queryFields = Object.entries(req.query);

  if(queryFields.length > 2) {
    res.status(400).json({
      'status': 400,
      'message': 'Bad request. Maximum query count is 2.',
      'data': {}
    });
  }

  if(queryFields.length > 0) {
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

            let users = [];
            results.forEach((u) => {
              const { password, ...userinfo } = u;
              users.push(userinfo);
            })

            res.status(200).json({
              'status': 200,
              'message': 'Alle users',
              'data': users 
            })
          }
        }
      )
    }
    pool.releaseConnection(conn);
  })
}

/**
 * Function that logs in user
 */
user.login = function (req, res) {
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
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM user WHERE emailAddress = ?', [credentials.emailAddress], (sqlError, sqlResults) => {
      if(sqlError) {
        return res.status(500).json({
          'status': 500,
          'message': 'Internal server error',
          'data': {}
        });
      }

      if(sqlResults.length == 0) {
        return res.status(400).json({
          'status': 400,
          'message': 'Niet valide wachtwoord',
          'data': {}
        });
      }

      let { password, isActive, ...user } = sqlResults[0];
      isActive = (isActive === 1);

      if(credentials.password == password) {
        logger.log('Signing token');
        jwt.sign({ 'id': user.id }, privateKey, (err, token) => {
          if(err) {
            return res.status(500).json({
              'status': 500,
              'message': 'Internal server error',
              'data': {}
            });
          }
          return res.status(200).json({
            'status': 200,
            'message': 'Succesvol ingelogd',
            'data': { ...user, isActive, token }
          })
        });
      } else {
        return res.status(404).json({
          'status': 400,
          'message': 'Niet valide wachtwoord',
          'data': {}
        });
      }
    });
    pool.releaseConnection(conn);
  });
}

/**
 * Function that updates user information
 */
user.update = function (req, res) {
  logger.info('Updating user');

  let userid = req.params.userid;
  let payloadId = res.locals.decoded.id;

  const required = joi.object({
    emailAddress: joi.string()
    // Realistic email pattern, but not requested by design
    // .pattern(new RegExp(/^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/))
    .pattern(new RegExp(/^[a-zA-Z]{1}\.[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,3}$/))
    .message('Invalid email address')
    .required(),
    firstName: joi.string(),
    lastName: joi.string(),
    street: joi.string(),
    city: joi.string(),
    isActive: joi.boolean(),
    password: joi.string()
    .min(8)
    .pattern(new RegExp(/^(?=.*[A-Z])(?=.*[0-9]).+$/)),
    phoneNumber: joi.string()
    // Realistic phone pattern, but not requested by design
    // .pattern(new RegExp(/^\+(?:[0-9] ?){6,14}[0-9]$/))
    .pattern(new RegExp(/^06[-\s]?\d{8}$/))
    .message('Invalid phone number')
  })

  if(userid !== payloadId) {
    return res.status(403).json({
      'status': 403,
      'message': 'Je bent niet de eigenaar van de gebruiker',
      'data': {}
    });
  }

  const validation = required.validate(req.body);
  if(validation.error) {
    return res.status(400).json({
      'status': 400,
      'message': validation.error.details[0].message,
      'data': {}
    });
  }
  
  let sql = "UPDATE user SET ";
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
  values.push(userid);

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
          'message': 'User niet gevonden',
          'data': {}
        });
      }

      if(userid != payloadId) {
        return res.status(403).json({
          'status': 403,
          'message': 'Je bent niet de eigenaar van de user',
          'data': {}
        });
      }

      conn.query(
        sql,
        values,
        (sqlError, sqlResults) => {
          if(sqlError) {
            return res.status(403).json({
              'status': 403,
              'message': 'User met gegeven email adres bestaat al',
              'data': {}
            });
          }

          conn.query(
            'SELECT * FROM user WHERE id = ?',
            [userid],
            (sqlError, sqlResults) => {
              if(sqlError) { 
                return res.status(500).json({
                  'status': 500,
                  'message': 'Internal server error',
                  'data': {}
                });
              }

              let { password, ...updatedUser } = sqlResults[0];

              return res.status(200).json({
                'status': 200,
                'message': 'User succesvol geüpdatet',
                'data': updatedUser
              });
            }
          );
      });
    });
    pool.releaseConnection(conn);
  });
}

/**
 * Function that gets user by given token
 */
user.getByToken = function (req, res) {
  logger.info('Getting user profile by token');

  let id = res.locals.decoded.id;

  pool.getConnection((err, conn) => {
    if(err) {
      logger.error(err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    }

    conn.query('SELECT * FROM user WHERE id = ?', [id], (sqlError, sqlResults) => {
      if(sqlError) {
        logger.error(sqlError);
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

      res.status(200).json({
        'status': 200,
        'message': 'Profiel gevonden',
        'data': user 
      })
    })
    pool.releaseConnection(conn);
  });
}

/**
 * Function that gets user by given id
 */
user.getById = function (req, res) {
  logger.info('Getting user by id');

  let userid = req.params.userid;
  let payloadId = res.locals.decoded.id;

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
          'message': 'User niet gevonden',
          'data': {}
        });
      }

      let { password, ...userinfo } = sqlResults[0];
      
      if(userid == payloadId) {
        userinfo = { ...userinfo, password };
      }

      return res.status(200).json({
        'status': 200,
        'message': 'User succesvol gevonden',
        'data': userinfo 
      });
    });
    pool.releaseConnection(conn);
  });
}

/**
 * Deletes user with given id
  */
user.delete = function (req, res) {
  logger.info('Deleting user');

  let userid = req.params.userid;
  let payloadId = res.locals.decoded.id;

  if(userid !== payloadId) {
    return res.status(403).json({
      'status': 403,
      'message': 'Je bent niet de eigenaar van de gebruiker',
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
          'message': `Gebruiker met ID ${userid} is niet gevonden`,
          'data': {}
        });
      }

      if(userid != payloadId) {
        return res.status(403).json({
          'status': 403,
          'message': `Je bent niet de eigenaar van de user`,
          'data': {}
        });
      }
      
      conn.query('DELETE FROM user WHERE id = ?', [userid], (sqlError, sqlResults) => {
        if(sqlError) {
          return res.status(500).json({
            'status': 500,
            'message': 'Internal server error',
            'data': {}
          });
        }

        return res.status(200).json({
          'status': 200,
          'message': `Gebruiker met ID ${userid} is verwijderd`,
          'data': {}
        });
      });
    })
    pool.releaseConnection(conn);
  });
}

module.exports = user;
