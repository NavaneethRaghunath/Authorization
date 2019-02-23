//jshint esversion:6

require('dotenv').config(); //saves secret values - add secrets to .env file

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate")
//----------
//level 5 encryption cookies and passport
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//level 5 encryption cookies and passport
//-----------

//const md5 = require("md5"); //level 3 hashing

//const encrypt = require("mongoose-encryption"); //level 2 database encrypt

//const bcrypt = require("bcrypt"); //level 4 hashing

//const saltRounds = 10; // level 4 hashing

//------------------------ lEVEL 6 Oauth2

const GoogleStrategy = require('passport-google-oauth20').Strategy;

//------------------------

const app = express();

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extented: "true"}));
//---------------
//level 5 encryption cookies and passport

app.use(session({
  secret: 'Arsenal are invincibles',
  resave: false,
  saveUninitialized: false
//  cookie: { secure: true }
}))

app.use(passport.initialize());
app.use(passport.session());
//level 5 encryption cookies and passport
//--------------------------------------------------

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser : true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  email : String,
  password : String,
  googleId : String,
  secretField : String
})

//level  2 encrypt
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

//```````````````````````````````````````````````````
//level 5 encryption cookies and passport
userSchema.plugin(passportLocalMongoose);//level 5 encryption cookies and passport
userSchema.plugin(findOrCreate); //for findOrCreate function to work
const user = mongoose.model("user", userSchema);

passport.use(user.createStrategy());//level 5 encryption cookies and passport

// use static serialize and deserialize of model for passport session support
// passport.serializeUser(user.serializeUser());//level 5 encryption cookies and passport
//
// passport.deserializeUser(user.deserializeUser()); //level 5 encryption cookies and passport

//*****************************************************

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  user.findById(id, function(err, user) {
    done(err, user);
  });
});

//*****************************************************

app.get("/",(req,res)=>{
  res.render("home");
//res.sendFile(__dirname + "/index.html");
});

app.get("/register",(req,res)=>{
  res.render("register");
});

app.get("/login",(req,res)=>{
  res.render("login");
});

app.get("/secrets",(req,res)=>{
  // if (req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login");
  // }
  user.find({"secretField" : {$ne : null}},(err, field)=>{
    if (err){
      console.log(err);
    } else{
      if (field){
        res.render("secrets", {allSecret : field});
      }
    }
  });
});

app.get("/submit",(req,res)=>{
  if (req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect("/");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });


app.post("/register",(req,res)=>{

  // bcrypt.hash(req.body.password, saltRounds, (err,hash)=>{
  //   const newUser = new user({
  //     email: req.body.username,
  //   //  password: md5(req.body.password)
  //     password: hash
  //   });
  //   newUser.save((err)=>{
  //     if(err){
  //       console.log(err);
  //     }else{
  //       res.render("secrets");
  //     }
  //   });
  // });

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

  //level 5 encryption cookies and passport
  user.register({username: req.body.username}, req.body.password,(err,field)=>{
    if (err){
      console.log(err);
      res.redirect("/register")
    }else {
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/secrets");
      });
    }
  })
  //level 5 encryption cookies and passport
});

app.post("/login",(req,res)=>{

//   const username = req.body.username;
// //  const password = md5(req.body.password);
//   const password = req.body.password;
//
//   user.findOne({email: username},(err,field)=>{
//     if(field){
//       bcrypt.compare(password,field.password, (err,result)=>{
//         if (result === true){
//           res.render("secrets");
//         }
//       });
// //      if (field.password === password){
//   //      res.render("secrets");
//   //      }
//        }else if(err){
//          console.log(err);
//     // }else{
//     //   console.log("no such users");
//      }
//   });

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//level 5 encryption cookies and passport

//level 5 encryption cookies and passport

const newUser = new user({
  username : req.body.username,
  password : req.body.password
});

req.login(newUser, (err)=>{
  if (err){
    console.log(err);
  } else{
    passport.authenticate("local")(req,res, ()=>{
      res.redirect("/secrets");
    });
  }
});
});

app.post("/submit",(req,res)=>{
  const secret = req.body.secret;
  console.log(secret);
//------------------------------------------//
//Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);
//------------------------------------------//

  user.findById(req.user.id, (err, field)=>{
    if (err){
      console.log(err);
    }else if(field){
      field.secretField = secret;
      field.save(()=>{
        res.redirect("/secrets");
      });
    }
  })
});

app.listen(3000,()=>{
  console.log("server running");
});
