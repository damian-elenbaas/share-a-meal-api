const dummyUserData = [
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

// Create a new user
user.create = function (body, callback) {
  let exists = false;
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

  dummyUserData.forEach((item) => {
    if(item.emailAddress == body.emailAddress) {
      exists = true;
    }
  }); 

  if(exists) {
    result.status = 403;
    result.message = 'User with specified email address already exists';
    result.data = {};
    callback(result);
    return;
  }

  let lastId = dummyUserData[dummyUserData.length - 1].id;
  let newUser = {
    "id": lastId + 1,
    "firstName": body.firstName,
    "lastName": body.lastName,
    "street": body.street,
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

user.isTokenValid = function (token) {
  const filtered = dummyUserData.filter(
    item => item.token == token
  );

  if(filtered.length == 0) {
    return false;
  } else {
    return true;
  }
}

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

user.getById = function (token, id, callback) {
  let result = {};

  if(!this.isTokenValid(token)) {
    result.status = 401;
    result.message = "Invalid token";
    result.data = {}; 
    callback(result);
    return;
  }

  let filtered = dummyUserData.filter(
    item => item.id == id
  );

  if(filtered.length == 0) {
    result.status = 404;
    result.message = "User not found";
    result.data = {}; 
  } else {
    let user = filtered[0];

    // delete user.password;
    // delete user.token;

    result.status = 200;
    result.message = "User succesfully found";
    result.data = user;
  }

  callback(result);
}

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const validatePassword = (password) => {
  return String(password).length > 0;
}

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
