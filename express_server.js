const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const PORT = 8080; // default port 8080

const { getUserByEmail } = require('./helpers');


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name:'session',
  keys: ['key1', 'key2'],
}));

const urlDatabase = {
  // "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW"},
  // "9sm5xK": {longURL: "http://www.google.com", userID: "aJ48lW"}
};

let users = {};

// go to index page
app.get('/urls', (req, res)=>{
  if(!req.session.user_id || req.session.user_id === ''){
    goToCertifyPage(res, 'login');
  }else{
    for(const id in users){
      if(users[id].id === req.session.user_id){
        const currentUserUrls = urlsForUser(req.session.user_id);
        console.log(currentUserUrls);
        const templateVars = {
          user: users[req.session.user_id],
          urls: currentUserUrls,
        }
        return res.render("urls_index", templateVars);
      }
    }
    goToCertifyPage(res, 'login');
  }
    
})

// go to create page
app.get('/urls/new', (req, res)=>{
  if(!req.session.user_id || req.session.user_id === ''){
    return res.redirect('/login');

  }
  const templateVars = {
    user: users[req.session.user_id],
  }
    return res.render('urls_new', templateVars);
})

// go to link detail page
app.get('/urls/:id', (req, res)=>{

  //POST /urls/:id should return a relevant error message if the user is not logged in
  if(!req.session.user_id || req.session.user_id === ''){
    return res.send("you haven't login, can not access this page");
  }

  //POST /urls/:id should return a relevant error message if id does not exist

  //POST /urls/:id should return a relevant error message if the user does not own the URL
  const currentUserUrls = urlsForUser(req.session.user_id);
  if(currentUserUrls[req.params.id] && currentUserUrls[req.params.id]!== undefined){
      const templateVars = {
        id: req.params.id, 
        longURL: urlDatabase[req.params.id].longURL,
        user: users[req.session.user_id],
      }
  
      if(templateVars){
          return res.render("urls_show", templateVars);
      }
  }else{
    res.send('you can not access this url');
  }
  
})

 // go to real link page by using shortURL
app.get('/u/:id', (req, res)=>{
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
})

  // go to edit page
app.get('/urls/:id/edit', (req, res)=>{
  const editId = req.params.id;
  res.redirect(`/urls/${editId}`);
})

 // create new link
app.post("/urls", (req, res) => {
  if(!req.session.user_id || req.session.user_id === ''){
    return res.sendStatus(403);
  }else{
    for(const id in users){
      if(users[id].id === req.session.user_id){
        const id = generateRandomString(6);
        urlDatabase[id] = {
          longURL: req.body.longURL,
          userID: req.session.user_id
        };
        console.log(urlDatabase);
        res.redirect(`/urls/${id}`);
      }
    }
  }
    console.log(req.body); // Log the POST request body to the console
    // res.send("Ok"); // Respond with 'Ok' (we will replace this)

    
  });

  // delete link
  app.get("/urls/:id/delete", (req, res)=>{
    console.log(req.params.id);
    //POST /urls/:id/delete should return a relevant error message if the user is not logged in
    if(!req.session.user_id || req.session.user_id === ''){
      return res.send("you haven't login, can not access this page");
    }

    //POST /urls/:id/delete should return a relevant error message if id does not exist
    //POST /urls/:id/delete should return a relevant error message if the user does not own the URL.
    const currentUserUrls = urlsForUser(req.session.user_id);
    if(currentUserUrls[req.params.id] && currentUserUrls[req.params.id]!== undefined){
      const deleteId = req.params.id;
      delete urlDatabase[deleteId];
      res.redirect("/urls");
    }else{
      res.send("No such url");
    }
    

    
  })

  // edit link
  app.post('/urls/:id/edit', (req, res)=>{
    const { id } = req.params;
    const { longURL } = req.body;

    console.log(`${id}, ${longURL}`);
    console.log(`------${urlDatabase}------`);
    urlDatabase[id].longURL = longURL;
    res.redirect("/urls")
  })

    // go to login page
    app.get('/login', (req, res)=>{
      if(!req.session.user_id || req.session.user_id === ''){
        goToCertifyPage(res, 'login');
      }else{
        // cookie is exist, we need to check if the cookie matches one of the user in users
        for(const id in users){
          if(users[id].id === req.session.user_id){
            return res.redirect('/urls');
          }
        }
        goToCertifyPage(res, 'login');
      }
      
    })

  // login
  app.post("/login", (req, res)=>{
    const { email, password } = req.body;
    const user = getUserByEmail(email, users);
    if(user){
      // check password
      if(!bcrypt.compareSync(password, user.password)){
        return res.sendStatus(403);
      }else{
        // console.log(`login success: ${user.email}`);
        req.session.user_id = user.id;
        res.redirect('/urls');
      }
      
    }else{
      return res.sendStatus(403);
    }
  })


  // logout 
  app.get("/logout", (req, res)=>{
    req.session.user_id = null;
    res.redirect('/login');
  })

  // go to register page
  app.get('/register', (req, res)=>{
    if(!req.session.user_id || req.session.user_id === ''){
      goToCertifyPage(res, 'registration');
    }else{
      // cookie is exist, we need to check if the cookie matches one of the user in users
      for(const id in users){
        if(users[id].id === req.session.user_id){
          return res.redirect('/urls');
        }
      }
      goToCertifyPage(res, 'registration');
    }
    
  })

  // register user
  app.post('/register', (req, res)=>{
    const userId = generateRandomString(6);
    const { email, password } = req.body;

    if(!email || !password){
      return res.sendStatus(400);
    }

    if(getUserByEmail(email, users)){
      // user has already exist
      console.log('--user exist--')
      return res.sendStatus(400);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    users[userId] = {
      id: userId,
      email,
      password: hashedPassword,
    }

    console.log(Object.entries(users));

    req.session.user_id = userId;

    res.redirect('/urls');
  })

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString(length){
    const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * alphanumeric.length);
        result += alphanumeric.charAt(randomIndex);
    }

    return result;
}

function goToCertifyPage(res, page){
  const templateVars = {
    user: null,
    urls: urlDatabase
  }
  return res.render(page, templateVars);
}

function urlsForUser(userId){
  let userUrls = {};
  for(const id in urlDatabase){
    if(urlDatabase[id].userID === userId){
      userUrls[id] = urlDatabase[id];
    }
  }

  return userUrls;
}

