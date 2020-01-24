// NODE MODULES ///////////////////////////////////////////////////////////////////////////////////

const express = require("express");
const http = require("http");
const websocket = require("ws");
const bodyParser = require("body-parser");
const Game = require("./game");

// DATA MODEL /////////////////////////////////////////////////////////////////////////////////////

var ongoingGames = [];
var playerQueue = [];
var playerOneColour = "#b800e6";
var playerTwoColour = "#008cff";

// array of websockets associated with the game
var websocketGamePairs = [];

// array of websockets associated with the player
var websocketPlayerPairs = [];

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
    res.render("splash.ejs", {
        gamesInitialized: gamesInitialized,
        currentlyPlaying: ongoingGames.length,
        playersInQueue: playerQueue.length,
        gamesSince: gamesSince.toDateString()
    });
});

app.get("/game/", function(req, res) {
    res.sendFile("game.html", {root: "./public"});
});

// WEBSOCKET //////////////////////////////////////////////////////////////////////////////////////

// CREATING THE WEBSOCKET CODE BELOW 
const wss = new websocket.Server({server});
wss.on("connection", function(ws) {
    ws.id = nextFreeWebSocketID++;
    console.log("Connection established with new websocket");
    
    // THIS CODE EXECUTES WHEN A MESSAGE IS RECEIVED BY THE SERVER
    // WHAT DOES IT DO?
    //      - FIGURES WHAT MESSAGE TYPE IT IS 
    //      - PERFORMS THE APPROPRIATE ACTION
    ws.on("message", function incoming(messageString) {
        console.log("Message received");
        let message = JSON.parse(messageString); // String to object

        if (message.type == "newPlayer") { // Sets new player
            newPlayer(ws, message);
        } else if (message.type == "moveMade") {
            let recentmove = moveMade(ws, message);
            let game = findGame(ws);
            sendBoardUpdate(game, recentmove);
            if (checkForWin(game, message.playerColour)) {
                sendWinningMessage(ws, game);
            } else if (checkForDraw(game)) {
                sendDrawMessage(game);
            }
        }
    });

    // THIS CODE EXECUTES WHEN ONE OF THE WEBSOCKETS IS CLOSED
    // WHAT DOES IT DO?
    //      - FINDS THE GAME/PLAYER THAT BELONGS TO THE WEBSOCKET THAT HAS BEEN CLOSED
    //      - USES THAT TO FIND THE OTHER PLAYER THAT IS STILL IN THE GAME
    //      - SENDS A REDIRECT MESSAGE
    ws.on("close", function close(messageString) {
        console.log("A WEBSOCKET HAS CLOSED");
        let gameClose = findGame(ws);
        if (gameClose !== undefined) {
            let redirectMessage = JSON.stringify({
                "type": "connectionLost"
            })
            console.log("THE CLOSED WEBSOCKET BELONGED TO A GAME");

            if (gameClose.playerOne.websocket.id == ws.id) { // Deciding which player needs to be redirected 
                console.log("Redirecting playerTwo");
                gameClose.playerTwo.websocket.send(redirectMessage);
            } else if (gameClose.playerTwo.websocket.id == ws.id) {
                console.log("Redirecting playerOne");
                gameClose.playerOne.websocket.send(redirectMessage);
            }
            for (let i = 0; i < ongoingGames.length; i++) {
                if (ongoingGames[i] == gameClose) {
                    ongoingGames.splice(i, 1);
                }
            }
            for (let i = 0; i < websocketGamePairs.length; i++) {
                if (websocketGamePairs[i].websocket.id == gameClose.playerOne.websocket.id) {
                    websocketGamePairs.splice(i, 1);
                }
                if (websocketGamePairs[i].websocket.id == gameClose.playerTwo.websocket.id) {
                    websocketGamePairs.splice(i, 1);
                }
            }
            for (let i = 0; i < websocketPlayerPairs.length; i++) {
                if (websocketPlayerPairs[i].websocket.id == gameClose.playerOne.websocket.id) {
                    websocketPlayerPairs.splice(i, 1);
                }
                if (websocketPlayerPairs[i].websocket.id == gameClose.playerTwo.websocket.id) {
                    websocketPlayerPairs.splice(i, 1);
                }
            }
            gameClose.playerTwo.websocket.close();
            gameClose.playerOne.websocket.close();
        } else {
            let playerClose = findPlayer(ws);
            if (playerClose !== undefined) {
                console.log("THE CLOSED WEBSOCKET BELONGED TO A QUEUED PLAYER");
                for (let i = 0; i < playerQueue.length; i++) {
                    if (playerQueue[i].id == playerClose.id) {
                        playerQueue.splice(i, 1);
                    }
                }
                for (let i = 0; i < websocketPlayerPairs.length; i++) {
                    if (websocketPlayerPairs[i].websocket.id == playerClose.websocket.id) {
                        websocketPlayerPairs.splice(i, 1);
                    }
                }
            }
        }
    });
});

function sendDrawMessage(game) {
    let drawMessage = {
        "type": "gameOver",
        "result": "draw"
    };

    console.log("The game is a draw");
    game.playerOne.websocket.send(JSON.stringify(drawMessage));
    game.playerTwo.websocket.send(JSON.stringify(drawMessage));
}

function sendWinningMessage(ws, game) {
    let winMessage = {
        "type": "gameOver",
        "result": "win",
        "winningCoords": game.winningCoords
    };
    let loseMessage = {
        "type": "gameOver",
        "result": "lose",
        "winningCoords": game.winningCoords
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

function checkForDraw(game) {
    let board = game.board;
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 6; j++) {
            if (board[i][j] == "") {
                return false;
            }
        }
    }
    return true;
}

function checkForWin(game, colour) {
    return isGameWonHorizontal(game, colour) || isGameWonVertical(game, colour) || isGameWonDiagonal1(game, colour) || isGameWonDiagonal2(game, colour);
};

function isGameWonHorizontal(game, colour) {
    let winningCoords = [];
    let board = game.board;
    let inc = 0;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (board[j][i] == colour) {
                inc++;
                winningCoords.push([j, i]);
                if (inc > 3) {
                    game.winningCoords = winningCoords;
                    return true;
                }
            } else if (board[j][i] != colour) {
                inc = 0;
                winningCoords = [];
            }
        }
        inc = 0;
        winningCoords = [];
    }
    return false;
}

function isGameWonVertical(game, colour) {
    let winningCoords = [];
    let board = game.board;
    let inc = 0;
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 6; j++) {
            if (board[i][j] == colour) {
                inc++;
                winningCoords.push([i, j]);
                if (inc > 3) {
                    game.winningCoords = winningCoords;
                    return true;
                }
            } else if (board[i][j] != colour) {
                inc = 0;
                winningCoords = [];
            }
        }
        inc = 0;
        winningCoords = [];
    }
    return false;
};

function isGameWonDiagonal1(game, colour) {
    let board = game.board;
    if (board[0][0] == colour && board[1][1] == colour && board[2][2] == colour && board [3][3] == colour) {
        game.winningCoords = [[0, 0], [1, 1], [2, 2], [3, 3]];
        return true;
    } else if (board[0][1] == colour && board[1][2] == colour && board[2][3] == colour && board [3][4] == colour) {
        game.winningCoords = [[0, 1], [1, 2], [2, 3], [3, 4]];
        return true;
    } else if (board[0][2] == colour && board[1][3] == colour && board[2][4] == colour && board [3][5] == colour) {
        game.winningCoords = [[0, 2], [1, 3], [2, 4], [3, 5]];
        return true;
    } else if (board[1][0] == colour && board[2][1] == colour && board[3][2] == colour && board [4][3] == colour) {
        game.winningCoords = [[1, 0], [2, 1], [3, 2], [4, 3]];
        return true;
    } else if (board[1][1] == colour && board[2][2] == colour && board[3][3] == colour && board [4][4] == colour) {
        game.winningCoords = [[1, 1], [2, 2], [3, 3], [4, 4]];
        return true;
    } else if (board[1][2] == colour && board[2][3] == colour && board[3][4] == colour && board [4][5] == colour) {
        game.winningCoords = [[1, 2], [2, 3], [3, 4], [4, 5]];
        return true;
    } else if (board[2][0] == colour && board[3][1] == colour && board[4][2] == colour && board [5][3] == colour) {
        game.winningCoords = [[2, 0], [3, 1], [4, 2], [5, 3]];
        return true;
    } else if (board[2][1] == colour && board[3][2] == colour && board[4][3] == colour && board [5][4] == colour) {
        game.winningCoords = [[2, 1], [3, 2], [4, 3], [5, 4]];
        return true;
    } else if (board[2][2] == colour && board[3][3] == colour && board[4][4] == colour && board [5][5] == colour) {
        game.winningCoords = [[2, 2], [3, 3], [4, 4], [5, 5]];
        return true;
    } else if (board[3][0] == colour && board[4][1] == colour && board[5][2] == colour && board [6][3] == colour) {
        game.winningCoords = [[3, 0], [4, 1], [5, 2], [6, 3]];
        return true;
    } else if (board[3][1] == colour && board[4][2] == colour && board[5][3] == colour && board [6][4] == colour) {
        game.winningCoords = [[3, 1], [4, 2], [5, 3], [6, 4]];
        return true;
    } else if (board[3][2] == colour && board[4][3] == colour && board[5][4] == colour && board [6][5] == colour) {
        game.winningCoords = [[3, 2], [4, 3], [5, 4], [6, 5]];
        return true;
    } else {
        return false;
    }
}

function isGameWonDiagonal2(game, colour) {
    let board = game.board;
    if (board[6][0] == colour && board[5][1] == colour && board[4][2] == colour && board [3][3] == colour) {
        game.winningCoords = [[6, 0], [5, 1], [4, 2], [3, 3]];
        return true;
    } else if (board[6][1] == colour && board[5][2] == colour && board[4][3] == colour && board [3][4] == colour) {
        game.winningCoords = [[6, 1], [5, 2], [4, 3], [3, 4]];
        return true;
    } else if (board[6][2] == colour && board[5][3] == colour && board[4][4] == colour && board [3][5] == colour) {
        game.winningCoords = [[6, 2], [5, 3], [4, 4], [3, 5]];
        return true;
    } else if (board[5][0] == colour && board[4][1] == colour && board[3][2] == colour && board [2][3] == colour) {
        game.winningCoords = [[5, 0], [4, 1], [3, 2], [2, 3]];
        return true;
    } else if (board[4][0] == colour && board[3][1] == colour && board[2][2] == colour && board [1][3] == colour) {
        game.winningCoords = [[4, 0], [3, 1], [2, 2], [1, 3]];
        return true;
    } else if (board[3][0] == colour && board[2][1] == colour && board[1][2] == colour && board [0][3] == colour) {
        game.winningCoords = [[3, 0], [2, 1], [1, 2], [0, 3]];
        return true;
    } else if (board[5][1] == colour && board[4][2] == colour && board[3][3] == colour && board [2][4] == colour) {
        game.winningCoords = [[5, 1], [4, 2], [3, 3], [2, 4]];
        return true;
    } else if (board[4][1] == colour && board[3][2] == colour && board[2][3] == colour && board [1][4] == colour) {
        game.winningCoords = [[4, 1], [3, 2], [2, 3], [1, 4]];
        return true;
    } else if (board[3][1] == colour && board[2][2] == colour && board[1][3] == colour && board [0][4] == colour) {
        game.winningCoords = [[3, 1], [2, 2], [1, 3], [0, 4]];
        return true;
    } else if (board[5][2] == colour && board[4][3] == colour && board[3][4] == colour && board [2][5] == colour) {
        game.winningCoords = [[5, 2], [4, 3], [3, 4], [2, 5]];
        return true;
    } else if (board[4][2] == colour && board[3][3] == colour && board[2][4] == colour && board [1][5] == colour) {
        game.winningCoords = [[4, 2], [3, 3], [2, 4], [1, 5]];
        return true;
    } else if (board[3][2] == colour && board[2][3] == colour && board[1][4] == colour && board [0][5] == colour) {
        game.winningCoords = [[3, 2], [2, 3], [1, 4], [0, 5]];
        return true;
    } else {
        return false;
    }
}

function sendBoardUpdate(game, recentmove) {
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
    if (game.turn == playerOneColour) {
        game.turn = playerTwoColour;
    } else if (game.turn == playerTwoColour) {
        game.turn = playerOneColour;
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
    playerOne.colour = playerOneColour;
    playerTwo.colour = playerTwoColour;
    console.log("Creating new game - playerOne: " + playerOne.name + " - playerTwo: " + playerTwo.name);
    let newGame = new Game(nextFreeGameID++, playerOne, playerTwo, true, playerOneColour);
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
        "playerOneColour": playerOneColour,
        "playerTwoColour": playerTwoColour,
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
    let player;
    for (let i = 0; i < websocketPlayerPairs.length; i++) {
        if (websocketPlayerPairs[i].websocket.id == ws.id) {
            player = websocketPlayerPairs[i].player;
        }
    }
    return player;
}

function findGame(ws) { // Returns the game associated with the provided websocket
    let game;
    for (let i = 0; i < websocketGamePairs.length; i++) {
        if (websocketGamePairs[i].websocket.id == ws.id) {
            game = websocketGamePairs[i].game;
        }
    }
    return game;
}


server.listen(3000);


