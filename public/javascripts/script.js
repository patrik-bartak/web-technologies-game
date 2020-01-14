// var redPositions = [];
// var yellowPositions = [];

// 2D array for chip information
var board = [
    ["", "", "", "", "", ""], 
    ["", "", "", "", "", ""], 
    ["", "", "", "", "", ""], 
    ["", "", "", "", "", ""], 
    ["", "", "", "", "", ""], 
    ["", "", "", "", "", ""], 
    ["", "", "", "", "", ""]
];

// index of the next free row in each column
var nextFree = [0, 0, 0, 0, 0, 0, 0];

// colour of the current turn
var turn = "red";

// TODO:
// Make the turns work online
// Make the game actually know when an individual player has won
// Block one players action's while it is the other player's turn



// Once the document has finished loading
$(document).ready(function() {
    // Hide the win message
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

        // Adds a chip to the board
        insertAt(xCoord);

        // Updates the visual representation of the board
        updateBoard();
        console.log(nextFree);
        console.log(isGameWon());

        // Checks if a winning scenario has occured after every move
        if (isGameWon()) {
            $("#win-message").show();
        }
    });

    // Starts the game timer
    startTimer();
});



// $(".grid-slot").hover(function () {
//     if ($(this).css("background-color") != "red") {
//         $(this).css("background-color", "darkred");
//     }
// }, function () {
//     let coords = filterID(this.id)
//     if (board[coords[0]][coords[1]] != "red") {
//         $(this).css("background-color", "rgb(38, 48, 49)");
//     }
//     updateBoard();
// });

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

function insertAt(x) {
    if (nextFree[x] < 6) { // turn can be red or yellow depending on turn
        board[x][nextFree[x]] = turn;
        
        $("#slot-" + x + "-" + nextFree[x]).toggleClass("drop-chip");
        nextFree[x]++;
        swapPlayerTurn();
    }
}

function swapPlayerTurn() {
    $("#your-turn").toggleClass("turn-highlight");
    $("#opponent-turn").toggleClass("turn-highlight");
    if (turn == "red") {
        turn = "yellow";
    } else if (turn == "yellow") {
        turn = "red";
    }
}

function startTimer() {
    $("#time-elapsed").html("Time elapsed: 00:00");
    var sec = 0;
    function pad ( val ) { return val > 9 ? val : "0" + val; }
    setInterval( function(){
        $("#time-elapsed").html("Time elapsed: " + pad(parseInt(++sec/60,10)) + ":" + pad(sec%60));
    }, 1000);
};

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




var socket = new WebSocket("ws://localhost:3000");
socket.onmessage = function(event){
    console.log(event.data);
}

socket.onopen = function(){
    socket.send("Hello from the client!");
    console.log("Sending a first message to the server ...");
};
