//jshint esversion:6
require("dotenv").config();
const md5 = require("md5");
const AES = require("crypto-js/aes");
const SHA256 = require("crypto-js/sha256");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

//encryptions
const encrypt = require("mongoose-encryption");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//Passport part

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(
  session({
    secret: "Secret Trial",
    resave: false,
    saveUninitialized: true,
    //cookie: {secure: true}
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
});

UserSchema.plugin(passportLocalMongoose);

//Encryption using mongoose-encryption
//UserSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", UserSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function (User, done) {
  done(null, User);
});

passport.deserializeUser(function (User, done) {
  done(null, User);
});

app.get("/", function (req, res) {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })

  .post((req, res) => {
    //using passport

    User.findOne({ username: req.body.username }, function (err, results) {
      if (err) {
        console.log(err);
      } else {
        if (results) {
          const user = new User({
            username: req.body.username,
            password: req.body.password,
          });

          passport.authenticate("local", function (err, user) {
            if (err) {
              console.log(err);
            } else {
              if (user) {
                req.login(user, function (err) {
                  if (err) {
                    console.log(err);
                  } else {
                    res.redirect("/secrets");
                  }
                });
              } else {
                res.redirect("/login");
              }
            }
          })(req, res);
        } else {
          res.redirect("/login");
        }
      }
    });

    //using bcrypt
    // User.findOne({ email: req.body.username }, function (error, results) {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     if (results) {
    //       bcrypt.compare(
    //         req.body.password,
    //         results.password,
    //         function (err, result) {
    //           if (err) {
    //             console.log(err);
    //           } else {
    //             if (result == true) {
    //               res.render("secrets");
    //             }
    //           }
    //         }
    //       );
    //     }
    //   }
    // });
  });

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })

  .post((req, res) => {
    //using passport-local-mongoose

    User.register(
      { username: req.body.username },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets");
          });
        }
      }
    );

    //using bcrypt to hash password
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     if(err){
    //         console.log(err);
    //     }else{
    //         const user = new User({
    //             email: req.body.username,
    //             password: hash
    //         });

    //         user.save(function(error){
    //             if(error){
    //                 console.log(error);
    //             }else{
    //                 res.render("secrets");
    //             }
    //         });
    //     }
    // });

    //using crypto SHA256 hashing
    // const user = new User({
    //     email: req.body.username,
    //     password: SHA256(req.body.password)
    // });
  });

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      //so that the session is properly destroyed, and when you go back you are still authorized
      req.session.destroy((err) => {
        if (!err) {
          res
            .status(200)
            .clearCookie("connect.sid", { path: "/" })
            .redirect("/");
        } else {
          console.log(err);
        }
      });
    }
  });
});

app.listen(3000, function () {
  console.log("Success");
});
