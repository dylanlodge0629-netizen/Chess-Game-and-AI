const BOARDSIZE = 8
const SQSIZE = 100
const XOFFSET = 30
const YOFFSET = 30
const BOARDCOLUMN = 1
const BOARDROW = 0
let mainGameBoard
let askPromotion = false;
let pieceSelected = []
let pieceDropped = []
let pieceDragged = false
let homeScreen = true
let singlePlayerGame = false
let multiPlayerGame = false
let myMPColour
let whitesTimeLeft
let blacksTimeLeft
let computerGame = false
let singlePlayerButton
let multiPlayerButton
let computerGameButton
let newGameButton
let resignButton
let socket

async function setup() {
    let cnv = createCanvas(windowWidth, windowHeight)
    cnv.parent("board")
    go_to_home_screen()
    chessSpriteSheet = await loadImage("chess_pieces_spritesheet.png")
    textSize(SQSIZE)
    textAlign(LEFT, TOP)
    //initGame()
}

function go_to_home_screen() {
    homeScreen = true
    singlePlayerGame = false
    computerGame = false
    singlePlayerButton = createButton("Singleplayer Game")
    singlePlayerButton.position(windowWidth / 2 - 78, windowHeight / 2 - 50)
    singlePlayerButton.mousePressed(startSinglePlayerGame)
    multiPlayerButton = createButton("Multiplayer Game")
    multiPlayerButton.position(windowWidth / 2 - 75, windowHeight / 2)
    multiPlayerButton.mousePressed(startMultiPlayerGame)
    computerGameButton = createButton("Play vs Computer")
    computerGameButton.position(windowWidth / 2 - 75, windowHeight / 2 + 50)
    computerGameButton.mousePressed(startComputerGame)
    if (newGameButton) {
        newGameButton.hide()
    }
    if (resignButton) {
        resignButton.hide()
    }
    if (multiPlayerGame) {
        socket.disconnect()
    }
    multiPlayerGame = false
}

function startSinglePlayerGame() {
    singlePlayerGame = true
    initGame()
}

function startMultiPlayerGame() {
    multiPlayerGame = true
    socket = io()
    socket.on("colourAssign", function (colour) {
        myMPColour = colour;
    })
    socket.on("makeMove", function (move){
        console.log("recieved move command:", move)
        mainGameBoard.move_piece(move[0], move[1], move[2])
    })
    socket.on("moveInvalid", function(){
        console.log("An error has occured, as this move has been seen as invalid by the server")
    })
    socket.on("opponentResign", function () {
        if (myMPColour == 0){
            mainGameBoard.boardOutcome = 7
        }
        else {
            mainGameBoard.boardOutcome = 8
        }
    })
    socket.on("timersUpdate", function (d) {
        let wseconds = (String(Math.floor((d[0] % 60) / 10)) + String((d[0] % 60) % 10))
        let wminutes = Math.floor(d[0] / 60)
        whitesTimeLeft = (wminutes + ":" + wseconds)
        let seconds = (String(Math.floor((d[1] % 60) / 10)) + String((d[1] % 60) % 10))
        let minutes = Math.floor(d[1] / 60)
        blacksTimeLeft = (minutes + ":" + seconds)
    })
    socket.on("whiteTimerLoss", function () {
        mainGameBoard.boardOutcome = 10
    })
    socket.on("blackTimerLoss", function () {
        mainGameBoard.boardOutcome = 9
    })
    initGame()
}

function startComputerGame() {
    computerGame = true
    initGame()
}

function initGame() {
    homeScreen = false
    singlePlayerButton.remove()
    multiPlayerButton.remove()
    computerGameButton.remove()
    newGameButton = createButton("Home Screen")
    newGameButton.mousePressed(go_to_home_screen)
    resignButton = createButton("Resign")
    resignButton.mousePressed(resignPlayer)
    let board = [
        [['b', 'R'], ['b', 'N'], ['b', 'B'], ['b', 'Q'], ['b', 'K'], ['b', 'B'], ['b', 'N'], ['b', 'R']],
        [['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P'], ['b', 'P']],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], []],
        [['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P'], ['w', 'P']],
        [['w', 'R'], ['w', 'N'], ['w', 'B'], ['w', 'Q'], ['w', 'K'], ['w', 'B'], ['w', 'N'], ['w', 'R']],
    ] //first position of the game
    mainGameBoard = new Board(board) //makes the main board class
}

function resignPlayer() {
    if (mainGameBoard.whitesTurn == 1 && singlePlayerGame == true) {
        mainGameBoard.boardOutcome = 7
    }
    else {
        mainGameBoard.boardOutcome = 8
    }
    if (multiPlayerGame){
        socket.disconnect()
    }
}

function draw() {
    background('white');
    if (homeScreen == false) {

        draw_checkered_pattern();

        draw_pieces_options_and_selected_square();

        if (askPromotion == true) {
            let colourOffsetDown = 0
            if (mainGameBoard.whitesTurn == 1 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 1) {
                colourOffsetDown = 169
            }
            fill(0, 0, 0, 128)
            rect(XOFFSET + 0 * SQSIZE, YOFFSET + 3 * SQSIZE, 8 * SQSIZE, 2 * SQSIZE)
            tint(255, 128)
            image(chessSpriteSheet, XOFFSET + 0 * SQSIZE, YOFFSET + 3 * SQSIZE, SQSIZE * 8, SQSIZE * 2, (1 * 164) - 16, colourOffsetDown, 164 * 4, 136)
            noTint()
        }

        if (mainGameBoard.boardOutcome != 0) {
            fill(0, 0, 0, 128)
            rect(XOFFSET + 2.5 * SQSIZE, YOFFSET + 3 * SQSIZE, 3 * SQSIZE, 2 * SQSIZE)
            let winner = "Winner Wins!"
            let reason = "because something happened"
            switch (mainGameBoard.boardOutcome) {
                case 1:
                    winner = "Black Wins!"
                    reason = "by checkmate"
                    break;
                case 2:
                    winner = "White Wins!"
                    reason = "by checkmate"
                    break;
                case 3:
                    winner = "Draw"
                    reason = "by stalemate"
                    break;
                case 4:
                    winner = "Draw"
                    reason = "by 50 move rule"
                    break;
                case 5:
                    winner = "Draw"
                    reason = "by threefold repetition"
                    break;
                case 6:
                    winner = "Draw"
                    reason = "by insufficient material"
                    break;
                case 7:
                    winner = "White wins!"
                    reason = "by resignation"
                    break;
                case 8:
                    winner = "Black wins!"
                    reason = "by resignation"
                    break;
                case 9:
                    winner = "White wins!"
                    reason = "on time"
                    break;
                case 10:
                    winner = "Black wins!"
                    reason = "on time"
                    break;
            }
            fill(255)
            textSize(50)
            text(winner, XOFFSET + 3 * SQSIZE, YOFFSET + 3 * SQSIZE)
            textSize(25)
            text(reason, XOFFSET + 2.5 * SQSIZE, YOFFSET + 3.5 * SQSIZE, 3 * SQSIZE)
        }

        if (multiPlayerGame == true){
            textSize(100)
            if (myMPColour == 0){
                if (mainGameBoard.whitesTurn == 0){
                    fill(0x8E, 0xAA, 0xDB)
                }
                else {
                    fill(0)
                }
                text(whitesTimeLeft, BOARDSIZE * SQSIZE + XOFFSET * 2, BOARDSIZE * SQSIZE - YOFFSET)
                if (mainGameBoard.whitesTurn == 1) {
                    fill(0x8E, 0xAA, 0xDB)
                }
                else {
                    fill(0)
                }
                text(blacksTimeLeft, BOARDSIZE * SQSIZE + XOFFSET * 2, YOFFSET)
            }
            else {
                if (mainGameBoard.whitesTurn == 0) {
                    fill(0x8E, 0xAA, 0xDB)
                }
                else {
                    fill(0)
                }
                text(whitesTimeLeft, BOARDSIZE * SQSIZE + XOFFSET * 2, YOFFSET)
                if (mainGameBoard.whitesTurn == 1) {
                    fill(0x8E, 0xAA, 0xDB)
                }
                else {
                    fill(0)
                }
                text(blacksTimeLeft, BOARDSIZE * SQSIZE + XOFFSET * 2, BOARDSIZE * SQSIZE - YOFFSET)
            }
        }
    }
}

function mousePressed() {

    if (homeScreen == false) {//when the mouse is pressed select the square of the board if its on a square with a piece
        let tempBoardX = floor((mouseX - XOFFSET) / SQSIZE)
        let tempBoardY = floor((mouseY - YOFFSET) / SQSIZE)
        if (askPromotion == false && mainGameBoard.boardOutcome == 0) {
            if (mainGameBoard.whitesTurn == 1 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 1) {
                tempBoardX = 7 - tempBoardX
                tempBoardY = 7 - tempBoardY
            }
            if (tempBoardY >= 0 && tempBoardY < BOARDSIZE && tempBoardX >= 0 && tempBoardX < BOARDSIZE) {
                let squaresToCheck
                if (mainGameBoard.whitesTurn == 0 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 0) {
                    squaresToCheck = mainGameBoard.whiteSWP
                }
                else {
                    squaresToCheck = mainGameBoard.blackSWP
                }
                for (squareToCheck of squaresToCheck) {
                    if (squareToCheck[BOARDROW] == tempBoardY && squareToCheck[BOARDCOLUMN] == tempBoardX && (multiPlayerGame == false || mainGameBoard.whitesTurn == myMPColour)) {
                        pieceSelected = [tempBoardY, tempBoardX]
                        pieceDragged = true
                    }
                    // else if boardX boardY are already selected thats the square to move the pieces to
                }
            }
            else {
                pieceSelected = []
            }
        }
    }
}

function mouseReleased() {
    if (homeScreen == false) {
        pieceDragged = false
        let tempBoardX = floor((mouseX - XOFFSET) / SQSIZE)
        let tempBoardY = floor((mouseY - YOFFSET) / SQSIZE)
        if (mainGameBoard.whitesTurn == 1 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 1) {
            tempBoardX = 7 - tempBoardX
            tempBoardY = 7 - tempBoardY
        }
        //if a piece is selected and the square the mouse is released on isn't outside of the board or the same as the selected one 
        if (askPromotion == false && mainGameBoard.boardOutcome == 0) {
            if (tempBoardY >= 0 && tempBoardY < BOARDSIZE && tempBoardX >= 0 && tempBoardX < BOARDSIZE && pieceSelected.length > 0 && !(tempBoardY == pieceSelected[BOARDROW] && tempBoardX == pieceSelected[BOARDCOLUMN])) {

                pieceDropped = [tempBoardY, tempBoardX]
                if (!(mainGameBoard.board[pieceSelected[BOARDROW]][pieceSelected[BOARDCOLUMN]][1] == 'P' && (tempBoardY == 0 || tempBoardY == 7))) {
                    mainGameBoard.move_piece(pieceSelected, pieceDropped, 0)
                    if (multiPlayerGame){
                        socket.emit("makeMove", [pieceSelected, pieceDropped, 0])
                    }
                    pieceSelected = []
                }
                else {
                    askPromotion = true;
                }
            }
        }
        else {
            if (tempBoardY == 3 || tempBoardY == 4) {
                switch (tempBoardX) {
                    case 0: case 1:
                        if (mainGameBoard.whitesTurn == 0 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 0) {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'Q')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'Q'])
                            }
                        }
                        else {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'R')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'R'])
                            }
                        }
                        askPromotion = false
                        pieceSelected = []
                        break;
                    case 2: case 3:
                        if (mainGameBoard.whitesTurn == 0 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 0) {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'B')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'B'])
                            }
                        }
                        else {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'N')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'N'])
                            }
                        }
                        askPromotion = false
                        pieceSelected = []
                        break;
                    case 4: case 5:
                        if (mainGameBoard.whitesTurn == 0 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 0) {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'N')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'N'])
                            }
                        }
                        else {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'B')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'B'])
                            }
                        }
                        askPromotion = false
                        pieceSelected = []
                        break;
                    case 6: case 7:
                        if (mainGameBoard.whitesTurn == 0 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 0) {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'R')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'R'])
                            }
                        }
                        else {
                            mainGameBoard.move_piece(pieceSelected, pieceDropped, 'Q')
                            if (multiPlayerGame) {
                                socket.emit("makeMove", [pieceSelected, pieceDropped, 'Q'])
                            }
                        }
                        askPromotion = false
                        pieceSelected = []
                        break;
                }
            }
        }
    }
}

function draw_checkered_pattern() {
    for (let row = 0; row < BOARDSIZE; row++) {
        for (let column = 0; column < BOARDSIZE; column++) {
            if ((row + column) % 2 == 0) {
                fill(0x8E, 0xAA, 0xDB)
                strokeWeight(0)
                rect(XOFFSET + column * SQSIZE, YOFFSET + row * SQSIZE, SQSIZE, SQSIZE)
            }
        }
    }
}

function draw_pieces_options_and_selected_square() {
    let draggedColourOffset;
    let draggedPieceOffset;
    let squareBeingDragged = false;
    let moveSquaresOfSelectedPiece = [];
    for (let row = 0; row < BOARDSIZE; row++) {
        for (let column = 0; column < BOARDSIZE; column++) {
            //if a piece is selected and the selected square matches the row and column being iterated through
            //draggedData = handleSquareLogic(row, column, draggedData, moveSquaresOfSelectedPiece)
            let pieceSelectedTrue = false
            if (pieceSelected.length > 0 && pieceSelected[BOARDROW] == row && pieceSelected[BOARDCOLUMN] == column) {
                pieceSelectedTrue = true
                stroke('red')
                strokeWeight(3)
                //draw a red rectangle
                if (mainGameBoard.whitesTurn == 0 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 0) {
                    rect(XOFFSET + pieceSelected[BOARDCOLUMN] * SQSIZE, YOFFSET + pieceSelected[BOARDROW] * SQSIZE, SQSIZE, SQSIZE)
                }
                else {
                    rect(XOFFSET + (7 - pieceSelected[BOARDCOLUMN]) * SQSIZE, YOFFSET + (7 - pieceSelected[BOARDROW]) * SQSIZE, SQSIZE, SQSIZE)
                }
            }

            //gets the square data from the board
            let square = mainGameBoard.board[row][column]
            //if the square has a piece on it
            if (square.length > 0) {
                let colourOffsetDown = 0
                let pieceOfsettAcross = 0
                if (square[0] == 'b') {
                    colourOffsetDown = 169
                }
                switch (square[1]) {
                    case 'K':
                        pieceOfsettAcross = 0
                        break;
                    case 'Q':
                        pieceOfsettAcross = 1
                        break;
                    case 'B':
                        pieceOfsettAcross = 2
                        break;
                    case 'N':
                        pieceOfsettAcross = 3
                        break;
                    case 'R':
                        pieceOfsettAcross = 4
                        break;
                    case 'P':
                        pieceOfsettAcross = 5
                        break;
                }
                //if the piece isnt selected or being dragged
                if (!pieceSelectedTrue || !pieceDragged) {
                    //draw the piece on the board
                    if (mainGameBoard.whitesTurn == 0 && singlePlayerGame == true || multiPlayerGame == true && myMPColour == 0) {
                        image(chessSpriteSheet, XOFFSET + column * SQSIZE, YOFFSET + row * SQSIZE, SQSIZE, SQSIZE, (pieceOfsettAcross * 169) - 16, colourOffsetDown, 169, 136)
                    }
                    else {
                        image(chessSpriteSheet, XOFFSET + (7 - column) * SQSIZE, YOFFSET + (7 - row) * SQSIZE, SQSIZE, SQSIZE, (pieceOfsettAcross * 169) - 16, colourOffsetDown, 169, 136)
                    }
                }
                else { //if the piece is selected and being dragged
                    squareBeingDragged = true
                    //remember piece being dragged
                    draggedPieceOffset = pieceOfsettAcross;
                    draggedColourOffset = colourOffsetDown;
                }
                //[[0,1],    piece = moveTable[pieceIndex][0]
                //[[],[],[],[],[],[],[],[],[[2,2]],[[2,0]],[],[],[],[],[],[]]] moves = moveTable[pieceIndex][1]
                //line = moves[lineIndex][line]
                //square = line[squareIndex]
                if (pieceSelectedTrue) { //if this iteraton is the square of a selected piece
                    for (pieceTable of mainGameBoard.movesTable) { //iterate through the moves list
                        const squarePieceOn = pieceTable[0]
                        const squaresPieceGoingTo = pieceTable[1]
                        if (squarePieceOn[BOARDROW] == pieceSelected[BOARDROW] && squarePieceOn[BOARDCOLUMN] == pieceSelected[BOARDCOLUMN]) { //if the start square is the piece selected
                            for (moves of squaresPieceGoingTo) {
                                //store moves[1] to have dots drawn after rest of board.
                                for (const moveSquareOfSelectedPiece of moves) {
                                    moveSquaresOfSelectedPiece.push(moveSquareOfSelectedPiece)
                                } //exit the for loop finding the piece selected's moves because there's only one list
                            }
                            break;
                        }
                    }
                }
            }
        }
    }
    for (squareToDropPieceAt of moveSquaresOfSelectedPiece) { //iterate through the end squares and draw them on the board
        fill(0, 0, 0, 100) //transparent black
        strokeWeight(0)
        if (mainGameBoard.whitesTurn == 0 || multiPlayerGame == true && myMPColour == 0) {
            circle(XOFFSET + squareToDropPieceAt[BOARDCOLUMN] * SQSIZE + SQSIZE / 2, YOFFSET + squareToDropPieceAt[BOARDROW] * SQSIZE + SQSIZE / 2, SQSIZE / 5)
        }
        else {
            circle(XOFFSET + (7 - squareToDropPieceAt[BOARDCOLUMN]) * SQSIZE + SQSIZE / 2, YOFFSET + (7 - squareToDropPieceAt[BOARDROW]) * SQSIZE + SQSIZE / 2, SQSIZE / 5)
        }
    }
    if (squareBeingDragged) {
        image(chessSpriteSheet, mouseX - SQSIZE / 2, mouseY - SQSIZE / 2, SQSIZE, SQSIZE, (draggedPieceOffset * 169) - 16, draggedColourOffset, 169, 136)
    }
}

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
