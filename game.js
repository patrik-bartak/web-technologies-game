
// int, Object, Object, boolean
class Game {
    constructor(gameID, playerOne, playerTwo, ongoing, turn) {
        this.gameID = gameID;
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.ongoing = ongoing;
        this.board = [ // 2D board array
            ["", "", "", "", "", ""], 
            ["", "", "", "", "", ""], 
            ["", "", "", "", "", ""], 
            ["", "", "", "", "", ""], 
            ["", "", "", "", "", ""], 
            ["", "", "", "", "", ""], 
            ["", "", "", "", "", ""]
        ];
        this.winningCoords = [];
        this.nextFree = [0, 0, 0, 0, 0, 0, 0]; // index of the next free row in each column
        this.turn = turn; // colour of the current turn
    }
}

module.exports = Game;

