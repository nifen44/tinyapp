const bcrypt = require('bcryptjs');

const getUserByEmail = (email, database)=>{
  for (const id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  
  return undefined;
};

const generateRandomString = (length)=>{
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
    result += alphanumeric.charAt(randomIndex);
  }

  return result;
};

const goToCertifyPage = (res, page, database)=>{
  const templateVars = {
    user: null,
    urls: database
  };
  return res.render(page, templateVars);
};

const urlsForUser = (userId, database)=>{
  let userUrls = {};
  for (const id in database) {
    if (database[id].userID === userId) {
      userUrls[id] = database[id];
    }
  }

  return userUrls;
};

const isLoggedIn = (id)=>{
  if (!id || id === '') return true;
  return false;
};

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