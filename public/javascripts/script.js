// var redPositions = [];
// var yellowPositions = [];

// 2D array for chip information
var board;

// index of the next free row in each column
var nextFree;

// colour of the current turn
var turn;


// Once the document has finished loading
$(document).ready(function() {
    // Hide the win message
    $("#loading-popup").hide();
    $("#win-message").hide();

    // Highlight the bottom slot in a column whenever you hover over a slot
    $(".grid-slot").hover(function () {
        let xCoord = parseInt(filterID(this.id)[0]);
        $("#slot-" + xCoord + "-" + nextFree[xCoord]).css("border", "1px solid " + turn);
        // updateBoard();
    }, function () {
        let xCoord = parseInt(filterID(this.id)[0]);
        $("#slot-" + xCoord + "-" + nextFree[xCoord]).css("border", "1px solid black");
    });

    // A player executing their turn
    $(".grid-slot").mousedown(function () {
        let xCoord = parseInt(filterID(this.id)[0]);
        if (nextFree[xCoord] < 6) {

            let message = {
                "type": "moveMade",
                "x": xCoord
            };
            socket.send(JSON.stringify(message));
            console.log("Sending x value of move");

            // Adds a chip to the board
            // turn can be red or yellow depending on turn
            board[xCoord][nextFree[xCoord]] = turn;
            
            $("#slot-" + xCoord + "-" + nextFree[xCoord]).toggleClass("drop-chip");
            nextFree[xCoord]++;
            swapPlayerTurn();
        }

        // Updates the visual representation of the board
        updateBoard();
        console.log(nextFree);
        console.log(isGameWon());

        // Checks if a winning scenario has occured after every move
        if (isGameWon()) {
            $("#win-message").show();
        }
    });

    $("#time-elapsed").html("Time elapsed: 00:00");
});


function updateBoard() {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] == "red") {
                let chip = $("#slot-" + i + "-" + j);
                chip.css("background-color", "red");
                chip.css("border", "1px solid black");
            }
            if (board[i][j] == "yellow") {
                let chip = $("#slot-" + i + "-" + j);
                chip.css("background-color", "yellow");
                chip.css("border", "1px solid black");
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

function startGame(message) {
    $("#lobby-popup").hide();
    startTimer();
    $("#playerOneName").text(message.playerOneName);
    $("#playerTwoName").text(message.playerTwoName);

    // let game = message.game;
    board = message.board;
    nextFree = message.nextFree;
    turn = message.turn;
};

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
    let username = $("#name-input").val();
    $("#name-popup").hide();
    $("#loading-popup").show();

    openSocket(username);
}

function startTimer() {
    var sec = 0;
    function pad ( val ) { return val > 9 ? val : "0" + val; }
    setInterval( function(){
        $("#time-elapsed").html("Time elapsed: " + pad(parseInt(++sec/60,10)) + ":" + pad(sec%60));
    }, 1000);
};






































function swapPlayerTurn() {
    $("#your-turn").toggleClass("turn-highlight");
    $("#opponent-turn").toggleClass("turn-highlight");
    if (turn == "red") {
        turn = "yellow";
    } else if (turn == "yellow") {
        turn = "red";
    }
}

function isGameWon() {
    return isGameWonHorizontal() || isGameWonVertical() || isGameWonDiagonal1() || isGameWonDiagonal1();
}

function isGameWonDiagonal1() {
    return (
        board[0][0] == "red" && board[1][1] == "red" && board[2][2] == "red" && board [3][3] == "red"
    ) || (
        board[1][0] == "red" && board[2][1] == "red" && board[3][2] == "red" && board [4][3] == "red"
    ) || (
        board[2][0] == "red" && board[3][1] == "red" && board[4][2] == "red" && board [5][3] == "red"
    ) || (
        board[0][1] == "red" && board[1][2] == "red" && board[2][3] == "red" && board [3][4] == "red"
    ) || (
        board[1][1] == "red" && board[2][2] == "red" && board[3][3] == "red" && board [4][4] == "red"
    ) || (
        board[2][1] == "red" && board[3][2] == "red" && board[4][3] == "red" && board [5][4] == "red"
    ) || (
        board[0][2] == "red" && board[1][3] == "red" && board[2][4] == "red" && board [3][5] == "red"
    ) || (
        board[1][2] == "red" && board[2][3] == "red" && board[3][4] == "red" && board [4][5] == "red"
    ) || (
        board[2][2] == "red" && board[3][3] == "red" && board[4][4] == "red" && board [5][5] == "red"
    );
}

function isGameWonDiagonal2() { // not yet flipped from first diagonal
    return (
        board[0][0] == "red" && board[1][1] == "red" && board[2][2] == "red" && board [3][3] == "red"
    ) || (
        board[1][0] == "red" && board[2][1] == "red" && board[3][2] == "red" && board [4][3] == "red"
    ) || (
        board[2][0] == "red" && board[3][1] == "red" && board[4][2] == "red" && board [5][3] == "red"
    ) || (
        board[0][1] == "red" && board[1][2] == "red" && board[2][3] == "red" && board [3][4] == "red"
    ) || (
        board[1][1] == "red" && board[2][2] == "red" && board[3][3] == "red" && board [4][4] == "red"
    ) || (
        board[2][1] == "red" && board[3][2] == "red" && board[4][3] == "red" && board [5][4] == "red"
    ) || (
        board[0][2] == "red" && board[1][3] == "red" && board[2][4] == "red" && board [3][5] == "red"
    ) || (
        board[1][2] == "red" && board[2][3] == "red" && board[3][4] == "red" && board [4][5] == "red"
    ) || (
        board[2][2] == "red" && board[3][3] == "red" && board[4][4] == "red" && board [5][5] == "red"
    );
}

function isGameWonHorizontal() {
    let inc = 0;
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 7; j++) {
            if (board[j][i] == "red") {
                inc++
                if (inc > 3) {
                    return true;
                }
            } else if (board[j][i] == "yellow") {
                inc = 0;
            }
        }
        inc = 0;
    }
    return false;
}

function isGameWonVertical() {
    let inc = 0;
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 6; j++) {
            if (board[i][j] == "red") {
                inc++
                if (inc > 3) {
                    return true;
                }
            } else if (board[i][j] == "yellow") {
                inc = 0;
            }
        }
        inc = 0;
    }
    return false;
};