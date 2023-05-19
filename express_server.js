const express = require("express");
const methodOverride = require('method-override');
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const PORT = 8080; // default port 8080

const { getUserByEmail, generateRandomString, goToCertifyPage, urlsForUser, isLoggedIn, authenticateUser } = require('./helpers');


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name:'session',
  keys: ['my favorite thing', 'learning'],
}));
app.use(methodOverride('X-HTTP-Method-Override'));

const urlDatabase = {
  // "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW"},
  // "9sm5xK": {longURL: "http://www.google.com", userID: "aJ48lW"}
};

let users = {};

// go to index page
app.get('/urls', (req, res)=>{
  if (isLoggedIn(req.session.user_id)) {
    // didn't Logged in
    goToCertifyPage(res, 'login', urlDatabase);
  } else {
    // Logged in
    for (const id in users) {
      // find the specific user
      if (users[id].id === req.session.user_id) {
        const currentUserUrls = urlsForUser(req.session.user_id, urlDatabase);
        //console.log(currentUserUrls);
        const templateVars = {
          user: users[req.session.user_id],
          urls: currentUserUrls,
        };
        return res.render("urls_index", templateVars);
      }
    }
    // didn't find the user from users
    goToCertifyPage(res, 'login', urlDatabase);
  }
    
});

// go to create url page
app.get('/urls/new', (req, res)=>{
  if (isLoggedIn(req.session.user_id)) {
    return res.redirect('/login');
  }
  const templateVars = {
    user: users[req.session.user_id],
  };
  return res.render('urls_new', templateVars);
});

// go to link detail page
app.get('/urls/:id', (req, res)=>{

  //POST /urls/:id should return a relevant error message if the user is not logged in
  if (isLoggedIn(req.session.user_id)) {
    return res.send("you haven't login, can not access this page");
  }

  //POST /urls/:id should return a relevant error message if id does not exist
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
    res.send('you can not access this url');
  }
  
});

// go to real link page by using shortURL
app.get('/u/:id', (req, res)=>{
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// go to edit page
app.get('/urls/:id/edit', (req, res)=>{
  const editId = req.params.id;
  res.redirect(`/urls/${editId}`);
});

// create new link
app.post("/urls", (req, res) => {
  if (isLoggedIn(req.session.user_id)) {
    return res.sendStatus(403);
  } else {
    for (const id in users) {
      if (users[id].id === req.session.user_id) {
        const id = generateRandomString(6);
        urlDatabase[id] = {
          longURL: req.body.longURL,
          userID: req.session.user_id
        };
        //console.log(urlDatabase);
        res.redirect(`/urls/${id}`);
      }
    }
  }
  //console.log(req.body);
    
});

// delete link
app.get("/urls/:id/delete", (req, res)=>{
  console.log(req.params.id);
  //POST /urls/:id/delete should return a relevant error message if the user is not logged in
  if (isLoggedIn(req.session.user_id)) {
    return res.send("you haven't login, can not access this page");
  }

  //POST /urls/:id/delete should return a relevant error message if id does not exist
  //POST /urls/:id/delete should return a relevant error message if the user does not own the URL.
  const currentUserUrls = urlsForUser(req.session.user_id, urlDatabase);
  if (currentUserUrls[req.params.id] && currentUserUrls[req.params.id] !== undefined) {
    const deleteId = req.params.id;
    delete urlDatabase[deleteId];
    res.redirect("/urls");
  } else {
    res.send("No such url");
  }
});

// edit link
app.post('/urls/:id/edit', (req, res)=>{
  const { id } = req.params;
  const { longURL } = req.body;

  // console.log(`${id}, ${longURL}`);
  // console.log(`------${urlDatabase}------`);
  urlDatabase[id].longURL = longURL;
  res.redirect("/urls");
});

// go to login page
app.get('/login', (req, res)=>{
  if (isLoggedIn(req.session.user_id)) {
    goToCertifyPage(res, 'login',  urlDatabase);
  } else {
    // cookie is exist, we need to check if the cookie matches one of the user in users
    for (const id in users) {
      if (users[id].id === req.session.user_id) {
        return res.redirect('/urls');
      }
    }
    goToCertifyPage(res, 'login', urlDatabase);
  }
});

// login
app.post("/login", (req, res)=>{
  const { email, password } = req.body;
  const { err, user } = authenticateUser(email, password, users);

  if (err) {
    return res.json(err);
  }

  req.session.user_id = user.id;
  return res.redirect('/urls');
});


// logout
app.get("/logout", (req, res)=>{
  req.session.user_id = null;
  res.redirect('/login');
});

// go to register page
app.get('/register', (req, res)=>{
  if (isLoggedIn(req.session.user_id)) {
    goToCertifyPage(res, 'registration', urlDatabase);
  } else {
    // cookie is exist, we need to check if the cookie matches one of the user in users
    for (const id in users) {
      if (users[id].id === req.session.user_id) {
        return res.redirect('/urls');
      }
    }
    goToCertifyPage(res, 'registration', urlDatabase);
  }
    
});

// register user
app.post('/register', (req, res)=>{
  const userId = generateRandomString(6);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.sendStatus(400);
  }

  if (getUserByEmail(email, users)) {
    // user has already exist
    console.log('--user exist--');
    return res.sendStatus(400);
  }

  const hashedPassword = bcrypt.hashSync(password, salt);

  users[userId] = {
    id: userId,
    email,
    password: hashedPassword,
  };

  //console.log(Object.entries(users));

  req.session.user_id = userId;

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});





