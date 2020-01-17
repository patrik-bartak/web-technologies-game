// NODE MODULES ///////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const http = require("http");
const websocket = require("ws");
const bodyParser = require("body-parser");
const Game = require("./game");

// DATA MODEL /////////////////////////////////////////////////////////////////////////////////////

var ongoingGames = [];
var playerQueue = [];

// I think I cannot use maps?
// var x = new Map();

// var websocket = {"websocket": game};
// array of websockets associated with the game
var websocketGamePairs = [];

// array of websockets associated with the player
var websocketPlayerPairs = [];

// one option is to create a game object that keeps track of the WebSocket objects 
// belonging to the game's players. Each WebSocket object receives an id and a Map 
// object with WebSocket id as key and game object as value to ensure that the server 
// can determine quickly for which WebSockets the received messages are meant.

var nextFreeGameID = 0;
var nextFreeWebSocketID = 0;
var nextFreePlayerID = 0;

// String, WebSocket, String
class Player {
    constructor(id, name, websocket, status, colour) {
        this.id = id;
        this.name = name;
        this.websocket = websocket;
        this.status = status;
        this.colour = colour;
    }
}

var gamesInitialized = 0;
var gamesSince = new Date(Date.now());

// var gameStats = {
//     since: Date.now(), /* since we keep it simple and in-memory, keep track of when this object was created */
//     gamesInitialized: 0,
//     gamesCompleted: 0, /* number of games initialized */
//     currentlyPlaying: ongoingGames.length
// };

// SERVER /////////////////////////////////////////////////////////////////////////////////////////

// Create Express server and bind necessary middleware components
var app = express();
// use ejs for views
app.set("view engine", "ejs");
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
    // res.sendFile("splash.html", {root: "./public"});
    res.render("splash.ejs", {
        gamesInitialized: gamesInitialized,
        currentlyPlaying: ongoingGames.length,
        playersInQueue: playerQueue.length,
        gamesSince: gamesSince.toDateString()
    });
});

app.get("/game/", function(req, res) {
    res.sendFile("game.html", {root: "./public"});
    // let newPlayer = new Player(req.body.username, "ws", "waiting");
    // playerQueue.push(newPlayer);
    // res.sendFile("game.html", {root: "./public"});
});

// WEBSOCKET //////////////////////////////////////////////////////////////////////////////////////

const wss = new websocket.Server({server});

setInterval(function() {
    console.log("Checking websocket state...");
    // console.log("-pq--og--pws--gws--------");
    // console.log(playerQueue.length);
    // console.log(ongoingGames.length);
    // console.log(websocketPlayerPairs.length);
    // console.log(websocketGamePairs.length);
    for (let i = 0; i < websocketGamePairs.length; i++) {
        let game;
        let ws = websocketGamePairs[i].websocket;
        let status = ws.readyState;
        if (status == 2 || status == 3) {
            let redirectMessage = JSON.stringify({
                "type": "redirectToRoot"
            })
            console.log("A WEBSOCKET IN A GAME IS DOWN");
            game = findGame(ws);

            if (game === undefined) {
                break;
            }

            if (game.playerOne.websocket.id == ws.id) { // Deciding which player needs to be redirected 
                console.log("Redirecting playerTwo");
                game.playerTwo.websocket.send(redirectMessage);
                // game.playerTwo.websocket.close();
            } else if (game.playerTwo.websocket.id == ws.id) {
                console.log("Redirecting playerOne");
                game.playerOne.websocket.send(redirectMessage);
                // game.playerOne.websocket.close();
            }
            // ongoingGames.splice(ongoingGames.indexOf(game), 1);

            for (let i = 0; i < ongoingGames.length; i++) {
                if (ongoingGames[i] == game) {
                    ongoingGames.splice(i, 1);
                }
            }

            // console.log(ongoingGames.indexOf(game));
            for (let i = 0; i < websocketGamePairs.length; i++) {
                if (websocketGamePairs[i].websocket.id == game.playerOne.websocket.id) {
                    websocketGamePairs.splice(i, 1);
                }
                if (websocketGamePairs[i].websocket.id == game.playerTwo.websocket.id) {
                    websocketGamePairs.splice(i, 1);
                }
            }
            for (let i = 0; i < websocketPlayerPairs.length; i++) {
                if (websocketPlayerPairs[i].websocket.id == game.playerOne.websocket.id) {
                    websocketPlayerPairs.splice(i, 1);
                }
                if (websocketPlayerPairs[i].websocket.id == game.playerTwo.websocket.id) {
                    websocketPlayerPairs.splice(i, 1);
                }
            }
            game.playerTwo.websocket.close();
            game.playerOne.websocket.close();
        }
    }
    for (let i = 0; i < websocketPlayerPairs.length; i++) {
        let player;
        let ws = websocketPlayerPairs[i].websocket;
        let status = ws.readyState;
        if (status == 2 || status == 3) {
            console.log("A WEBSOCKET IN THE PLAYER QUEUE IS DOWN");
            player = findPlayer(ws);
            if (player === undefined) {
                break;
            }
            for (let i = 0; i < playerQueue.length; i++) {
                if (playerQueue[i].id == player.id) {
                    playerQueue.splice(i, 1);
                }
            }
            for (let i = 0; i < websocketPlayerPairs.length; i++) {
                if (websocketPlayerPairs[i].websocket.id == player.websocket.id) {
                    websocketPlayerPairs.splice(i, 1);
                }
            }
        }
    }
}, 5000);

wss.on("connection", function(ws) {
    //let's slow down the server response time a bit to make the change visible on the client side
    // setTimeout(function() {
    //     console.log("Connection state: "+ ws.readyState);
        // ws.send("Thanks for the message. --Your server.");
    //     ws.close();
    //     console.log("Connection state: "+ ws.readyState);
    // }, 000);
    ws.id = nextFreeWebSocketID++;
    console.log("Connection established with new websocket");
    
    ws.on("message", function incoming(messageString) {


        // TODO: Figure out efficient way of associating websocket with game without circular references
        // TODO: Keep going in implementing websocket and moving game logic onto the server-side
        // TODO: Refactor client-side code and make it more systematic

        console.log("Message received");
        let message = JSON.parse(messageString); // String to object

        if (message.type == "newPlayer") { // Sets new player
            newPlayer(ws, message);
            
        } else if (message.type == "closeGame") {
            // closeGame(ws, message);
        } else if (message.type == "moveMade") {
            let recentmove = moveMade(ws, message);
            sendBoardUpdate(ws, recentmove);
            if (checkForWin(ws, message.playerColour)) {
                sendWinningMessage(ws, message.playerColour);
            }
        }

        // console.log("[LOG] Logging varibles: (queue, ongoing games, websocketPlayerPairs, websocketGamePairs)");
        // console.log(playerQueue);
        // console.log(ongoingGames);
        // console.log(websocketPlayerPairs);
        // console.log(websocketGamePairs);
    });
});

function sendWinningMessage(ws, colour) {
    let game = findGame(ws);

    let winMessage = {
        "type": "gameOver",
        "result": "win"
    };
    let loseMessage = {
        "type": "gameOver",
        "result": "lose"
    };
    let drawMessage = {
        "type": "gameOver",
        "result": "draw"
    };

    if (game.playerOne.websocket.id == ws.id) { // Deciding which player needs to be redirected 
        console.log("Player One Wins");
        game.playerOne.websocket.send(JSON.stringify(winMessage));
        game.playerTwo.websocket.send(JSON.stringify(loseMessage));
    } else if (game.playerTwo.websocket.id == ws.id) {
        console.log("Player Two wins");
        game.playerTwo.websocket.send(JSON.stringify(winMessage));
        game.playerOne.websocket.send(JSON.stringify(loseMessage));
    }
};

function getOppositeColour(colour) {
    if (colour == "red") {
        return "yellow";
    } else if (colour == "yellow") {
        return "red";
    }
};

function checkForWin(ws, colour) {
    let game = findGame(ws);
    let oppositeColour = getOppositeColour(colour);
    return isGameWonHorizontal(game.board, colour, oppositeColour) || isGameWonVertical(game.board, colour, oppositeColour) || isGameWonDiagonal1(game.board, colour, oppositeColour) || isGameWonDiagonal2(game.board, colour, oppositeColour);
};

function isGameWonHorizontal(board, colour, oppositeColour) {
    let inc = 0;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (board[j][i] == colour) {
                inc++;
                if (inc > 3) {
                    return true;
                }
            } else if (board[j][i] != colour) {
                inc = 0;
            }
        }
        inc = 0;
    }
    return false;
}

function isGameWonVertical(board, colour, oppositeColour) {
    let inc = 0;
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 6; j++) {
            if (board[i][j] == colour) {
                inc++;
                if (inc > 3) {
                    return true;
                }
            } else if (board[i][j] != colour) {
                inc = 0;
            }
        }
        inc = 0;
    }
    return false;
};

function isGameWonDiagonal1(board, colour, oppositeColour) {
    return (
        board[0][0] == colour && board[1][1] == colour && board[2][2] == colour && board [3][3] == colour
    ) || (
        board[0][1] == colour && board[1][2] == colour && board[2][3] == colour && board [3][4] == colour
    ) || (
        board[0][2] == colour && board[1][3] == colour && board[2][4] == colour && board [3][5] == colour
    ) || (
        board[1][0] == colour && board[2][1] == colour && board[3][2] == colour && board [4][3] == colour
    ) || (
        board[1][1] == colour && board[2][2] == colour && board[3][3] == colour && board [4][4] == colour
    ) || (
        board[1][2] == colour && board[2][3] == colour && board[3][4] == colour && board [4][5] == colour
    ) || (
        board[2][0] == colour && board[3][1] == colour && board[4][2] == colour && board [5][3] == colour
    ) || (
        board[2][1] == colour && board[3][2] == colour && board[4][3] == colour && board [5][4] == colour
    ) || (
        board[2][2] == colour && board[3][3] == colour && board[4][4] == colour && board [5][5] == colour
    ) || (
        board[3][0] == colour && board[4][1] == colour && board[5][2] == colour && board [6][3] == colour
    ) || (
        board[3][1] == colour && board[4][2] == colour && board[5][3] == colour && board [6][4] == colour
    ) || (
        board[3][2] == colour && board[4][3] == colour && board[5][4] == colour && board [6][5] == colour
    );
}

function isGameWonDiagonal2(board, colour, oppositeColour) { // not yet flipped from first diagonal
    return (
        board[6][0] == colour && board[5][1] == colour && board[4][2] == colour && board [3][3] == colour
    ) || (
        board[6][1] == colour && board[5][2] == colour && board[4][3] == colour && board [3][4] == colour
    ) || (
        board[6][2] == colour && board[5][3] == colour && board[4][4] == colour && board [3][5] == colour
    ) || (
        board[5][0] == colour && board[4][1] == colour && board[3][2] == colour && board [2][3] == colour
    ) || (
        board[4][0] == colour && board[3][1] == colour && board[2][2] == colour && board [1][3] == colour
    ) || (
        board[3][0] == colour && board[2][1] == colour && board[1][2] == colour && board [0][3] == colour
    ) || (
        board[5][1] == colour && board[4][2] == colour && board[3][3] == colour && board [2][4] == colour
    ) || (
        board[4][1] == colour && board[3][2] == colour && board[2][3] == colour && board [1][4] == colour
    ) || (
        board[3][1] == colour && board[2][2] == colour && board[1][3] == colour && board [0][4] == colour
    ) || (
        board[5][2] == colour && board[4][3] == colour && board[3][4] == colour && board [2][5] == colour
    ) || (
        board[4][2] == colour && board[3][3] == colour && board[2][4] == colour && board [1][5] == colour
    ) || (
        board[3][2] == colour && board[2][3] == colour && board[1][4] == colour && board [0][5] == colour
    );
}

function sendBoardUpdate(ws, recentmove) {
    let game = findGame(ws);

    let message = {
        "type": "updateBoard",
        "board": game.board,
        "nextFree": game.nextFree,
        "turn": game.turn,
        "recentMove": recentmove
    };

    game.playerOne.websocket.send(JSON.stringify(message));
    game.playerTwo.websocket.send(JSON.stringify(message));
};


function moveMade(ws, message) {
    let game = findGame(ws);

    let recentMove = {
        "x": message.x,
        "y": game.nextFree[message.x]
    }
    game.board[message.x][game.nextFree[message.x]++] = game.turn;
    if (game.turn == "red") {
        game.turn = "yellow";
    } else if (game.turn == "yellow") {
        game.turn = "red";
    }
    console.log("Move registered");
    console.log(game.board);
    return recentMove;
}


function newPlayer(ws, message) {
    console.log("Creating new player object - name: " + message.data[0]);
    let newPlayer = new Player(nextFreePlayerID, message.data[0], ws, "waiting", undefined); // Create new player
    websocketPlayerPairs.push({
        "websocket": ws,
        "player": newPlayer
    });
    console.log("Adding player to queue");
    playerQueue.push(newPlayer); // Add new player to the queue 
    if (playerQueue.length > 1) { // If a match can be made, create a new game
        console.log("Two players found");
        newGame();
    }
}


function newGame() {
    let playerOne = playerQueue.shift();
    let playerTwo = playerQueue.shift();
    playerOne.colour = "red";
    playerTwo.colour = "yellow";
    console.log("Creating new game - playerOne: " + playerOne.name + " - playerTwo: " + playerTwo.name);
    let newGame = new Game(nextFreeGameID++, playerOne, playerTwo, true);
    gamesInitialized++;
    console.log("Removing players from queue");
    console.log("Adding game to ongoing games");
    ongoingGames.push(newGame);

    websocketGamePairs.push({
        "websocket": playerOne.websocket,
        "game": newGame
    });
    websocketGamePairs.push({
        "websocket": playerTwo.websocket,
        "game": newGame
    });

    let message = {
        "type": "startGame",
        "playerOneName": playerOne.name,
        "playerTwoName": playerTwo.name,
        "board": newGame.board,
        "nextFree": newGame.nextFree,
        "turn": newGame.turn
    }
    console.log("Sending STARTGAME message to both players");
    message.playerColour = playerOne.colour;
    message.opponentColour = playerTwo.colour;
    playerOne.websocket.send(JSON.stringify(message));
    message.playerColour = playerTwo.colour;
    message.opponentColour = playerOne.colour;
    playerTwo.websocket.send(JSON.stringify(message));
}

function findPlayer(ws) { // Returns the player associated with the provided websocket
    for (let i = 0; i < websocketPlayerPairs.length; i++) {
        if (websocketPlayerPairs[i].websocket.id == ws.id) {
            player = websocketPlayerPairs[i].player;
        }
    }
    return player;
}

function findGame(ws) { // Returns the game associated with the provided websocket
    for (let i = 0; i < websocketGamePairs.length; i++) {
        if (websocketGamePairs[i].websocket.id == ws.id) {
            game = websocketGamePairs[i].game;
        }
    }
    return game;
}


server.listen(3000);

































// function closeGame(ws, message) {
//     let gameToRemove;
//     let playerToRemove;
//     let websocketToClose;
    
//     let redirectMessage = JSON.stringify({
//         "type": "redirectToRoot"
//     })

//     gameToRemove = findGame(ws);

//     if (gameToRemove === undefined) { // True if the game has not started yet and the player is only in the playerQueue
//         console.log("Redirecting single player and deleting websocket and player from queue");
//         playerToRemove = findPlayer(ws);
//         console.log("Closing single websocket");
//         playerToRemove.websocket.close();
//         console.log("Removing player from queue");
//         playerQueue.splice(playerQueue.indexOf(playerToRemove), 1);
//     } else {
//         if (gameToRemove.playerOne.websocket == ws) { // Deciding which player needs to be redirected 
//             console.log("Redirecting playerTwo");
//             gameToRemove.playerTwo.websocket.send(redirectMessage);
//         } else if (gameToRemove.playerTwo.websocket == ws) {
//             console.log("Redirecting playerOne");
//             gameToRemove.playerOne.websocket.send(redirectMessage);
//         } else {
//             console.log("Something went wrong with closing the game");
//         }
//         console.log("Closing both websockets");
//         gameToRemove.playerOne.websocket.close(); // Closing both websockets
//         gameToRemove.playerTwo.websocket.close();
//         console.log("Removing game from ongoing games");
//         ongoingGames.splice(ongoingGames.indexOf(gameToRemove), 1);
//     }
// }