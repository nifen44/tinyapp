const express = require("express");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail, generateRandomString, goToCertifyPage, urlsForUser, isLoggedIn, authenticateUser } = require('./helpers');
const { urlDatabase, users } = require('./data');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name:'session',
  keys: ['my favorite thing', 'learning'],
}));
app.use(methodOverride('X-HTTP-Method-Override'));

const salt = bcrypt.genSaltSync(10);
const PORT = 8080; // default port 8080

/**
 * GET /
 *
 * if user is logged in, it should redirect to /urls.
 * if user is not logged in, it should redirect to /login.
 *
 */
app.get('/', (req, res)=>{
  if (!isLoggedIn(req.session.user_id)) {
    goToCertifyPage(res, 'login');
  } else {
    res.redirect('/urls');
  }
});

/**
 * /urls
 *
 * go to urls list page
 */
app.get('/urls', (req, res)=>{
  if (!isLoggedIn(req.session.user_id)) {
    // didn't Logged in
    return res.status(401).send("You haven't login, please login in!");
  } else {
    // Logged in
    for (const id in users) {
      // find the specific user
      if (users[id].id === req.session.user_id) {
        const currentUserUrls = urlsForUser(req.session.user_id, urlDatabase);
        const templateVars = {
          user: users[req.session.user_id],
          urls: currentUserUrls,
        };
        return res.render("urls_index", templateVars);
      }
    }
    // didn't find the user from users
    goToCertifyPage(res, 'login');
  }
});

/**
 * /urls/new
 *
 * go to create url page
 */

app.get('/urls/new', (req, res)=>{
  if (!isLoggedIn(req.session.user_id)) {
    // didn't logged In
    return res.redirect('/login');
  }
  // Logged in
  const templateVars = {
    user: users[req.session.user_id],
  };
  return res.render('urls_new', templateVars);
});

/**
 * /urls/:id
 *
 * go to url detail page
 */

app.get('/urls/:id', (req, res)=>{

  //POST /urls/:id should return a relevant error message if the user is not logged in
  if (!isLoggedIn(req.session.user_id)) {
    return res.status(401).send("You haven't login, can not access this page");
  }

  //POST /urls/:id should return a relevant error message if id does not exist
  if (urlDatabase[req.params.id] === null || urlDatabase[req.params.id] === undefined) {
    return res.status(400).send("The ID you are accessing does not exist.");
  }

  //POST /urls/:id should return a relevant error message if the user does not own the URL
  const currentUserUrls = urlsForUser(req.session.user_id, urlDatabase);
  if (currentUserUrls[req.params.id] && currentUserUrls[req.params.id] !== undefined) {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.session.user_id],
    };
  
    if (templateVars) {
      return res.render("urls_show", templateVars);
    }
  } else {
    return res.status(403).send('You can not access this url');
  }
  
});

/**
 * /u/:id
 *
 * go to real link page by using shortURL
 */
app.get('/u/:id', (req, res)=>{
  if (urlDatabase[req.params.id] === null || urlDatabase[req.params.id] === undefined) {
    return res.status(401).send("The link you are accessing does not exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

/**
 * /urls/:id/edit
 *
 * go to edit page
 */
app.get('/urls/:id/edit', (req, res)=>{
  const editId = req.params.id;
  res.redirect(`/urls/${editId}`);
});

/**
 * /urls
 *
 * create new link
 */
app.post("/urls", (req, res) => {
  if (!isLoggedIn(req.session.user_id)) {
    return res.status(401).send("You haven't login, please login in!");
  } else {
    for (const id in users) {
      if (users[id].id === req.session.user_id) {
        const id = generateRandomString(6);
        urlDatabase[id] = {
          longURL: req.body.longURL,
          userID: req.session.user_id
        };
        res.redirect(`/urls/${id}`);
      }
    }
  }
});

/**
 * /urls/:id/delete
 *
 * delete url
 */
app.post("/urls/:id/delete", (req, res)=>{
  //POST /urls/:id/delete should return a relevant error message if the user is not logged in
  if (!isLoggedIn(req.session.user_id)) {
    return res.status(401).send("you haven't login, can not access this page");
  }

  //POST /urls/:id/delete should return a relevant error message if id does not exist
  if (urlDatabase[req.params.id] === null || urlDatabase[req.params.id] === undefined) {
    return res.status(404).send("The ID you are accessing does not exist.");
  }

  //POST /urls/:id/delete should return a relevant error message if the user does not own the URL.
  const currentUserUrls = urlsForUser(req.session.user_id, urlDatabase);
  if (currentUserUrls[req.params.id] && currentUserUrls[req.params.id] !== undefined) {
    const deleteId = req.params.id;
    delete urlDatabase[deleteId];
    res.redirect("/urls");
  } else {
    return res.status(404).send("No such url");
  }
});

/**
 * /urls/:id
 *
 * edit url
 */
app.post('/urls/:id', (req, res)=>{
  if (!isLoggedIn(req.session.user_id)) {
    // not logged in
    return res.status(401).send("You haven't login, please login first.");
  }
  const { id } = req.params;
  const { longURL } = req.body;
  urlDatabase[id].longURL = longURL;
  res.redirect("/urls");
});

/**
 * /login
 *
 * go to login page
 */
app.get('/login', (req, res)=>{
  if (!isLoggedIn(req.session.user_id)) {
    goToCertifyPage(res, 'login');
  } else {
    // cookie is exist, we need to check if the cookie matches one of the user in users
    for (const id in users) {
      if (users[id].id === req.session.user_id) {
        return res.redirect('/urls');
      }
    }
    goToCertifyPage(res, 'login');
  }
});

/**
 * /login
 *
 * user login
 */
app.post("/login", (req, res)=>{
  const { email, password } = req.body;

  if (email === '' || password === '') {
    res.status(400).send('email and password cannot be empty');
  }
  const { err, user } = authenticateUser(email, password, users);

  if (err) {
    return res.json(err);
  }

  req.session.user_id = user.id;
  return res.redirect('/urls');
});

/**
 * /logout
 *
 * logout user
 */
app.post("/logout", (req, res)=>{
  req.session = null;
  res.redirect('/login');
});

/**
 * /register
 *
 * go to register page
 */
app.get('/register', (req, res)=>{
  if (!isLoggedIn(req.session.user_id)) {
    goToCertifyPage(res, 'registration');
  } else {
    // cookie is exist, we need to check if the cookie matches one of the user in users
    for (const id in users) {
      if (users[id].id === req.session.user_id) {
        return res.redirect('/urls');
      }
    }
    goToCertifyPage(res, 'registration');
  }
    
});

/**
 * /register
 *
 * register user
 */
app.post('/register', (req, res)=>{
  const userId = generateRandomString(6);
  const { email, password } = req.body;

  if (email === '' || password === '') {
    res.status(400).send('email and password cannot be empty');
  }

  if (getUserByEmail(email, users)) {
    // user has already exist
    res.status(400).send('user is already registered');
  }

  const hashedPassword = bcrypt.hashSync(password, salt);

  users[userId] = {
    id: userId,
    email,
    password: hashedPassword,
  };

  req.session.user_id = userId;

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});





