const express = require("express");
const socketio = require("socket.io");
const exp = express();
exp.use(express.static("web"));
const web = exp.listen(3000, function () {
    console.log("Running");
});
const io = socketio(web);

let startingBoard = [
    [['b', 'R'], ['b', 'N'], ['b', 'B'], ['b', 'Q'], ['b', 'K'], ['b', 'B'], ['b', 'N'], ['b', 'R']],
    [['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P']],
    [[], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], []],
    [[], [], [], [], [], [], [], []],
    [['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P']],
    [['w', 'R'], ['w', 'N'], ['w', 'B'], ['w', 'Q'], ['w', 'K'], ['w', 'B'], ['w', 'N'], ['w', 'R']],
]
let playerCount = 0
let gameCount = 0
let colours = ["w", "b"]
let games = []
let timer = [15, 15] // 2 5 minute timers, 1 for black and one for white

io.on("connection", function (socket) {
    console.log("connected to " + socket.id); // a new connection has been created
    let myGame = gameCount
    socket.join(myGame)
    let myColour = colours[playerCount % 2] // assign O/X to player and advance playerCount
    let myBoolColour = playerCount % 2
    socket.emit("colourAssign", myBoolColour)
    console.log("emmited:", myColour)
    if (playerCount % 2 == 0){
        games.push([new Board(startingBoard), structuredClone(timer)]);
    }
    if (playerCount % 2 == 1) {
        
        gameCount++
        var timerCounter = setInterval(update_timer, 1000)
    }
    playerCount++
    function update_timer() {
        if (games[myGame][0].boardOutcome == 0){
            games[myGame][1][games[myGame][0].whitesTurn]--
            io.to(myGame).emit("timersUpdate", games[myGame][1]);
            if (games[myGame][1][0] <= 0){
                io.to(myGame).emit("whiteTimerLoss")
                clearInterval(timerCounter)
            }
            if (games[myGame][1][1] <= 0) {
                io.to(myGame).emit("blackTimerLoss")
                clearInterval(timerCounter)
            }
        }
    }
    socket.on("makeMove", function (move) {
        let moveValid = false
        if (!square_out_of_bounds(move[0]) && !square_out_of_bounds(move[1])){
            let boardStateBefore = structuredClone(games[myGame][0].board)
            games[myGame][0].move_piece(move[0], move[1], move[2])
            if (JSON.stringify(boardStateBefore) !== JSON.stringify(games[myGame][0].board)){
                moveValid = true
            }
        }
        if (moveValid)
            socket.broadcast.to(myGame).emit("makeMove", move)
        else 
            socket.emit("moveInvalid")
    })
    socket.on('disconnect', function () {
        socket.broadcast.to(myGame).emit("opponentResign")
    })
});

const BOARDSIZE = 8
const BOARDCOLUMN = 1
const BOARDROW = 0

const pawnRelatives = [
    [[1, 1]],         //diagonal: right down
    [[-1, 1]],  //          right up
    [[1, -1]],         //          left  down
    [[-1, -1]], //          left  up
    [],         //straight: right
    [],         //          left
    [[1, 0], [2, 0]],   //  down
    [[-1, 0], [-2, 0]], //  up 
    //L:    major minor
    [],  //  down  right
    [],  //  down  left
    [],  //  up    right
    [],  //  up    left
    [],  //  right down
    [],  //  left  down
    [],  //  right up
    []   //  left  up
]
const knightRelatives = [
    [], //diagonal: right down
    [], //          right up
    [], //          left  down
    [], //          left  up
    [], //straight: right
    [], //          left
    [], //          down
    [], //          up 
    //L:    major minor
    [[2, 1]],   //  down  right
    [[2, -1]],  //  down  left
    [[-2, 1]],  //  up    right
    [[-2, -1]], //  up    left
    [[1, 2]],   //  right down
    [[1, -2]],  //  left  down
    [[-1, 2]],  //  right up
    [[-1, -2]]  //  left  up
]
const bishopRelatives = [
    [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7]],               //diagonal: right down
    [[-1, 1], [-2, 2], [-3, 3], [-4, 4], [-5, 5], [-6, 6], [-7, 7]],        //          right up
    [[1, -1], [2, -2], [3, -3], [4, -4], [5, -5], [6, -6], [7, -7]],        //          left  down
    [[-1, -1], [-2, -2], [-3, -3], [-4, -4], [-5, -5], [-6, -6], [-7, -7]], //          left  up
    [], //straight: right
    [], //          left
    [], //          down
    [], //          up 
    //L:    major minor
    [],   //  down  right
    [],   //  down  left
    [],   //  up    right
    [],   //  up    left
    [],   //  right down
    [],   //  left  down
    [],   //  right up
    []    //  left  up
]
const rookRelatives = [
    [],        //diagonal: right down
    [],        //          right up
    [],        //          left  down
    [],        //          left  up
    [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]],        //straight: right
    [[0, -1], [0, -2], [0, -3], [0, -4], [0, -5], [0, -6], [0, -7]], //          left
    [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],        //          down
    [[-1, 0], [-2, 0], [-3, 0], [-4, 0], [-5, 0], [-6, 0], [-7, 0]], //          up 
    //L:    major minor
    [],     //  down  right
    [],     //  down  left
    [],     //  up    right
    [],     //  up    left
    [],     //  right down
    [],     //  left  down
    [],     //  right up
    []      //  left  up
]
const queenRelatives = [
    [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7]],               //diagonal: right down
    [[-1, 1], [-2, 2], [-3, 3], [-4, 4], [-5, 5], [-6, 6], [-7, 7]],        //          right up
    [[1, -1], [2, -2], [3, -3], [4, -4], [5, -5], [6, -6], [7, -7]],        //          left  down
    [[-1, -1], [-2, -2], [-3, -3], [-4, -4], [-5, -5], [-6, -6], [-7, -7]], //          left  up
    [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]],        //straight: right
    [[0, -1], [0, -2], [0, -3], [0, -4], [0, -5], [0, -6], [0, -7]], //          left
    [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],        //          down
    [[-1, 0], [-2, 0], [-3, 0], [-4, 0], [-5, 0], [-6, 0], [-7, 0]], //          up 
    //L:    major minor
    [],   //  down  right
    [],   //  down  left
    [],   //  up    right
    [],   //  up    left
    [],   //  right down
    [],   //  left  down
    [],   //  right up
    []    //  left  up
]
const kingRelatives = [
    [[1, 1]],    //diagonal: right down
    [[-1, 1]],   //          right up
    [[1, -1]],   //          left  down
    [[-1, -1]],  //          left  up
    [[0, 1], [0, 2]],    //straight: right
    [[0, -1], [0, -2]],   //          left
    [[1, 0]],    //          down
    [[-1, 0]],   //          up 
    //L:    major minor
    [],  //     down  right
    [],  //     down  left
    [],  //     up    right
    [],  //     up    left
    [],  //     right down
    [],  //     left  down
    [],  //     right up
    []   //     left  up
]
const allRelatives = [
    [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [7, 7]],               //diagonal: right down 0
    [[-1, 1], [-2, 2], [-3, 3], [-4, 4], [-5, 5], [-6, 6], [-7, 7]],        //          right up   1
    [[1, -1], [2, -2], [3, -3], [4, -4], [5, -5], [6, -6], [7, -7]],        //          left  down 2
    [[-1, -1], [-2, -2], [-3, -3], [-4, -4], [-5, -5], [-6, -6], [-7, -7]], //          left  up   3
    [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]],        //straight: right 4
    [[0, -1], [0, -2], [0, -3], [0, -4], [0, -5], [0, -6], [0, -7]], //          left  5
    [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]],        //          down  6
    [[-1, 0], [-2, 0], [-3, 0], [-4, 0], [-5, 0], [-6, 0], [-7, 0]], //          up    7
    //L:    major minor
    [[2, 1]],   //  down  right  8
    [[2, -1]],  //  down  left   9
    [[-2, 1]],  //  up    right  10
    [[-2, -1]], //  up    left   11
    [[1, 2]],   //  right down   12
    [[1, -2]],  //  left  down   13
    [[-1, 2]],  //  right up     14
    [[-1, -2]]  //  left  up     15
]
const oppositeDirectionIndex = [3, 2, 1, 0, 5, 4, 7, 6, 11, 10, 9, 8, 15, 14, 13, 12]
function relative_moves_of_piece(pieceType) {
    switch (pieceType) {
        case 'P':
            return pawnRelatives;
        case 'N':
            return knightRelatives;
        case 'B':
            return bishopRelatives;
        case 'R':
            return rookRelatives;
        case 'Q':
            return queenRelatives;
        case 'K':
            return kingRelatives;
        default:
            console.log("ERROR: Piece not inputted")
    }
}

class Board {
    constructor(position) {
        this.board = position
        this.boardHistory = [structuredClone(position)]
        this.whitesTurn = 0
        this.whiteSWP = [
            [6, 0],
            [6, 1],
            [6, 2],
            [6, 3],
            [6, 4],
            [6, 5],
            [6, 6],
            [6, 7],
            [7, 0],
            [7, 1],
            [7, 2],
            [7, 3],
            [7, 4],
            [7, 5],
            [7, 6],
            [7, 7]] //all of the white squares with pieces on the first turn
        this.blackSWP = [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3],
            [0, 4],
            [0, 5],
            [0, 6],
            [0, 7],
            [1, 0],
            [1, 1],
            [1, 2],
            [1, 3],
            [1, 4],
            [1, 5],
            [1, 6],
            [1, 7]] //all of the black squares with pieces on the first turn
        this.movesTable = [
            [[0, 0],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 1],
            [[], [], [], [], [], [], [], [], [[2, 2]], [[2, 0]], [], [], [], [], [], []]],

            [[0, 2],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 3],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 4],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 5],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 6],
            [[], [], [], [], [], [], [], [], [[2, 7]], [[2, 5]], [], [], [], [], [], []]],

            [[0, 7],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[1, 0],
            [[], [], [], [], [], [], [[2, 0], [3, 0]], [], [], [], [], [], [], [], [], []]],

            [[1, 1],
            [[], [], [], [], [], [], [[2, 1], [3, 1]], [], [], [], [], [], [], [], [], []]],

            [[1, 2],
            [[], [], [], [], [], [], [[2, 2], [3, 2]], [], [], [], [], [], [], [], [], []]],

            [[1, 3],
            [[], [], [], [], [], [], [[2, 3], [3, 3]], [], [], [], [], [], [], [], [], []]],

            [[1, 4],
            [[], [], [], [], [], [], [[2, 4], [3, 4]], [], [], [], [], [], [], [], [], []]],

            [[1, 5],
            [[], [], [], [], [], [], [[2, 5], [3, 5]], [], [], [], [], [], [], [], [], []]],

            [[1, 6],
            [[], [], [], [], [], [], [[2, 6], [3, 6]], [], [], [], [], [], [], [], [], []]],

            [[1, 7],
            [[], [], [], [], [], [], [[2, 7], [3, 7]], [], [], [], [], [], [], [], [], []]],

            [[6, 0], //white pieces start here
            [[], [], [], [], [], [], [], [[5, 0], [4, 0]], [], [], [], [], [], [], [], []]],

            [[6, 1],
            [[], [], [], [], [], [], [], [[5, 1], [4, 1]], [], [], [], [], [], [], [], []]],

            [[6, 2],
            [[], [], [], [], [], [], [], [[5, 2], [4, 2]], [], [], [], [], [], [], [], []]],

            [[6, 3],
            [[], [], [], [], [], [], [], [[5, 3], [4, 3]], [], [], [], [], [], [], [], []]],

            [[6, 4],
            [[], [], [], [], [], [], [], [[5, 4], [4, 4]], [], [], [], [], [], [], [], []]],

            [[6, 5],
            [[], [], [], [], [], [], [], [[5, 5], [4, 5]], [], [], [], [], [], [], [], []]],

            [[6, 6],
            [[], [], [], [], [], [], [], [[5, 6], [4, 6]], [], [], [], [], [], [], [], []]],

            [[6, 7],
            [[], [], [], [], [], [], [], [[5, 7], [4, 7]], [], [], [], [], [], [], [], []]],

            [[7, 0],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 1],
            [[], [], [], [], [], [], [], [], [], [], [[5, 2]], [[5, 0]], [], [], [], []]],

            [[7, 2],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 3],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 4],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 5],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 6],
            [[], [], [], [], [], [], [], [], [], [], [[5, 7]], [[5, 5]], [], [], [], []]],

            [[7, 7],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]]
        ]
        this.noKingSafetyMovesTable = [
            [[0, 0],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 1],
            [[], [], [], [], [], [], [], [], [[2, 2]], [[2, 0]], [], [], [], [], [], []]],

            [[0, 2],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 3],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 4],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 5],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[0, 6],
            [[], [], [], [], [], [], [], [], [[2, 7]], [[2, 5]], [], [], [], [], [], []]],

            [[0, 7],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[1, 0],
            [[], [], [], [], [], [], [[2, 0], [3, 0]], [], [], [], [], [], [], [], [], []]],

            [[1, 1],
            [[], [], [], [], [], [], [[2, 1], [3, 1]], [], [], [], [], [], [], [], [], []]],

            [[1, 2],
            [[], [], [], [], [], [], [[2, 2], [3, 2]], [], [], [], [], [], [], [], [], []]],

            [[1, 3],
            [[], [], [], [], [], [], [[2, 3], [3, 3]], [], [], [], [], [], [], [], [], []]],

            [[1, 4],
            [[], [], [], [], [], [], [[2, 4], [3, 4]], [], [], [], [], [], [], [], [], []]],

            [[1, 5],
            [[], [], [], [], [], [], [[2, 5], [3, 5]], [], [], [], [], [], [], [], [], []]],

            [[1, 6],
            [[], [], [], [], [], [], [[2, 6], [3, 6]], [], [], [], [], [], [], [], [], []]],

            [[1, 7],
            [[], [], [], [], [], [], [[2, 7], [3, 7]], [], [], [], [], [], [], [], [], []]],

            [[6, 0], //white pieces start here
            [[], [], [], [], [], [], [], [[5, 0], [4, 0]], [], [], [], [], [], [], [], []]],

            [[6, 1],
            [[], [], [], [], [], [], [], [[5, 1], [4, 1]], [], [], [], [], [], [], [], []]],

            [[6, 2],
            [[], [], [], [], [], [], [], [[5, 2], [4, 2]], [], [], [], [], [], [], [], []]],

            [[6, 3],
            [[], [], [], [], [], [], [], [[5, 3], [4, 3]], [], [], [], [], [], [], [], []]],

            [[6, 4],
            [[], [], [], [], [], [], [], [[5, 4], [4, 4]], [], [], [], [], [], [], [], []]],

            [[6, 5],
            [[], [], [], [], [], [], [], [[5, 5], [4, 5]], [], [], [], [], [], [], [], []]],

            [[6, 6],
            [[], [], [], [], [], [], [], [[5, 6], [4, 6]], [], [], [], [], [], [], [], []]],

            [[6, 7],
            [[], [], [], [], [], [], [], [[5, 7], [4, 7]], [], [], [], [], [], [], [], []]],

            [[7, 0],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 1],
            [[], [], [], [], [], [], [], [], [], [], [[5, 2]], [[5, 0]], [], [], [], []]],

            [[7, 2],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 3],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 4],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 5],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]],

            [[7, 6],
            [[], [], [], [], [], [], [], [], [], [], [[5, 7]], [[5, 5]], [], [], [], []]],

            [[7, 7],
            [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []]]
        ]
        this.squareOfKings = [[7, 4], [0, 4]]
        this.potentialPassantTakers = []
        this.passantSquare = [-1, -1] //passant square out of bounds because there isn't one yet
        this.passantHappening = false
        this.WKMoved = false;
        this.BKMoved = false;
        this.WLRMoved = false;
        this.WRRMoved = false;
        this.BLRMoved = false;
        this.BRRMoved = false;
        this.boardOutcome = 0; //game is still running
        this.fiftyMoveTally = 0;

    }
    //method tries to find the piece on the starting square in the moves table
    //then if it finds it checks for piece on the square it wants to land on in the moves table 
    //then if it finds the square it wants to land on in the moves table sees if square it wants to move to has a piece on it
    //if it does have a piece on it remove that piece from the moves table and SWP array
    //then move the piece on the actual board, toggle the turns and find out what the next moves that are valid are
    move_piece(startingSquare, finishingSquare, promotion) {
        let pieceTableOfStartingSquare
        let finishingSquareValid = false
        for (const pieceTable of this.movesTable) { //iterate through the pieceTable list 
            //pieceTable[0] is piece
            if (pieceTable[0][BOARDROW] == startingSquare[BOARDROW] && pieceTable[0][BOARDCOLUMN] == startingSquare[BOARDCOLUMN]) { //if the start square is the piece selected 
                //THIS CONDITION IS ALREADY TESTED TO MAKE DOTS -- PERFORMANCE OPTIMISATION??
                pieceTableOfStartingSquare = pieceTable[1];
                break;
            }
        }

        for (const direction of pieceTableOfStartingSquare) {
            for (const squarePieceCouldBeDropped of direction) { //iterate through the end squares
                //if squareCouldBeDropped is the finishingSquare
                if (squarePieceCouldBeDropped[BOARDROW] == finishingSquare[BOARDROW] && squarePieceCouldBeDropped[BOARDCOLUMN] == finishingSquare[BOARDCOLUMN]) {
                    finishingSquareValid = true
                    break;
                }
            }
        }

        if (finishingSquareValid) {
            //if finishing square is equal to enpassant square and a pawn move the piece that moved 2 squares forward one square back to be taken
            if (this.passantHappening == true) {
                if (squares_are_equal(this.passantSquare, finishingSquare)) {
                    //move piece on row of starting square back to en passant square
                    this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]] = this.board[startingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]]
                    this.board[startingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]] = []
                }
            }

            if (promotion != 0) {
                this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]][1] = promotion
            }

            // if finshing square has a piece on it a capture happens so remove piece taken's move table, square and array
            if (this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]].length > 0) {
                let SWPArray
                this.fiftyMoveTally = -1
                this.boardHistory = []
                if (this.whitesTurn == 0) {
                    SWPArray = this.blackSWP
                }
                else {
                    SWPArray = this.whiteSWP
                }
                for (const pieceIndex in SWPArray) {
                    const piece = SWPArray[pieceIndex]
                    if (piece[BOARDROW] == finishingSquare[BOARDROW] && piece[BOARDCOLUMN] == finishingSquare[BOARDCOLUMN]) {
                        //removes taken piece from its swp array
                        SWPArray.splice(pieceIndex, 1)
                        break;
                    }
                }
                for (const pieceTableIndex in this.noKingSafetyMovesTable) {
                    const pieceTable = this.noKingSafetyMovesTable[pieceTableIndex]
                    if (pieceTable[0][BOARDROW] == finishingSquare[BOARDROW] && pieceTable[0][BOARDCOLUMN] == finishingSquare[BOARDCOLUMN]) {
                        //removes taken piece's move table
                        this.noKingSafetyMovesTable.splice(pieceTableIndex, 1)
                        break;
                    }
                }
            }

            let castling = false
            let rookStartingSquare = []
            let rookFinishingSquare = []
            //if it's a king being moved change the respective square of king
            if (this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]][1] == 'K') {
                if (this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]][0] == 'w') {
                    if (this.WKMoved == false) {
                        switch (finishingSquare[BOARDCOLUMN]) {
                            case 6:
                                castling = true
                                rookStartingSquare = [7, 7]
                                rookFinishingSquare = [7, 5]
                                break;
                            case 2:
                                castling = true
                                rookStartingSquare = [7, 0]
                                rookFinishingSquare = [7, 3]
                                break;
                        }
                    }
                    this.WKMoved = true
                    this.squareOfKings[0] = [finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN]]
                }
                else {
                    if (this.BKMoved == false) {
                        switch (finishingSquare[BOARDCOLUMN]) {
                            case 6:
                                castling = true
                                rookStartingSquare = [0, 7]
                                rookFinishingSquare = [0, 5]
                                break;
                            case 2:
                                castling = true
                                rookStartingSquare = [0, 0]
                                rookFinishingSquare = [0, 3]
                                break;
                        }
                    }
                    this.BKMoved = true
                    this.squareOfKings[1] = [finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN]]
                }
            }
            else if (this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]][1] == 'R') {
                switch (startingSquare[BOARDROW]) {
                    case 0: //black
                        switch (startingSquare[BOARDCOLUMN]) {
                            case 0: //left
                                this.BLRMoved = true
                                break;
                            case 7: //right
                                this.BRRMoved = true
                                break;
                        }
                        break;
                    case 7: //white
                        switch (startingSquare[BOARDCOLUMN]) {
                            case 0: //left
                                this.WLRMoved = true
                                break;
                            case 7: //right
                                this.WRRMoved = true
                                break;
                        }
                        break;
                }
            }
            else if (this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]][1] == 'P') {
                this.fiftyMoveTally = -1
                this.boardHistory = []
            }

            //move the piece on the board
            this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]] = this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]]
            this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]] = []

            //change the respective SWP table
            let SWPArray
            if (this.whitesTurn == 0) {
                SWPArray = this.whiteSWP
            }
            else {
                SWPArray = this.blackSWP
            }
            for (const pieceIndex in SWPArray) {
                const piece = SWPArray[pieceIndex]
                if (piece[BOARDROW] == startingSquare[BOARDROW] && piece[BOARDCOLUMN] == startingSquare[BOARDCOLUMN]) {
                    SWPArray[pieceIndex] = finishingSquare
                    break;
                }
            }

            this.update_moves_table(startingSquare, finishingSquare)

            if (castling == true) {
                this.board[rookFinishingSquare[BOARDROW]][rookFinishingSquare[BOARDCOLUMN]] = this.board[rookStartingSquare[BOARDROW]][rookStartingSquare[BOARDCOLUMN]]
                this.board[rookStartingSquare[BOARDROW]][rookStartingSquare[BOARDCOLUMN]] = []

                //change the respective SWP table
                let SWPArray
                if (this.whitesTurn == 0) {
                    SWPArray = this.whiteSWP
                }
                else {
                    SWPArray = this.blackSWP
                }
                for (const pieceIndex in SWPArray) {
                    const piece = SWPArray[pieceIndex]
                    if (piece[BOARDROW] == rookStartingSquare[BOARDROW] && piece[BOARDCOLUMN] == rookStartingSquare[BOARDCOLUMN]) {
                        SWPArray[pieceIndex] = rookFinishingSquare
                        break;
                    }
                }
                this.update_moves_table(rookStartingSquare, rookFinishingSquare)
            }

            this.movesTable = structuredClone(this.noKingSafetyMovesTable)
            for (const kingSquare of this.squareOfKings) {
                this.check_for_checks(kingSquare)
            }
            this.whitesTurn = 1 - this.whitesTurn
            if (this.boardOutcome == 0) {
                this.test_for_threefold();
                this.test_for_insufficent_material();
            }
            this.fiftyMoveTally++
            if (this.fiftyMoveTally >= 100 && this.boardOutcome == 0) {
                this.boardOutcome = 4
                return;
            }
        }
    }
    //method finds squares of pieces affected by piece getting put on the new square 
    //and adds the square affected and the direction its affected in to an array
    //then finds squares of pieces affected by piece getting removed from the old square
    //and adds them to the same array
    //then goes through the array of pieces affected, making a new continuation of its squares
    //then finds the square the moved piece started on in the moves table, and replaces the square 
    //with the square the moved piece landed on, and finds the new moves the piece can make.

    update_moves_table(startingSquare, finishingSquare) {
        let linesAffected = []
        //iterate through allRelatives 
        if (this.passantHappening == true) {
            if (this.potentialPassantTakers.length > 0) {
                for (const potentialPassantTaker of this.potentialPassantTakers)
                    if (this.board[potentialPassantTaker[0][BOARDROW]][potentialPassantTaker[0][BOARDCOLUMN]].length > 0)
                        linesAffected.push(potentialPassantTaker)
            }
            this.passantHappening = false
        }

        for (const branchIndex in allRelatives) {
            add_lines_affected_by_new_square(this.board, linesAffected, finishingSquare, branchIndex)
            add_lines_affected_by_old_square(this.board, linesAffected, startingSquare, branchIndex)

            //these are seperate loops because one could stop before the other
            //array is modified by reference so no return in function or declaration of variables

        }
        function add_lines_affected_by_new_square(objectBoard, linesAffected, finishingSquare, branchIndex) {
            const branch = allRelatives[branchIndex]
            for (const relativeSquare of branch) {
                //square to check = new square + allrelativesBranchMove
                let squareToChecksColumn = finishingSquare[BOARDCOLUMN] + relativeSquare[BOARDCOLUMN]
                let squareToChecksRow = finishingSquare[BOARDROW] + relativeSquare[BOARDROW]
                if (squareToChecksColumn >= 0 && squareToChecksColumn < BOARDSIZE && squareToChecksRow >= 0 && squareToChecksRow < BOARDSIZE) {
                    //if square to check has a piece on it
                    if (objectBoard[squareToChecksRow][squareToChecksColumn].length > 0) {
                        //add to pieces affected list and opposite direction of allrelativesbranch 
                        // CAN ADD FURTHER VALIDATION HERE BECAUSE A PAWN ISNT GOING TO TRAVEL LIKE A KNIGHT
                        linesAffected.push([[squareToChecksRow, squareToChecksColumn], oppositeDirectionIndex[branchIndex]])
                        //break out of branch because affected piece prevents any further affected pieces by moving
                        return;
                    }
                }
                else {
                    return;
                }
            }
        }
        function add_lines_affected_by_old_square(objectBoard, linesAffected, startingSquare, branchIndex) {
            const branch = allRelatives[branchIndex]
            for (const relativeSquare of branch) {
                //square to check = old square + allrelativesBranchMove
                let squareToChecksColumn = startingSquare[BOARDCOLUMN] + relativeSquare[BOARDCOLUMN]
                let squareToChecksRow = startingSquare[BOARDROW] + relativeSquare[BOARDROW]
                if (squareToChecksColumn >= 0 && squareToChecksColumn < BOARDSIZE && squareToChecksRow >= 0 && squareToChecksRow < BOARDSIZE) {
                    //if square to check has a piece on it
                    if (objectBoard[squareToChecksRow][squareToChecksColumn].length > 0) {
                        //could just try delete continutation of that piece's line using function like splice or pop

                        // CAN ADD FURTHER VALIDATION HERE BECAUSE A PAWN ISNT GOING TO TRAVEL LIKE A KNIGHT

                        linesAffected.push([[squareToChecksRow, squareToChecksColumn], oppositeDirectionIndex[branchIndex]])

                        //break out of branch because affected piece prevents any further affected pieces by moving
                        return;
                    }
                }
                else {
                    return;
                }
            }
        }
        //change the move array of the direction the piece is affected in
        for (const lineAffected of linesAffected) {
            const DIRECTION = 1
            const SQUAREFROM = 0
            for (let moves of this.noKingSafetyMovesTable) {
                if (moves[0][BOARDROW] == lineAffected[SQUAREFROM][BOARDROW] && moves[0][BOARDCOLUMN] == lineAffected[SQUAREFROM][BOARDCOLUMN]) {
                    let relativeLine = relative_moves_of_piece(this.board[moves[0][BOARDROW]][moves[0][BOARDCOLUMN]][1])[lineAffected[DIRECTION]]

                    moves[1][lineAffected[DIRECTION]] = this.make_new_move_line(lineAffected[SQUAREFROM], relativeLine, lineAffected[DIRECTION])
                    break;
                }
            }
        }

        //change the entire moveTable of the piece which was actually moved
        for (let moves of this.noKingSafetyMovesTable) {
            if (moves[0][BOARDROW] == startingSquare[BOARDROW] && moves[0][BOARDCOLUMN] == startingSquare[BOARDCOLUMN]) {
                moves[0] = finishingSquare
                let relativePieceMoves = relative_moves_of_piece(this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]][1])
                moves[1] = []
                for (let direction in relativePieceMoves) {
                    let relativeLine = relativePieceMoves[direction]
                    let linesInMoveTable = this.make_new_move_line(finishingSquare, relativeLine, direction)
                    moves[1].push(linesInMoveTable)
                }
                break;
            }
        }

        if (this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]][1] == 'P') {
            switch (startingSquare[BOARDROW]) {
                case 1:
                    if (finishingSquare[BOARDROW] == 3) {
                        this.passantHappening = true
                        this.passantSquare = [2, finishingSquare[BOARDCOLUMN]]
                        if (!this.square_out_of_bounds([finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] + 1])) {
                            if (squares_are_equal(this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN] + 1], ['w', 'P'])) {
                                for (let moveTableNum in this.noKingSafetyMovesTable) {
                                    if (squares_are_equal(this.noKingSafetyMovesTable[moveTableNum][0], [finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] + 1])) {
                                        this.noKingSafetyMovesTable[moveTableNum][1][3] = [this.passantSquare]
                                        this.potentialPassantTakers.push([[finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] + 1], 3])
                                        break
                                    }
                                }
                            }
                        }
                        if (!this.square_out_of_bounds([finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] - 1])) {
                            if (squares_are_equal(this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN] - 1], ['w', 'P'])) {
                                for (let moveTableNum in this.noKingSafetyMovesTable) {
                                    if (squares_are_equal(this.noKingSafetyMovesTable[moveTableNum][0], [finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] - 1])) {
                                        this.noKingSafetyMovesTable[moveTableNum][1][1] = [this.passantSquare]
                                        this.potentialPassantTakers.push([[finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] - 1], 1])
                                        break
                                    }
                                }
                            }
                        }
                    }
                    break;
                case 6:
                    if (finishingSquare[BOARDROW] == 4) {
                        this.passantHappening = true
                        this.passantSquare = [5, finishingSquare[BOARDCOLUMN]]
                        if (!this.square_out_of_bounds([finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] + 1])) {
                            if (squares_are_equal(this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN] + 1], ['b', 'P'])) {
                                for (let moveTableNum in this.noKingSafetyMovesTable) {
                                    if (squares_are_equal(this.noKingSafetyMovesTable[moveTableNum][0], [finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] + 1])) {
                                        this.noKingSafetyMovesTable[moveTableNum][1][2] = [this.passantSquare]
                                        this.potentialPassantTakers.push([[finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] + 1], 0])
                                        break
                                    }
                                }
                            }
                        }
                        if (!this.square_out_of_bounds([finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] - 1])) {
                            if (squares_are_equal(this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN] - 1], ['b', 'P'])) {
                                for (let moveTableNum in this.noKingSafetyMovesTable) {
                                    if (squares_are_equal(this.noKingSafetyMovesTable[moveTableNum][0], [finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] - 1])) {
                                        this.noKingSafetyMovesTable[moveTableNum][1][0] = [this.passantSquare]
                                        this.potentialPassantTakers.push([[finishingSquare[BOARDROW], finishingSquare[BOARDCOLUMN] - 1], 2])
                                        break
                                    }
                                }
                            }
                        }
                    }
                    break;
            }
        }
    }

    check_for_checks(kingSquare) {
        let potentialChecks = []
        let potentialPins = []
        let inCheck = false

        //find potential squares the king could be getting attacked by, or is causing a piece to be pinned
        this.find_potential_king_threats(kingSquare, potentialChecks, potentialPins)

        //finds if potential pin array is actually a pin by removing the pinned piece and moving the actual piece
        //that could pinning the piece to the king
        let pinsArray = this.find_actual_pins(potentialPins)

        //if a piece is pinned removes the directions it can move in other than the ones it is pinned in
        this.lock_pinned_piece_to_direction(pinsArray)

        //finds if the potential check is actually a check by moving the actual piece itself
        let checkBlockArray = this.find_actual_checks(potentialChecks)

        if (checkBlockArray.length == 1) {
            inCheck = true
            //only pieces in check line between piece checking and king allowed
            for (let moveTableNum in this.movesTable) {
                for (let directionNum in this.movesTable[moveTableNum][1]) {
                    for (let moveNum in this.movesTable[moveTableNum][1][directionNum]) {
                        const move = this.movesTable[moveTableNum][1][directionNum][moveNum]
                        for (const checkSquare of checkBlockArray[0]) {
                            if (move[BOARDROW] == checkSquare[BOARDROW] && move[BOARDCOLUMN] == checkSquare[BOARDCOLUMN]) {
                                this.movesTable[moveTableNum][1][directionNum][moveNum] = move
                                break;
                            }
                            else {
                                this.movesTable[moveTableNum][1][directionNum][moveNum] = []
                            }
                        }
                    }
                }
            }
        }
        else if (checkBlockArray.length > 1) {
            for (let moveTableNum in this.movesTable) {
                for (let directionNum in this.movesTable[moveTableNum][1]) {
                    for (let moveNum in this.movesTable[moveTableNum][1][directionNum]) {
                        this.movesTable[moveTableNum][1][directionNum][moveNum] = []
                    }
                }
            }
        }

        for (const moveTableNum in this.noKingSafetyMovesTable) {
            const moveTable = this.noKingSafetyMovesTable[moveTableNum]
            if (moveTable[0][BOARDROW] == kingSquare[BOARDROW] && moveTable[0][BOARDCOLUMN] == kingSquare[BOARDCOLUMN]) {
                for (const directionNum in moveTable[1]) {
                    const direction = moveTable[1][directionNum]
                    //IF KING IS NOT IN CHECK, CHANGE THIS, ITERATE THROUGH ALL MOVES OF KING
                    let dontAllowFurtherInDirection = false
                    if (direction.length != 0) { //this needs to be checked because directions are not contiguous or all have values in
                        for (const moveNum in direction) {
                            let kingMoveSquareToTest = direction[moveNum]
                            const tempPiece = this.board[kingMoveSquareToTest[BOARDROW]][kingMoveSquareToTest[BOARDCOLUMN]]
                            this.board[kingMoveSquareToTest[BOARDROW]][kingMoveSquareToTest[BOARDCOLUMN]] = this.board[kingSquare[BOARDROW]][kingSquare[BOARDCOLUMN]]
                            const tempKing = this.board[kingSquare[BOARDROW]][kingSquare[BOARDCOLUMN]]
                            this.board[kingSquare[BOARDROW]][kingSquare[BOARDCOLUMN]] = []
                            let potentialChecks = []
                            this.find_potential_king_threats(kingMoveSquareToTest, potentialChecks, [])
                            let checksArray = this.find_actual_checks(potentialChecks)

                            this.board[kingMoveSquareToTest[BOARDROW]][kingMoveSquareToTest[BOARDCOLUMN]] = tempPiece
                            this.board[kingSquare[BOARDROW]][kingSquare[BOARDCOLUMN]] = tempKing
                            if (checksArray.length == 0 && dontAllowFurtherInDirection == false) {
                                //add piece to movesTable
                                if (!(inCheck == true && moveNum == 1))
                                    this.movesTable[moveTableNum][1][directionNum][moveNum] = kingMoveSquareToTest
                            }
                            else {
                                this.movesTable[moveTableNum][1][directionNum][moveNum] = []
                                dontAllowFurtherInDirection = true;
                            }
                        }
                    }
                }
                break;
            }
        }

        let noMovesLeft = true
        let SWPArray
        if (this.whitesTurn == 1) {
            SWPArray = this.whiteSWP
        }
        else {
            SWPArray = this.blackSWP
        }
        for (const moveTable of this.movesTable) {
            if (noMovesLeft == false) break;
            for (const squareWithPiece of SWPArray) {
                if (noMovesLeft == false) break;
                if (squares_are_equal(squareWithPiece, moveTable[0])) {
                    for (const direction of moveTable[1]) {
                        if (noMovesLeft == false) break;
                        for (const move of direction) {
                            if (move.length > 0) {
                                noMovesLeft = false
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }
        if (noMovesLeft) {
            if (inCheck) {
                if (this.whitesTurn) {
                    console.log("white loses, checkmate")
                    this.boardOutcome = 1
                }
                else {
                    console.log("black loses, checkmate")
                    this.boardOutcome = 2
                }
            }
            else {
                if (this.boardOutcome == 0) {
                    this.boardOutcome = 3
                }
            }
        }
    }

    make_new_move_line(startingSquare, relativeLine, direction) {
        let moveArray = []
        let pieceColour = this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]][0]
        for (const relativeMoveNum in relativeLine) {
            const relativeMove = relativeLine[relativeMoveNum]
            let finishingSquare = add_squares(startingSquare, relativeMove)
            //this gets tested after the range check to prevent array range errors
            if (this.square_out_of_bounds(finishingSquare)) {
                break;
            }
            //all statements below act like else if due to returns, but else is removed so variables can be made in between
            if (this.move_is_invalid(startingSquare, finishingSquare, direction, relativeMoveNum, relativeMove)) {
                break;
            }
            const pieceDoesntNeedStoppingTrue = 1
            if (pieceDoesntNeedStoppingTrue) {
                moveArray.push(finishingSquare);
                if (this.line_should_end(startingSquare, finishingSquare)) {
                    break;
                }
            }
        }
        return moveArray
    }
    find_potential_king_threats(kingSquare, potentialChecks, potentialPins) {
        let colour = this.board[kingSquare[BOARDROW]][kingSquare[BOARDCOLUMN]][0]
        let oppositeColour
        if (colour == "w") {
            oppositeColour = "b"
        }
        else if (colour == "b") {
            oppositeColour = "w"
        }
        for (const directionNum in allRelatives) {
            let potentialPinSquare = []
            let potentialPinner = []
            let potentialCheck = []
            let directionOfAttack
            const direction = allRelatives[directionNum]
            for (const relativeMove of direction) {
                const checkRow = kingSquare[BOARDROW] + relativeMove[BOARDROW]
                const checkColumn = kingSquare[BOARDCOLUMN] + relativeMove[BOARDCOLUMN]
                if (checkRow >= 0 && checkRow < BOARDSIZE && checkColumn >= 0 && checkColumn < BOARDSIZE) {
                    if (this.board[checkRow][checkColumn][0] == colour) {
                        if (potentialPinSquare.length < 1) {
                            potentialPinSquare = [checkRow, checkColumn]
                        }
                        else {
                            break;
                        }
                    }
                    else if (this.board[checkRow][checkColumn][0] == oppositeColour) {
                        if (potentialPinSquare.length < 1) {
                            potentialCheck = [checkRow, checkColumn]
                            directionOfAttack = oppositeDirectionIndex[directionNum]
                            break;
                        }
                        else {
                            potentialPinner = [checkRow, checkColumn]
                            directionOfAttack = oppositeDirectionIndex[directionNum]
                            break;
                        }
                    }
                }
            }
            if (potentialCheck.length > 0) {
                potentialChecks.push([potentialCheck, directionOfAttack])
            }
            else if (potentialPinner.length > 0) {
                potentialPins.push([potentialPinSquare, potentialPinner, directionOfAttack])
            }
        }
    }
    find_actual_checks(potentialChecks) {
        let checksArray = []
        for (const potentialCheck of potentialChecks) {
            const pieceSquare = potentialCheck[0]
            const direction = potentialCheck[1]
            let blockArray = [pieceSquare]
            //get direction of piece to iterate through
            let relativePieceMoves = relative_moves_of_piece(this.board[pieceSquare[BOARDROW]][pieceSquare[BOARDCOLUMN]][1])[direction]
            for (const relativeMoveNum in relativePieceMoves) {
                const relativeMove = relativePieceMoves[relativeMoveNum]
                const checkSquare = add_squares(pieceSquare, relativeMove)
                if (this.square_out_of_bounds(checkSquare)) {
                    break;
                }
                if (this.move_is_invalid(pieceSquare, checkSquare, direction, relativeMoveNum, relativeMove)) {
                    break;
                }
                if (this.board[checkSquare[BOARDROW]][checkSquare[BOARDCOLUMN]][1] == "K") {
                    checksArray.push(blockArray)
                    break;
                }
                if (this.line_should_end(pieceSquare, checkSquare)) {
                    break;
                }
                blockArray.push(checkSquare)
            }
        }
        return checksArray;
    }
    find_actual_pins(potentialPins) {
        let pinsArray = []
        for (const potentialPin of potentialPins) {
            const pinnedSquare = potentialPin[0]
            const pieceSquare = potentialPin[1]
            const direction = potentialPin[2]
            //get direction of piece to iterate through
            const pinnedPiece = this.board[pinnedSquare[BOARDROW]][pinnedSquare[BOARDCOLUMN]]
            this.board[pinnedSquare[BOARDROW]][pinnedSquare[BOARDCOLUMN]] = []
            let relativePieceMoves = relative_moves_of_piece(this.board[pieceSquare[BOARDROW]][pieceSquare[BOARDCOLUMN]][1])[direction]
            for (const relativeMoveNum in relativePieceMoves) {
                const relativeMove = relativePieceMoves[relativeMoveNum]
                const checkSquare = add_squares(pieceSquare, relativeMove)
                if (this.square_out_of_bounds(checkSquare)) {
                    break;
                }
                if (this.move_is_invalid(pieceSquare, checkSquare, direction, relativeMoveNum, relativeMove)) {
                    break;
                }
                if (this.board[checkSquare[BOARDROW]][checkSquare[BOARDCOLUMN]][1] == "K") {
                    pinsArray.push([pinnedSquare, direction])
                    break;
                }
                if (this.line_should_end(pieceSquare, checkSquare)) {
                    break;
                }
            }
            this.board[pinnedSquare[BOARDROW]][pinnedSquare[BOARDCOLUMN]] = pinnedPiece
        }
        return pinsArray
    }
    lock_pinned_piece_to_direction(pinsArray) {
        for (const moveTableNum in this.movesTable) {
            const moveTable = this.movesTable[moveTableNum]
            let correctMoveTable = false
            let pinDirection
            const piece = moveTable[0]
            const directions = moveTable[1]
            for (const pin of pinsArray) {
                const pinnedPiece = pin[0]
                if (pinnedPiece[BOARDROW] == piece[BOARDROW] && pinnedPiece[BOARDCOLUMN] == piece[BOARDCOLUMN]) {
                    pinDirection = pin[1]
                    correctMoveTable = true
                    break;
                }
            }
            if (correctMoveTable) {
                for (const directionNum in directions) {
                    if (directions[directionNum].length > 0) {
                        if (!(directionNum == pinDirection || oppositeDirectionIndex[directionNum] == pinDirection)) {
                            this.movesTable[moveTableNum][1][directionNum] = []
                        }
                    }
                }
            }
        }
    }
    square_out_of_bounds(finishingSquare) {
        return (finishingSquare[BOARDCOLUMN] < 0 || finishingSquare[BOARDCOLUMN] >= BOARDSIZE ||
            finishingSquare[BOARDROW] < 0 || finishingSquare[BOARDROW] >= BOARDSIZE)
    }
    move_is_invalid(startingSquare, finishingSquare, direction, moveNum, relativeMove) {
        const startingPiece = this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]]
        const finishingPiece = this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]]
        const COLOUR = 0
        const TYPE = 1
        let colour = this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]][0]
        let oppositeColour
        if (colour == "w") {
            oppositeColour = "b"
        }
        else if (colour == "b") {
            oppositeColour = "w"
        }
        return (
            finishingPiece[COLOUR] == startingPiece[COLOUR]//square piece is going to has the same colour as it

            || startingPiece[TYPE] == 'P' && ((startingPiece[COLOUR] == "w" && relativeMove[BOARDROW] > 0 //piece is a pawn and
                || startingPiece[COLOUR] == "b" && relativeMove[BOARDROW] < 0) //pawn would be moving in the wrong direction
                || (direction == 6 || direction == 7) && moveNum == 1 && !(startingSquare[BOARDROW] == 1 || startingSquare[BOARDROW] == 6)
                || (direction < 4) === (startingPiece[COLOUR] != oppositeColour)) //pawn moving diagonally and square its moving to isnt opposite or pawn moving straight and square its moving to is opposite colour

            || startingPiece[TYPE] == 'K' && moveNum == 1 && (direction == 4 && (startingPiece[COLOUR] == "w" && this.WRRMoved//if king trying to go two squares 
                || startingPiece[COLOUR] == "b" && this.BRRMoved)  //in a direction 
                || direction == 5 && (startingPiece[COLOUR] == "w" && this.WLRMoved
                    || startingPiece[COLOUR] == "b" && this.BLRMoved)
                || startingPiece[COLOUR] == "w" && this.WKMoved
                || startingPiece[COLOUR] == "b" && this.BKMoved)
        )
    }
    line_should_end(startingSquare, finishingSquare) {
        const startingPiece = this.board[startingSquare[BOARDROW]][startingSquare[BOARDCOLUMN]]
        let colour = this.board[finishingSquare[BOARDROW]][finishingSquare[BOARDCOLUMN]][0]
        let oppositeColour
        if (colour == "w") {
            oppositeColour = "b"
        }
        else if (colour == "b") {
            oppositeColour = "w"
        }
        return startingPiece[0] == oppositeColour
    }
    test_for_threefold() {
        let threefoldTally = 0
        for (let boardH of this.boardHistory) {
            let matchTrue = true
            for (let row = 0; row < BOARDSIZE; row++) {
                for (let column = 0; column < BOARDSIZE; column++) {
                    if (!squares_are_equal(this.board[row][column], boardH[row][column])) {
                        matchTrue = false
                        break;
                    }
                }
                if (matchTrue == false) break;
            }
            if (matchTrue == true) {
                threefoldTally++
            }
            if (threefoldTally >= 2) {
                this.boardOutcome = 5
                return;
            }
        }
        this.boardHistory.push(structuredClone(this.board))
    }
    test_for_insufficent_material() {
        if (this.whiteSWP.length + this.blackSWP.length <= 4) {
            let whiteKnightTally = 0
            let whiteBishopTally = 0
            let blackKnightTally = 0
            let blackBishopTally = 0
            let whiteBishopSquareColour = []
            let blackBishopSquareColour = []
            for (const whiteSquare of this.whiteSWP) {
                switch (this.board[whiteSquare[BOARDROW]][whiteSquare[BOARDCOLUMN]][1]) {
                    case 'Q':
                    case 'R':
                    case 'P':
                        return;
                    case 'B':
                        whiteBishopTally++
                        whiteBishopSquareColour = whiteSquare[BOARDROW] + whiteSquare[BOARDCOLUMN]
                        break;
                    case 'N':
                        whiteKnightTally++
                        break;
                }
            }
            for (const blackSquare of this.blackSWP) {
                switch (this.board[blackSquare[BOARDROW]][blackSquare[BOARDCOLUMN]][1]) {
                    case 'Q':
                    case 'R':
                    case 'P':
                        return;
                    case 'B':
                        blackBishopTally++
                        blackBishopSquareColour = blackSquare[BOARDROW] + blackSquare[BOARDCOLUMN]
                        break;
                    case 'N':
                        blackKnightTally++
                        break;
                }
            }
            const twoKings = (whiteBishopTally + whiteKnightTally + blackBishopTally + blackKnightTally) == 0
            const twoKingsOneBishop = (whiteKnightTally + blackKnightTally) == 0 && (whiteBishopTally == 1 ^ blackBishopTally == 1)
            const twoKingsOneKnight = (whiteBishopTally + blackBishopTally) == 0 && (whiteKnightTally == 1 ^ blackKnightTally == 1)
            const twoKingsTwoSameColourKnights = (whiteBishopTally + blackBishopTally) == 0 && (whiteKnightTally == 2 && blackKnightTally == 0 || blackKnightTally == 2 && whiteKnightTally == 0)
            const twoKingsTwoBishops = whiteKnightTally == 0 && blackKnightTally == 0 && whiteBishopTally == 1 && blackBishopTally == 1
            const bishopsDifferentColour = (whiteBishopSquareColour % 2 == 0 ^ blackBishopSquareColour % 2 == 0)
            if (twoKings || twoKingsOneBishop || twoKingsOneKnight || twoKingsTwoSameColourKnights || twoKingsTwoBishops) {
                if (twoKingsTwoBishops && bishopsDifferentColour) {
                    return;
                }
                this.boardOutcome = 6
            }
        }
    }
}

function add_squares(square1, square2) {
    const returnSquareRow = square1[BOARDROW] + square2[BOARDROW]
    const returnSquareColumn = square1[BOARDCOLUMN] + square2[BOARDCOLUMN]
    return [returnSquareRow, returnSquareColumn]
}
function squares_are_equal(square1, square2) {
    return (square1[BOARDROW] == square2[BOARDROW] && square1[BOARDCOLUMN] == square2[BOARDCOLUMN])
}

function square_out_of_bounds(finishingSquare) {
    return (finishingSquare[BOARDCOLUMN] < 0 || finishingSquare[BOARDCOLUMN] >= BOARDSIZE ||
        finishingSquare[BOARDROW] < 0 || finishingSquare[BOARDROW] >= BOARDSIZE)
}