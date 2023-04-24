const logger = require('./logger').logger;

let utils = {};

/**
 * Function that generates a random string 
 *
 * @param {number} length 
 * @returns {boolean} isValid
 */
utils.generateRandomString = (length) => {
  logger.debug('Generating string');
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

module.exports = utils;
