const logger = require('../utils/logger').logger;
const validators = require('../utils/validators');
const utils = require('../utils/utils');
const joi = require('joi');

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
user.create = function (body, callback) {
  logger.info('Creating user');
  let result = {};

  const validation = userSchema.validate(body);
  if(validation.error) {
    result.status = 400;
    result.message = validation.error.details[0].message;
    result.data = {};
    callback(result);
    return;
  }

  logger.debug('Searching for existing user');
  let existingUser = database.users.find((item) => item.emailAddress == body.emailAddress); 

  if(existingUser != undefined) {
    logger.debug('Email address already in use');
    result.status = 403;
    result.message = 'User with specified email address already exists';
    result.data = {};
    callback(result);
    return;
  }

  logger.debug('Adding user to database');
  let lastId = database.users[database.users.length - 1].id;
  let newUser = {
    'id': lastId + 1,
    'firstName': body.firstName,
    'lastName': body.lastName,
    'street': body.street,
    'city': body.city,
    'isActive': body.isActive,
    'emailAddress': body.emailAddress,
    'password': body.password,
    'phoneNumber': body.phoneNumber
  };
  database.users.push(newUser);

  result.status = 201;
  result.message = 'User succesfully registered';
  result.data = newUser;
  callback(result);
}

/**
 * Function that gets all existing users with setted filter options
 *
 * @param {string} token - token of logged in user
 * @param {object} query - object that can contain fitler properties
 * @param {Function} callback - callback that handles response
 */
user.getAll = function (token, query, callback) {
  logger.info('Getting all users')
  let result = {};

  const filteredUsers = database.users.filter(item => item.hasOwnProperty('token') && item.token == token);
  if(filteredUsers.length == 0) {
    logger.debug('Invalid token');
    result.status = 401;
    result.message = 'Invalid token';
    result.data = {};
    callback(result);
    return;
  }

  logger.debug(`Query: ${query}`);

  if(Object.keys(query).length > 0){
    let data = database.users;

    for (const [key, value] of Object.entries(query)) {
      logger.debug(`Filtering on ${key} with ${value}`);
      if(!data[0].hasOwnProperty(`${key}`)) {
        logger.debug(`Property doesn't exists`);
        result.status = 200;
        result.message = 'All users';
        result.data = {};
        callback(result);
        return;
      }
      data = data.filter(item => {
        if(typeof item[`${key}`] === 'boolean') {
          return item[`${key}`] === JSON.parse(value);
        } else {
          return item[`${key}`].toLowerCase().includes(value.toLowerCase());
        }
      });
    }

    result.status = 200;
    result.message = 'All users';
    result.data = data;
  } else {
    result.status = 200;
    result.message = 'All users';
    result.data = database.users;
  }

  logger.debug('Removing password and token from data');
  // Doens't work without copy: removes password and token permanently because of reference to database.users
  // Dirty hack to make a copy without reference
  result.data = JSON.parse(JSON.stringify(result.data));
  result.data = result.data.map((item) => {
    delete item.password;
    delete item.token;

    return item;
  })

  callback(result);
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

  if(!validators.isUserObjectValid(updatedUser)) { 
    logger.debug('Not all properties specified');
    result.status = 400;
    result.message = "Bad Request. Not all required properties are specified";
    result.data = {};
    callback(result);
    return;
  }

  if(!validators.validateEmail(updatedUser.emailAddress)) {
    logger.debug('Invalid email address');
    result.status = 400;
    result.message = "Bad Request. Invalid email address";
    result.data = {};
    callback(result);
    return;
  }

  if(!validators.validatePhoneNumber(updatedUser.phoneNumber)) {
    logger.debug('Invalid phone number');
    result.status = 400;
    result.message = "Bad Request. Invalid phone number";
    result.data = {};
    callback(result);
    return;
  }

  if(!validators.validatePassword(updatedUser.password)) {
    logger.debug('Invalid password');
    result.status = 400;
    result.message = "Bad Request. Invalid password";
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

  logger.debug('No existing user found, updating user');
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
 * @param {string} token - Token of logged in user
 * @param {number} userid - id of user you want to delete
 * @param {Function} callback - callback that handles the response 
  */
user.delete = function (token, userid, callback) {
  logger.info('Deleting user');
  let result = {};

  if(!this.isTokenValid(token)) {
    logger.debug('Token invalid');
    result.status = 401;
    result.message = 'Invalid token';
    result.data = {}; 
    callback(result);
    return;
  }

  let user = database.users.find(
    item => item.id == userid 
  );

  if(user == undefined) {
    logger.debug('User not found');
    result.status = 404;
    result.message = `User with ID ${userid} is not found`;
    result.data = {}; 
    callback(result);
    return;
  }

  if(user.token != token) {
    logger.debug('Not the owner of the user');
    result.status = 403;
    result.message = `You are not the owner of user with ID ${userid}`;
    result.data = {}; 
    callback(result);
    return;
  }

  database.users = database.users.filter(item => item.id != userid);

  logger.debug('User deleted');
  result.status = 200;
  result.message = `User with ID ${userid} is deleted`;
  result.data = {}; 
  callback(result);
}



module.exports = user;
