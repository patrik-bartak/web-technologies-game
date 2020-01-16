// NODE MODULES ///////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const http = require("http");
const websocket = require("ws");
const bodyParser = require("body-parser");
const Game = require("./game");

// DATA MODEL /////////////////////////////////////////////////////////////////////////////////////

var ongoingGames = [];
var playerQueue = [];

// var websocket = {"websocket": game};
// array of websocket-game pairs
// var websockets = [];

// one option is to create a game object that keeps track of the WebSocket objects 
// belonging to the game's players. Each WebSocket object receives an id and a Map 
// object with WebSocket id as key and game object as value to ensure that the server 
// can determine quickly for which WebSockets the received messages are meant.

var nextFreeGameID = 0;

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

app.get("/game/", function(req, res) {
    res.sendFile("game.html", {root: "./public"});
    // let newPlayer = new Player(req.body.username, "ws", "waiting");
    // playerQueue.push(newPlayer);
    // res.sendFile("game.html", {root: "./public"});
});

// WEBSOCKET //////////////////////////////////////////////////////////////////////////////////////

const wss = new websocket.Server({server});

wss.on("connection", function(ws) {
    //let's slow down the server response time a bit to make the change visible on the client side
    // setTimeout(function() {
    //     console.log("Connection state: "+ ws.readyState);
        // ws.send("Thanks for the message. --Your server.");
    //     ws.close();
    //     console.log("Connection state: "+ ws.readyState);
    // }, 000);
    
    // ws.send("Connection opened");

    // if (playerQueue.length > 1) {
    //     ws.send("A match can be made");
    // }
    
    ws.on("message", function incoming(messageString) {


        // TODO: Figure out efficient way of associating websocket with game without circular references
        // TODO: Keep going in implementing websocket and moving game logic onto the server-side
        // TODO: Refactor client-side code and make it more systematic


        console.log("ongoingGames" + ongoingGames);
        console.log("playerQueue" + playerQueue);

        let message = JSON.parse(messageString); // String to object

        if (message.type == "newPlayer") { // Sets new player
            newPlayer(ws, message);
            
        } else if (message.type == "closeGame") {
            closeGame(ws, message);
        } else if (message.type == "moveMade") {

            ws.game.board[message.x][ws.game.nextFree[message.x]++] = ws.game.turn;
            if (ws.game.turn == "red") {
                ws.game.turn = "yellow";
            } else if (ws.game.turn == "yellow") {
                ws.game.turn = "red";
            }
            console.log("Move registered");
            console.log(ws.game.board);
        }

        console.log("[LOG] " + playerQueue[0]);
    });
});


function newPlayer(ws, message) {
    let newPlayer = new Player(message.data[0], ws, "waiting"); // Create new player
    ws.player = newPlayer;
    playerQueue.push(newPlayer); // Add new player to the queue 
    if (playerQueue.length > 1) { // If a match can be made, create a new game
        newGame();
    }
}


function newGame() {
    let playerOne = playerQueue.shift();
    let playerTwo = playerQueue.shift();
    let newGame = new Game(nextFreeGameID++, playerOne, playerTwo, true);
    ongoingGames.push(newGame);

    // let websocketPair = {
    //     "playerOne": playerOne.websocket,
    //     "playerTwo": playerTwo.websocket,
    //     "game": newGame
    // };

    let message = {
        "type": "startGame",
        "playerOneName": playerOne.name,
        "playerTwoName": playerTwo.name,
        "board": newGame.board,
        "nextFree": newGame.nextFree,
        "turn": newGame.turn
    }

    playerOne.websocket.game = newGame;
    playerTwo.websocket.game = newGame;

    playerOne.websocket.send(JSON.stringify(message));
    playerTwo.websocket.send(JSON.stringify(message));
}

function closeGame(ws, message) {
    let redirectMessage = JSON.stringify({
        "type": "redirectToRoot"
    })

    if (ws.game === undefined) {
        console.log("Redirecting single player");
        ws.close();
        playerQueue.splice(playerQueue.indexOf(ws.player), 1);
    } else {
        console.log("Redirecting entire game");
        let gameToClose = ws.game;

        if (ws.game.playerOne.websocket == ws) {
            ws.game.playerTwo.websocket.send(redirectMessage);
            ws.game.playerTwo.websocket.close();
            ws.close();
        } else if (ws.game.playerTwo.websocket == ws) {
            ws.game.playerOne.websocket.send(redirectMessage);
            ws.game.playerOne.websocket.close();
            ws.close();
        }

        ongoingGames.splice(ongoingGames.indexOf(gameToClose), 1);
    }
}


server.listen(3000);

