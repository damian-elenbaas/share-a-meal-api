const logger = require('../utils/logger').logger;

let dummyUserData = [
  {
    'id': 1,
    'firstName': 'Damian',
    'lastName': 'Elenbaas',
    'street': 'Lovensdijkstraat 61',
    'city': 'Breda',
    'isActive': true,
    'emailAddress': 'd.elenbaas1@student.avans.nl',
    'password': 'abc123',
    'phoneNumber': '+31123456789',
  },
  {
    'id': 2,
    'firstName': 'Joost',
    'lastName': 'van Dijk',
    'street': 'De Ballen 2',
    'city': 'Den Bosch',
    'isActive': true,
    'emailAddress': 'j.vandijk@live.nl',
    'password': 'werwetq',
    'phoneNumber': '+31987654321',
  }
];

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

  if(!isUserObjectValid(body)) {
    logger.debug('Invalid body');
    result.status = 400;
    result.message = 'Bad request. Not all required properties are specified';
    result.data = {};
    callback(result);
    return;
  }

  if(!validateEmail(body.emailAddress)) {
    logger.debug('Invalid email address');
    result.status = 400;
    result.message = 'Bad request. Invalid email address';
    result.data = {};
    callback(result);
    return;
  }

  if(!validatePhoneNumber(body.phoneNumber)) {
    logger.debug('Invalid phone number');
    result.status = 400;
    result.message = 'Bad Request. Invalid phone number';
    result.data = {};
    callback(result);
    return;
  }

  if(!validatePassword(body.password)) {
    logger.debug('Invalid password');
    result.status = 400;
    result.message = 'Bad request. Invalid password';
    result.data = {};
    callback(result);
    return;
  }

  logger.debug('Searching for existing user');
  let existingUser = dummyUserData.find((item) => item.emailAddress == body.emailAddress); 

  if(existingUser != undefined) {
    logger.debug('Email address already in use');
    result.status = 403;
    result.message = 'User with specified email address already exists';
    result.data = {};
    callback(result);
    return;
  }

  logger.debug('Adding user to database');
  let lastId = dummyUserData[dummyUserData.length - 1].id;
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
  dummyUserData.push(newUser);

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

  const filteredUsers = dummyUserData.filter(item => item.hasOwnProperty('token') && item.token == token);
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
    let data = dummyUserData;

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
    result.data = dummyUserData;
  }

  logger.debug('Removing password and token from data');
  // Doens't work without copy: removes password and token permanently because of reference to dummyUserData
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

  const filtered = dummyUserData.filter(
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
    let token = generateRandomString(20);
    dummyUserData.forEach((item) => {
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

  let user = dummyUserData.find(item => item.id == userid);

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

  if(!isUserObjectValid(updatedUser)) { 
    logger.debug('Not all properties specified');
    result.status = 400;
    result.message = "Bad Request. Not all required properties are specified";
    result.data = {};
    callback(result);
    return;
  }

  if(!validateEmail(updatedUser.emailAddress)) {
    logger.debug('Invalid email address');
    result.status = 400;
    result.message = "Bad Request. Invalid email address";
    result.data = {};
    callback(result);
    return;
  }

  if(!validatePhoneNumber(updatedUser.phoneNumber)) {
    logger.debug('Invalid phone number');
    result.status = 400;
    result.message = "Bad Request. Invalid phone number";
    result.data = {};
    callback(result);
    return;
  }

  if(!validatePassword(updatedUser.password)) {
    logger.debug('Invalid password');
    result.status = 400;
    result.message = "Bad Request. Invalid password";
    result.data = {};
    callback(result);
    return;
  }

  logger.debug('Searching for existing user with specified email address');
  let existingUser = dummyUserData.find(
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
  const filtered = dummyUserData.filter(
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

  const filtered = dummyUserData.filter(
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

  let user = dummyUserData.find(
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

  let user = dummyUserData.find(
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

  dummyUserData = dummyUserData.filter(item => item.id != userid);

  logger.debug('User deleted');
  result.status = 200;
  result.message = `User with ID ${userid} is deleted`;
  result.data = {}; 
  callback(result);
}

/**
 * Function that validates email address
 *
 * @param {string} email
 * @returns {boolean} isValid
 */
const validateEmail = (email) => {
  logger.debug(`Validating email: ${email}`);
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

/**
 * Function that validates password 
 *
 * @param {string} password
 * @returns {boolean} isValid
 */
const validatePassword = (password) => {
  logger.debug(`Validating password: ${password}`);
  return String(password).length > 0;
}

/**
 * Function that validates phone number
 *
 * @param {string} password
 * @returns {boolean} isValid
 */
const validatePhoneNumber = (phoneNumber) => {
  logger.debug(`Validating phone number: ${phoneNumber}`);

  const regex = /^\+?\d{1,3}?\d{9}$/;

  phoneNumber = phoneNumber.replace(/\s/g, '');

  return regex.test(phoneNumber);
}

const isUserObjectValid = (user) => {
  logger.debug(`Validating user object: ${user}`);
  return (
    user.hasOwnProperty('emailAddress') &&
    user.hasOwnProperty('firstName') &&
    user.hasOwnProperty('lastName') &&
    user.hasOwnProperty('street') &&
    user.hasOwnProperty('city') &&
    user.hasOwnProperty('isActive') &&
    user.hasOwnProperty('password') &&
    user.hasOwnProperty('phoneNumber')
  );
}

/**
 * Function that generates a random string 
 *
 * @param {number} length 
 * @returns {boolean} isValid
 */
const generateRandomString = (length) => {
  logger.debug('Generating string');
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}


module.exports = user;
