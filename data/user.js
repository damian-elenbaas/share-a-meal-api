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
    'phoneNumber': '1234124142',
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
    'phoneNumber': '254757368',
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
  let result = {};

  if(!(
    body.hasOwnProperty('emailAddress') &&
    body.hasOwnProperty('firstName') &&
    body.hasOwnProperty('lastName') &&
    body.hasOwnProperty('street') &&
    body.hasOwnProperty('city') &&
    body.hasOwnProperty('isActive') &&
    body.hasOwnProperty('password') &&
    body.hasOwnProperty('phoneNumber')
  )) {
    result.status = 400;
    result.message = 'Bad request. Not all required properties specified';
    result.data = {};
    callback(result);
    return;
  }

  if(!validateEmail(body.emailAddress)) {
    result.status = 400;
    result.message = 'Bad request. Invalid email address';
    result.data = {};
    callback(result);
    return;
  }

  if(!validatePassword(body.password)) {
    result.status = 400;
    result.message = 'Bad request. Invalid password';
    result.data = {};
    callback(result);
    return;
  }

  let existingUser = dummyUserData.find((item) => item.emailAddress == body.emailAddress); 

  if(existingUser != undefined) {
    result.status = 403;
    result.message = 'User with specified email address already exists';
    result.data = {};
    callback(result);
    return;
  }

  let lastId = dummyUserData[dummyUserData.length - 1].id;
  let newUser = {
    'id': lastId + 1,
    'firstName': body.firstName,
    'lastName': body.lastName,
    'street': body.street,
    "city": body.city,
    "isActive": body.isActive,
    "emailAddress": body.emailAddress,
    "password": body.password,
    "phoneNumber": body.phoneNumber
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
  let result = {};

  const filteredUsers = dummyUserData.filter(item => item.hasOwnProperty('token') && item.token == token);
  if(filteredUsers.length == 0) {
    result.status = 401;
    result.message = "Invalid token";
    result.data = {};
    callback(result);
    return;
  }

  if(query.hasOwnProperty('isActive')) {
    const filteredData = dummyUserData.filter(
      item => item.isActive === query.isActive
    );
    result.status = 200;
    result.message = 'All users';
    result.data = filteredData;
  } else if(Object.keys(query).length > 0){
    let data = dummyUserData;

    for (const [key, value] of Object.entries(query)) {
      if(!data[0].hasOwnProperty(`${key}`)) {
        result.status = 200;
        result.message = 'All users';
        result.data = {};
        callback(result);
        return;
      }

      data = data.filter(item => item[key].includes(value));
    }

    result.status = 200;
    result.message = 'All users';
    result.data = data;
  } else {
    result.status = 200;
    result.message = 'All users';
    result.data = dummyUserData;
  }

  // FILTER CREDENTIALS
  result.data = result.data.map((item) => {
    // delete item.password;
    // delete item.token;

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
  let result = {};

  if(!(credentials.hasOwnProperty('emailAddress') 
    && credentials.hasOwnProperty('password'))
  ) {
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
    result.status = 404;
    result.message = "Account with specified email address does not exist";
    result.data = {};
    callback(result);
    return;
  }

  const user = filtered[0];

  if(user.password == credentials.password) {
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
    result.status = 400;
    result.message = "Invalid credentials";
    result.data = {};
  }

  callback(result);
  return;
}

/**
 * Function that checks if given token is valid
 *
 * @param {string} token - token of logged in user
 * @returns {boolean} isValid
 */
user.isTokenValid = function (token) {
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
  let result = {};

  const filtered = dummyUserData.filter(
    item => item.token == token
  );

  if(filtered.length == 0) {
    result.status = 401;
    result.message = "Invalid token";
    result.data = {};
  } else {
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
  let result = {};

  if(!this.isTokenValid(token)) {
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
    result.status = 404;
    result.message = "User not found";
    result.data = {}; 
  } else {
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
  let result = {};

  if(!this.isTokenValid(token)) {
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
    result.status = 404;
    result.message = `User with ID ${userid} is not found`;
    result.data = {}; 
    callback(result);
    return;
  }

  if(user.token != token) {
    result.status = 403;
    result.message = `You are not the owner of user with ID ${userid}`;
    result.data = {}; 
    callback(result);
    return;
  }

  dummyUserData = dummyUserData.filter(item => item.id != userid);

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
  return String(password).length > 0;
}

/**
 * Function that generates a random string 
 *
 * @param {number} length 
 * @returns {boolean} isValid
 */
const generateRandomString = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}


module.exports = user;
