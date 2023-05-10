const logger = require('../utils/logger').logger;
const utils = require('../utils/utils');
const joi = require('joi');
const pool = require('../utils/mysql-db');

let database = require('../utils/database');


const userSchema = joi.object({
  emailAddress: joi.string()
    .pattern(new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
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
  isActive: joi.boolean()
    .required(),
  password: joi.string()
    .min(1)
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
  let result = {};

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
      let insertedId = 0;
      conn.query(
        'INSERT INTO user (firstName, lastName, isActive, emailAddress, password, phoneNumber, street, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [body.firstName, body.lastName, body.isActive, body.emailAddress, body.password, body.phone, body.street, body.city], 
        (sqlError, sqlResults) => {
          if(sqlError) {
            console.log('SQL error: ', sqlError);
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
                console.log('SQL error: ', sqlError);
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
  logger.info('Getting all users')

  if(req.params.length > 2) {
    res.status(400).json({
      'status': 400,
      'message': 'Bad request. Maximum query count is 2.',
      'data': {}
    });
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
 *
 * @param {object} credentials - object that contains emailAddress and password
 * @param {Function} callback - callback function that handles response
 */
user.login = function (credentials, callback) {
  logger.info('Logging into user')
  let result = {};

  logger.debug(`Credentials: ${credentials}`);
  if(!(credentials.hasOwnProperty('emailAddress') 
    && credentials.hasOwnProperty('password'))
  ) {
    logger.debug('Invalid body');
    result.status = 400;
    result.message = "Invalid body";
    result.data = {};
    callback(result);
    return;
  }

  const filtered = database.users.filter(
    item => item.emailAddress == credentials.emailAddress
  );

  if(filtered.length == 0) {
    logger.debug('Account does not exist');
    result.status = 404;
    result.message = "Account with specified email address does not exist";
    result.data = {};
    callback(result);
    return;
  }

  const user = filtered[0];

  if(user.password == credentials.password) {
    logger.debug('Credentials correct, generating token');
    let token = utils.generateRandomString(20);
    database.users.forEach((item) => {
      if(item.emailAddress == user.emailAddress) {
        item.token = token;
      }
    })

    user.token = token;

    result.status = 200;
    result.message = "Logged in succesfully";
    result.data = user;
  } else {
    logger.debug('Invalid credentials');
    result.status = 400;
    result.message = "Invalid credentials";
    result.data = {};
  }

  callback(result);
  return;
}

/**
 * Function that updates user information
 * 
 * @param {string} token - token of logged in user
 * @param {number} userid - id of user you want to update
 * @param {Object} updatedUser - user body with new data
 * @param {Function} callback - callback function that handles response
 */
user.update = function (token, userid, updatedUser, callback) {
  logger.info('Updating user');
  let result = {};

  if(!this.isTokenValid(token)) {
    logger.debug('Invalid token');
    result.status = 401;
    result.message = "Invalid token";
    result.data = {};
    callback(result);
    return;
  }

  let user = database.users.find(item => item.id == userid);

  if(user === undefined) {
    logger.debug('User not found');
    result.status = 404;
    result.message = "User not found";
    result.data = {};
    callback(result);
    return;
  }

  if(!(user.hasOwnProperty('token') && user.token === token)) {
    logger.debug('Not the owner of the user');
    result.status = 403;
    result.message = "You are not the owner of the user";
    result.data = {};
    callback(result);
    return;
  } 
  
  const validation = userSchema.validate(updatedUser);
  if(validation.error) {
    result.status = 400;
    result.message = validation.error.details[0].message;
    result.data = {};
    callback(result);
    return;
  }

  logger.debug('Searching for existing user with specified email address');
  let existingUser = database.users.find(
    (item) => (
      item.emailAddress == updatedUser.emailAddress && 
      item.id != userid
    )
  ); 

  if(existingUser != undefined) {
    logger.debug('Existing user found');
    result.status = 403;
    result.message = 'User with specified email address already exists';
    result.data = {};
    callback(result);
    return;
  }

  logger.debug('No email conflict found, updating user');
  user.firstName = updatedUser.firstName;
  user.lastName = updatedUser.lastName;
  user.street = updatedUser.street;
  user.city = updatedUser.city;
  user.isActive = updatedUser.isActive;
  user.emailAddress = updatedUser.emailAddress;
  user.password = updatedUser.password;
  user.phoneNumber = updatedUser.phoneNumber;

  result.status = 200;
  result.message = "User successfully updated";
  result.data = user; 
  callback(result);
}

/**
 * Function that checks if given token is valid
 *
 * @param {string} token - token of logged in user
 * @returns {boolean} isValid
 */
user.isTokenValid = function (token) {
  logger.debug('Checking token');
  const filtered = database.users.filter(
    item => item.token == token
  );
  return filtered.length != 0;
}

/**
 * Function that gets user by given token
 *
 * @param {string} token - token of logged in user
 * @param {Function} callback - callback that handles response
 */
user.getByToken = function (token, callback) {
  logger.info('Getting user profile by token');
  let result = {};

  const filtered = database.users.filter(
    item => item.token == token
  );

  if(filtered.length == 0) {
    logger.debug('Invalid token');
    result.status = 401;
    result.message = "Invalid token";
    result.data = {};
  } else {
    logger.debug('Profile found');
    result.status = 200;
    result.message = "Profile succesfully received";
    result.data = filtered[0];
  }

  callback(result);
}

/**
 * Function that gets user by given id
 *
 * @param {string} token - token of logged in user
 * @param {number} id - id of user
 * @param {Function} callback - callback that handles response
 */
user.getById = function (token, id, callback) {
  logger.info('Getting user by id');
  let result = {};

  if(!this.isTokenValid(token)) {
    logger.debug('Invalid token');
    result.status = 401;
    result.message = "Invalid token";
    result.data = {}; 
    callback(result);
    return;
  }

  let user = database.users.find(
    item => item.id == id
  );

  if(user == undefined) {
    logger.debug('User not found');
    result.status = 404;
    result.message = "User not found";
    result.data = {}; 
  } else {
    logger.debug('User found');
    // Dirty hack to make a copy without reference
    user = JSON.parse(JSON.stringify(user));
    delete user.password;
    delete user.token;
    
    result.status = 200;
    result.message = "User succesfully found";
    result.data = user;
  }

  callback(result);
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
      console.log('Pool error: ', err);
      return res.status(500).json({
        'status': 500,
        'message': 'Internal server error',
        'data': {}
      });
    } 

    conn.query('SELECT * FROM user WHERE id = ?', [userid], (sqlError, sqlResults) => {
      if(sqlError) {
        console.log('SQL error: ', sqlError);
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
          console.log('SQL error: ', sqlError);
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
