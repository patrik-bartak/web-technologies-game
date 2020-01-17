
// 2D array for chip information
var board;
// index of the next free row in each column
var nextFree;
// colour of the current turn
var turn;
// status of the game
var gameover = false;
// colour of the player 
var playerColour;
var opponentColour;
// player names
var playerTwoName;
var playerTwoName;
// for stopping the timer
var refreshIntervalID;
// Once the document has finished loading
$(document).ready(function() {
    var errorSound = new Audio("../audio/errorSound.mp3");
    var chipSound = new Audio("../audio/chipSound.mp3");
    // Hide the win message
    $("#loading-popup").hide();
    $("#win-message").hide();
    $("#lose-message").hide();
    $("#your-turn").toggleClass("turn-highlight", true);
    $("#opponent-turn").toggleClass("turn-highlight", true);

    // Highlight the bottom slot in a column whenever you hover over a slot
    $(".grid-slot").hover(function () {
        if (turn == playerColour && gameover == false) {
            let xCoord = parseInt(filterID(this.id)[0]);
            $("#slot-" + xCoord + "-" + nextFree[xCoord]).css("border", "1px solid " + turn);
        }
    }, function () {
        if (turn == playerColour && gameover == false) {
            let xCoord = parseInt(filterID(this.id)[0]);
            $("#slot-" + xCoord + "-" + nextFree[xCoord]).css("border", "1px solid black");
        }
    });
    // A player executing their turn
    $(".grid-slot").mousedown(function () {
        let xCoord = parseInt(filterID(this.id)[0]);
        if (nextFree[xCoord] < 6 && turn == playerColour && gameover == false) {
            chipSound.play();
            let message = {
                "type": "moveMade",
                "playerColour": turn,
                "x": xCoord
            };
            socket.send(JSON.stringify(message));
            console.log("Sending x value of move");
        } else {
            // error sound
            errorSound.play();
        }
    });

    $("#time-elapsed").html("Time elapsed: 00:00");
});

function updateBoard() {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] != "") {
                $("#slot-" + i + "-" + j).css("background-color", board[i][j]);
                $("#slot-" + i + "-" + j).css("border", "1px solid black");
            }
        }
    }
}

function filterID(id) {
    return id.replace("slot-", "").replace("-", "");
}

var socket;

function openSocket(name) {
    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = function(){
        sendName(socket, name);
    };

    socket.onmessage = function(event){
        let message = JSON.parse(event.data);

        if (message.type == "startGame") {
            startGame(message);
        } else if (message.type == "redirectToRoot") {
            window.location.replace("/");
        } else if (message.type == "updateBoard") {
            board = message.board;
            nextFree = message.nextFree;
            turn = message.turn;
            $("#slot-" + message.recentMove.x + "-" + message.recentMove.y).toggleClass("drop-chip");
            // console.table(board);
            updateTurnDisplay();
            updateBoard();
        } else if (message.type == "gameOver") {
            console.log(message.result);
            $("#" + message.result + "-message").show();
            gameover = true;
            clearInterval(refreshIntervalID);
            $("#your-turn").toggleClass("turn-highlight", true);
            $("#opponent-turn").toggleClass("turn-highlight", true);
        }

        console.log(JSON.stringify(message));
    }
}

function sendName(socket, name) {
    let message = {
        "type": "newPlayer",
        "data": [name]
    };
    socket.send(JSON.stringify(message));
    console.log("Sending the user's name");
};

function updateTurnDisplay() {
    if (turn == playerColour) {
        $("#your-turn").toggleClass("turn-highlight", false);
        $("#opponent-turn").toggleClass("turn-highlight", true);
    } else if (turn == opponentColour) {
        $("#your-turn").toggleClass("turn-highlight", true);
        $("#opponent-turn").toggleClass("turn-highlight", false);
    }
};

function startGame(message) {
    board = message.board;
    nextFree = message.nextFree;
    turn = message.turn;
    playerOneName = message.playerOneName;
    playerTwoName = message.playerTwoName;
    playerColour = message.playerColour;
    opponentColour = message.opponentColour;

    updateTurnDisplay();

    initializeGameScreen();
    console.table(board);
};

function initializeGameScreen() {
    $("#lobby-popup").hide();
    startTimer();
    $("#playerOneName").text(playerOneName);
    $("#playerTwoName").text(playerTwoName);
    $("#your-turn").css("color", playerColour);
    $("#opponent-turn").css("color", opponentColour);
}

function leaveGame() {
    if (socket !== undefined) {
        let message = {
            "type": "closeGame"
        };
        socket.send(JSON.stringify(message));
        console.log("Sending closeGame");
    }
}

function submitName() {
    if (nameOk()) {
        let username = $("#name-input").val();
        $("#name-popup").hide();
        $("#loading-popup").show();
        openSocket(username);
    }
}

function nameOk() {
    if ($("#name-input").val() == "") {
        $("#name-submit-check").text("Field cannot be left blank");
        return false;
    } else {
        return true;
    }
}

function startTimer() {
    var sec = 0;
    function pad ( val ) { return val > 9 ? val : "0" + val; }
    refreshIntervalID = setInterval( function(){
        $("#time-elapsed").html("Time elapsed: " + pad(parseInt(++sec/60,10)) + ":" + pad(sec%60));
    }, 1000);
};













function isGameWon() {
    return isGameWonHorizontal() || isGameWonVertical() || isGameWonDiagonal1() || isGameWonDiagonal2();
}

function isGameWonDiagonal1() {
    return (
        board[0][0] == "red" && board[1][1] == "red" && board[2][2] == "red" && board [3][3] == "red"
    ) || (
        board[0][1] == "red" && board[1][2] == "red" && board[2][3] == "red" && board [3][4] == "red"
    ) || (
        board[0][2] == "red" && board[1][3] == "red" && board[2][4] == "red" && board [3][5] == "red"
    ) || (
        board[1][0] == "red" && board[2][1] == "red" && board[3][2] == "red" && board [4][3] == "red"
    ) || (
        board[1][1] == "red" && board[2][2] == "red" && board[3][3] == "red" && board [4][4] == "red"
    ) || (
        board[1][2] == "red" && board[2][3] == "red" && board[3][4] == "red" && board [4][5] == "red"
    ) || (
        board[2][0] == "red" && board[3][1] == "red" && board[4][2] == "red" && board [5][3] == "red"
    ) || (
        board[2][1] == "red" && board[3][2] == "red" && board[4][3] == "red" && board [5][4] == "red"
    ) || (
        board[2][2] == "red" && board[3][3] == "red" && board[4][4] == "red" && board [5][5] == "red"
    );
}

//I'm confused, should we do this for yellow as well? !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! (I put the exc. marks so we don't forget to delete this comment afterwards)
function isGameWonDiagonal2() { // not yet flipped from first diagonal
    return (
        board[5][0] == "red" && board[4][1] == "red" && board[3][2] == "red" && board [2][3] == "red"
    ) || (
        board[4][0] == "red" && board[3][1] == "red" && board[2][2] == "red" && board [1][3] == "red"
    ) || (
        board[3][0] == "red" && board[2][1] == "red" && board[1][2] == "red" && board [0][3] == "red"
    ) || (
        board[5][1] == "red" && board[4][2] == "red" && board[3][3] == "red" && board [2][4] == "red"
    ) || (
        board[4][1] == "red" && board[3][2] == "red" && board[2][3] == "red" && board [1][4] == "red"
    ) || (
        board[3][1] == "red" && board[2][2] == "red" && board[1][3] == "red" && board [0][4] == "red"
    ) || (
        board[5][2] == "red" && board[4][3] == "red" && board[3][4] == "red" && board [2][5] == "red"
    ) || (
        board[4][2] == "red" && board[3][3] == "red" && board[2][4] == "red" && board [1][5] == "red"
    ) || (
        board[3][2] == "red" && board[2][3] == "red" && board[1][4] == "red" && board [0][5] == "red"
    );
}
