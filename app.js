const express = require("express");
const http = require("http");
const websocket = require("ws");

// var port = process.argv[2];
const port = 3000;
const app = express();

app.use(express.static(__dirname + "/public"));
const server = http.createServer(app)

const wss = new websocket.Server({server});

class Game {
    constructor(gameID, playerOne, playerTwo, ongoing) {
        this.gameID = gameID;
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.ongoing = ongoing;
    }
}

// setting a route to return splash.html when entering the root directory
app.get("/", function(req, res) {
    res.sendFile("splash.html", {root: "./public"});
});

// websocket stuff
// wss.on("connection", function(ws) {
//     //let's slow down the server response time a bit to make the change visible on the client side
//     setTimeout(function() {
//         console.log("Connection state: "+ ws.readyState);
//         ws.send("Thanks for the message. --Your server.");
//         ws.close();
//         console.log("Connection state: "+ ws.readyState);
//     }, 2000);
    
//     ws.on("message", function incoming(message) {
//         console.log("[LOG] " + message);
//     });
// });

// not needed until we send data along the post request
// app.post("/game.html", function (req, res) {
//     res.sendFile("game.html");
// }) 

// app.post("/lobby.html", function (req, res) {
// }) 

server.listen(port);