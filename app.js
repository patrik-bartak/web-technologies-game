var express = require("express");
var http = require("http");

// var port = process.argv[2];
var port = 3000;
var app = express();

app.use(express.static(__dirname + "/public"));
http.createServer(app).listen(port);

app.get("/", function(req, res) {
    res.sendFile("splash.html", {root: "./public"});
});

// not needed until we send data along the post request
// app.post("/game.html", function (req, res) {
//     res.sendFile("game.html");
// }) 


