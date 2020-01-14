const express = require("express");
const http = require("http");

// var port = process.argv[2];
const port = 3000;
const app = express();

app.use(express.static(__dirname + "/public"));
http.createServer(app).listen(port);

// setting a route to return splash.html when entering the root directory
app.get("/", function(req, res) {
    res.sendFile("splash.html", {root: "./public"});
});

// not needed until we send data along the post request
// app.post("/game.html", function (req, res) {
//     res.sendFile("game.html");
// }) 

// app.post("/lobby.html", function (req, res) {
// }) 

