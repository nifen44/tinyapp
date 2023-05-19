const bcrypt = require('bcryptjs');

/**
 * Get user from users database by email
 * 
 * @param {string} email 
 * @param {array} database 
 * @returns 
 */
const getUserByEmail = (email, database)=>{
  for (const id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  
  return undefined;
};

/**
 * Generate a random id by given id length
 * 
 * @param {number} length 
 * @returns 
 */
const generateRandomString = (length)=>{
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
    result += alphanumeric.charAt(randomIndex);
  }

  return result;
};

/**
 * Go to certain Page
 * 
 * @param {Request} res 
 * @param {string} page 
 * @returns 
 */
const goToCertifyPage = (res, page)=>{
  const templateVars = {
    user: null,
  };
  return res.render(page, templateVars);
};

/**
 * Get urls which is created by the given userId's user
 * 
 * @param {string} userId 
 * @param {array} database 
 * @returns 
 */
const urlsForUser = (userId, database)=>{
  let userUrls = {};
  for (const id in database) {
    if (database[id].userID === userId) {
      userUrls[id] = database[id];
    }
  }

  return userUrls;
};

/**
 * To check if the user is already logged In by the given sessionId
 * 
 * @param {string} id 
 * @returns 
 */
const isLoggedIn = (id)=>{
  if (id && id !== '') return true;
  return false;
};

/**
 * To verify if the user if in our users database by given email and password
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {array} users 
 * @returns 
 */
const authenticateUser = (email, password, users)=>{
  let currentUser = null;

  for (const userId in users) {
    if (users[userId].email === email) {
      currentUser = users[userId];
    }
  }

  if (!currentUser) {   // Eject clauses
    return {err: 'No valid user', user: null};
  }

  if (!bcrypt.compareSync(password, currentUser.password)) {  // Eject clauses
    return {err: 'Email or Password invalid', user: null};
  }

  return {err: null, user: currentUser};
};

module.exports = { getUserByEmail, generateRandomString, goToCertifyPage,urlsForUser, isLoggedIn, authenticateUser };