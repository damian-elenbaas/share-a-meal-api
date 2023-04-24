const logger = require('./logger').logger;

let validators = {};

/**
 * Function that validates email address
 *
 * @param {string} email
 * @returns {boolean} isValid
 */
validators.validateEmail = (email) => {
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
validators.validatePassword = (password) => {
  logger.debug(`Validating password: ${password}`);
  return String(password).length > 0;
}

/**
 * Function that validates phone number
 *
 * @param {string} password
 * @returns {boolean} isValid
 */
validators.validatePhoneNumber = (phoneNumber) => {
  logger.debug(`Validating phone number: ${phoneNumber}`);

  const regex = /^\+?\d{1,3}?\d{9}$/;

  phoneNumber = phoneNumber.replace(/\s/g, '');

  return regex.test(phoneNumber);
}

validators.isUserObjectValid = (user) => {
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

module.exports = validators;

