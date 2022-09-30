//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB");

const User = new mongoose.model("User", {email: String, password: String});

app.get("/", function(req,res){
    res.render("home");
});

app.route("/login")
    .get((req,res) => { 
        res.render("login");
    })

    .post((req,res) => {

        User.findOne({email: req.body.username}, function(error,results){
            if(error){
                console.log(error);
            }else{

                if(results){
                    if(results.password === req.body.password){
                        res.render("secrets");
                    }
                }
            }
        });
        
        
    });

app.route("/register")
    .get((req,res) => {
        res.render("register");
    })

    .post((req,res) => {
        const user = new User({
            email: req.body.username,
            password: req.body.password
        });

        user.save(function(error){
            if(error){
                console.log(error);
            }else{
                res.render("secrets");
            }
        });
        
    });

app.listen(3000, function(){
    console.log("Success");
});
