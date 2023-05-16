const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  return res.send("Hello!");
});

app.get("/urls.json", (req, res)=>{
    return res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    const templateVars = { greeting: "Hello World!"};
    return res.render('hello_world', templateVars);
  });

app.get('/urls', (req, res)=>{
    const templateVars = {urls: urlDatabase};
    return res.render("urls_index", templateVars);
})

app.get('/urls/new', (req, res)=>{
    return res.render('urls_new');
})

app.get('/urls/:id', (req, res)=>{
    const templateVars = {id: req.params.id, longURL: urlDatabase[req.params.id]};
    if(templateVars){
        return res.render("urls_show", templateVars);
    }
})

app.get('/u/:id', (req, res)=>{
    const longURL = urlDatabase[req.params.id];
    res.redirect(longURL);
})

app.post("/urls", (req, res) => {
    console.log(req.body); // Log the POST request body to the console
    // res.send("Ok"); // Respond with 'Ok' (we will replace this)

    const id = generateRandomString(6);
    
    urlDatabase[id] = req.body.longURL;

    console.log(urlDatabase);
    res.redirect(`/urls/${id}`);
  });

  app.post("/urls/:id/delete", (req, res)=>{
    console.log(req.params.id);

    const deleteId = req.params.id;
    delete urlDatabase[deleteId];

    res.redirect("/urls")
  })

app.post("/urls/:id/edit", (req, res)=>{
  const { editId } = req.params;
  const { longURL } = req.body;
  console.log(longURL);
  urlDatabase[editId] = longURL;
  res.redirect("/urls");
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