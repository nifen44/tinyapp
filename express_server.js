const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

// app.get("/", (req, res) => {
//   return res.send("Hello!");
// });

// app.get("/urls.json", (req, res)=>{
//     return res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//     const templateVars = { greeting: "Hello World!"};
//     return res.render('hello_world', templateVars);
//   });

// go to index page
app.get('/urls', (req, res)=>{
    const templateVars = {
      user: users[req.cookies['user_id']],
      urls: urlDatabase
    }
    console.log(`ready go to index page- ${templateVars.user}`);
    return res.render("urls_index", templateVars);
})

// go to create page
app.get('/urls/new', (req, res)=>{
  const templateVars = {
    user: users[req.cookies['user_id']],
  }
    return res.render('urls_new', templateVars);
})

// go to link detail page
app.get('/urls/:id', (req, res)=>{
  const templateVars = {
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies['user_id']],
  }

    if(templateVars){
        return res.render("urls_show", templateVars);
    }
})

 // go to real link page by using shortURL
app.get('/u/:id', (req, res)=>{
    const longURL = urlDatabase[req.params.id];
    res.redirect(longURL);
})

  // go to edit page
app.get('/urls/:id/edit', (req, res)=>{
  const editId = req.params.id;
  res.redirect(`/urls/${editId}`);
})

 // create new link
app.post("/urls", (req, res) => {
    console.log(req.body); // Log the POST request body to the console
    // res.send("Ok"); // Respond with 'Ok' (we will replace this)

    const id = generateRandomString(6);
    
    urlDatabase[id] = req.body.longURL;

    console.log(urlDatabase);
    res.redirect(`/urls/${id}`);
  });

  // delete link
  app.post("/urls/:id/delete", (req, res)=>{
    console.log(req.params.id);

    const deleteId = req.params.id;
    delete urlDatabase[deleteId];

    res.redirect("/urls")
  })

  // edit link
  app.post('/urls/:id/edit', (req, res)=>{
    const { id } = req.params;
    const { longURL } = req.body;

    console.log(`${id}, ${longURL}`);

    urlDatabase[id] = longURL;
    res.redirect("/urls")
  })

  // login
  app.post("/login", (req, res)=>{
    const { email, password } = req.body;
    const user = getUserByEmail(email);
    if(user){
      console.log(`login success: ${user.email}`);
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    }else{
      res.sendStatus(400);
    }
  })

  // go to login page
  app.get('/login', (req, res)=>{
    return res.render('login');
  })

  // logout 
  app.get("/logout", (req, res)=>{
    res.clearCookie('user_id');
    res.redirect('/urls');
  })

  // go to register page
  app.get('/register', (req, res)=>{
    return res.render('registration');
  })

  // register user
  app.post('/register', (req, res)=>{
    const userId = generateRandomString(6);
    const { email, password } = req.body;

    if(!email || !password){
      return res.sendStatus(400);
    }

    if(getUserByEmail(email)){
      // user has already exist
      return res.sendStatus(400);
    }

    users[userId] = {
      id: userId,
      email,
      password,
    }

    res.cookie('user_id', userId);

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

function getUserByEmail(email){
  for(const user in users){
    if(users[user].email === email){
      return users[user];
    }
  }

  return null;
}
