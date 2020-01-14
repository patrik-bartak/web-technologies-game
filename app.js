// NODE MODULES ///////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const http = require("http");
const websocket = require("ws");
const bodyParser = require("body-parser");

// DATA MODEL /////////////////////////////////////////////////////////////////////////////////////

var ongoingGames = [];
var playerQueue = [];


// one option is to create a game object that keeps track of the WebSocket objects 
// belonging to the game's players. Each WebSocket object receives an id and a Map 
// object with WebSocket id as key and game object as value to ensure that the server 
// can determine quickly for which WebSockets the received messages are meant.

// int, Object, Object, boolean
class Game {
    constructor(gameID, playerOne, playerTwo, ongoing) {
        this.gameID = gameID;
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.ongoing = ongoing;
    }
}

// String, WebSocket, String
class Player {
    constructor(name, websocket, status) {
        this.name = name;
        this.websocket = websocket;
        this.status = status;
    }
}



// SERVER /////////////////////////////////////////////////////////////////////////////////////////

// Create Express server and bind necessary middleware components
var app = express();
// Serve static files under /public, if available
app.use(express.static(__dirname + "/public"));
const server = http.createServer(app)
// Use body-parser to parse parameters in the body of POST requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Log every request received by the server
app.use(function(req, res, next) {
	console.log('[LOG] %s\t%s\t%s\t%s',
		new Date().toISOString(), // timestamp
		req.connection.remoteAddress, // client's address
		req.method, // HTTP method
		req.url // requested URL
	);
	next(); // call on to next component
});


// setting a route to return splash.html when entering the root directory
app.get("/", function(req, res) {
    res.sendFile("splash.html", {root: "./public"});
    // res.redirect("splash.html")
});

app.post("/lobby/", function(req, res) {
    let newPlayer = new Player(req.body.username, "ws", "waiting");
    playerQueue.push(newPlayer);
    res.sendFile("lobby.html", {root: "./public"});
    // send json of player to check object
    // res.json(newPlayer);
});

// app.get("/lobby.html", function(req, res) {
//     wait(1000);
//     res.sendFile("game.html", {root: "./public"});
// });


// WEBSOCKET //////////////////////////////////////////////////////////////////////////////////////

const wss = new websocket.Server({server});

wss.on("connection", function(ws) {
    //let's slow down the server response time a bit to make the change visible on the client side
    setTimeout(function() {
        console.log("Connection state: "+ ws.readyState);
        ws.send("Thanks for the message. --Your server.");
        ws.close();
        console.log("Connection state: "+ ws.readyState);
    }, 000);
    
    ws.on("message", function incoming(data) {
        console.log("[LOG] " + data);
    });
});


server.listen(3000);

