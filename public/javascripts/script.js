
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
// player colours
var playerOneColour;
var playerTwoColour;
// player names
var playerOneName;
var playerTwoName;
// for stopping the timer
var refreshIntervalID;
// game music
var gameMusic;


// Once the document has finished loading
$(document).ready(function() {
    var errorSound = new Audio("../audio/errorSound.mp3");
    var chipSound = new Audio("../audio/chipSound.mp3");
    gameMusic = new Audio("../audio/bgMusic.mp3");
    gameMusic.loop = true;
    gameMusic.volume = 0.2;
    gameMusic.play();
    // Hide the win message
    $("#loading-popup").hide();
    $("#win-message").hide();
    $("#lose-message").hide();
    $("#draw-message").hide();
    $(".screen-grid").hide();
    $("#music-off").hide();
    $("#fullscreen-off").hide();
    $("#your-turn").toggleClass("turn-highlight", false);
    $("#opponent-turn").toggleClass("turn-highlight", false);

    $("#music-on").mousedown(function () {
        gameMusic.volume = 0;
        $("#music-on").hide();
        $("#music-off").show();
    });
    $("#music-off").mousedown(function () {
        gameMusic.volume = 0.2;
        $("#music-on").show();
        $("#music-off").hide();
    });

    $("#fullscreen-on").mousedown(function () {
        toggleFullscreen();
        $("#fullscreen-on").hide();
        $("#fullscreen-off").show();
    });
    $("#fullscreen-off").mousedown(function () {
        toggleFullscreen();
        $("#fullscreen-on").show();
        $("#fullscreen-off").hide();
    });

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
            setTimeout(function() {chipSound.play();}, 300);
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
            alert("Connection lost with other player");
            window.location.replace("/");
        } else if (message.type == "updateBoard") {
            board = message.board;
            nextFree = message.nextFree;
            turn = message.turn;
            // $("#slot-" + message.recentMove.x + "-" + message.recentMove.y).toggleClass("drop-chip");
            $("#slot-" + message.recentMove.x + "-" + message.recentMove.y).toggleClass("bounce-in-top");
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
            if (message.result !== "draw") {
                showWinningCoords(message.winningCoords);
            }

            setTimeout(function(){
                window.location.replace("/");
            }, 5000);
        }

        console.log(JSON.stringify(message));
    }
}

function showWinningCoords(winningCoords) {
    let x;
    let y;
    for (let i = 0; i < winningCoords.length; i++) {
        x = winningCoords[i][0];
        y = winningCoords[i][1];
        $("#slot-" + x + "-" + y).css("border-color", "white");
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
    playerOneColour = message.playerOneColour;
    playerTwoColour = message.playerTwoColour;
    playerColour = message.playerColour;
    opponentColour = message.opponentColour;

    updateTurnDisplay();

    initializeGameScreen();
    console.table(board);
};

function initializeGameScreen() {
    $("#lobby-popup").hide();
    $(".screen-grid").show();
    startTimer();
    $("#playerOneName").text(playerOneName);
    $("#playerTwoName").text(playerTwoName);
    $("#your-turn").css("color", playerColour);
    $("#opponent-turn").css("color", opponentColour);
    $("#playerOneName").css("color", playerOneColour);
    $("#playerTwoName").css("color", playerTwoColour);
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
        $("#name-popup p").text("Field cannot be left blank");
        $("#name-popup p").css("color", "red");
        setTimeout(function(){
            $("#name-popup p").text("Enter your name");
            $("#name-popup p").css("color", "white");
        }, 1000);
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

function toggleFullscreen(elem) {
    elem = elem || document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement &&
        !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

