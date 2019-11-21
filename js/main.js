var gLevel = { SIZE: 4, MINES: 2 }
var MINE = `<img src="../minesweeper/imgs/mine.png"/>`;
var MARKED = `<img src="../minesweeper/imgs/flag.png"/>`;
var UNSHOWN_CELL = ' ';
var standbySmiley = `<img src="../minesweeper/imgs/standby_smiley.png"/>`;
var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0 };
var gBoard = null;
var gGameInterval = null;
var gTimerStarter = 0;
var gIsHint = false;


function init(sizeNum, minesNum) {
    gLevel.SIZE = sizeNum;
    gLevel.MINES = minesNum;
    gTimerStarter = 0;
    resetHints();
    gGame.isOn = true;
    gBoard = buildBoard(gLevel.SIZE);
    renderBoard(gBoard);
    updateHeader();
}

function buildBoard(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board.push([]);
        for (var j = 0; j < size; j++) {
            board[i][j] = cellCreator();
        }
    }

    for (let i = 0; i < gLevel.MINES; i++) {
        let rndNum1 = getRandomIntInclusive(0, size - 1);
        let rndNum2 = getRandomIntInclusive(0, size - 1);

        board[rndNum1][rndNum2].isMine = true;
    }

    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            if (board[i][j].isMine) continue;
            var pos = { i: i, j: j };
            board[i][j].minesAroundCount = setMinesNegsCount(pos, board);
        }
    }
    return board;
}

function cellCreator() {
    var cell = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
    }
    return cell;
}

function renderBoard(board) {
    var strHTML = '';
    var elField = document.querySelector('.field');
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n';
        for (var j = 0; j < board[0].length; j++) {
            var currCellPos = { i: i, j: j };
            if (board[i][j].isShown) {
                gGame.shownCount++;
                strHTML += getCellShownHTML(currCellPos, board);
            } else if (board[i][j].isMarked) {
                gGame.markedCount++;
                strHTML += getCellHTML(currCellPos, MARKED, 'marked');
            } else {
                strHTML += getCellHTML(currCellPos, UNSHOWN_CELL, 'unshown');
            }
        }
        strHTML += '</tr>';
    }
    elField.innerHTML = strHTML;
}

function getCellHTML(posObj, value, clsName) {
    var className = 'cell cell' + posObj.i + '-' + posObj.j + ' ' + clsName;
    var cell = value;
    var strHTML = `\t<td class="${className}" onclick="cellClicked(${posObj.i}, ${posObj.j})"
    oncontextmenu="cellMarked(${posObj.i}, ${posObj.j});return false;"> ${cell} </td>\n`;
    return strHTML;
}

function getCellShownHTML(posObj, board) {
    var className = 'cell cell' + posObj.i + '-' + posObj.j;
    var cell = null;
    if (board[posObj.i][posObj.j].isMine) {
        cell = MINE;
        className += ' mine';
    } else if (board[posObj.i][posObj.j].minesAroundCount) {
        cell = board[posObj.i][posObj.j].minesAroundCount;
        className += ` number number${cell}`;
    } else {
        cell = ' ';
        className += ' empty';
    }
    var strHTML = `\t<td class="${className}" onclick="cellClicked(${posObj.i}, ${posObj.j})" 
    oncontextmenu="cellMarked(${posObj.i}, ${posObj.j});return false;"> ${cell} </td>\n`;
    return strHTML;
}

function setMinesNegsCount(pos, board) {
    var mineCount = 0;
    for (let i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;

        for (let j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            if (i === pos.i && j === pos.j) continue;
            if (board[i][j].isMine) mineCount++;
        }
    }
    return mineCount;
}

function cellClicked(iIdx, jIdx) {
    // cell is shown
    if (gTimerStarter === 1) {
        gGameInterval = setInterval(updateHeader, 1000);
    }
    if (!gGame.shownCount) {
        if (gBoard[iIdx][jIdx].isMine) {
            moveMineToRandPos(gBoard, iIdx, jIdx);
        }
    }

    if (gBoard[iIdx][jIdx].isMine) gameOver();
    if (gBoard[iIdx][jIdx].isShown || !gGame.isOn) return;
    if (gBoard[iIdx][jIdx].isMarked) return;
    if (!gBoard[iIdx][jIdx].minesAroundCount) {
        return expandShown(gBoard, iIdx, jIdx);
    }
    gBoard[iIdx][jIdx].isShown = true;
    renderBoard(gBoard);
    checkGameOver();
}

function cellMarked(iIdx, jIdx) {
    //cell is marked
    if (gTimerStarter === 1) {
        gGameInterval = setInterval(updateHeader, 1000);
    }
    if (gBoard[iIdx][jIdx].isShown || !gGame.isOn) return;
    if (gBoard[iIdx][jIdx].isMarked) {
        gBoard[iIdx][jIdx].isMarked = false;
        return renderBoard(gBoard);
    }
    gBoard[iIdx][jIdx].isMarked = true;
    renderBoard(gBoard);
    checkGameOver();
}

function gameOver() {
    gGame.isOn = false;
    clearInterval(gGameInterval);
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            gBoard[i][j].isShown = true;
        }
    }
    renderBoard(gBoard);
    console.log('you lose');
}


function checkGameOver() {
    if (gGame.shownCount === (gLevel.SIZE ** 2 - gLevel.MINES) 
    && gGame.markedCount === gLevel.MINES) {
        gameOver();
        console.log('you won');
    }
}

function expandShown(board, iIdx, jIdx) {
    for (let i = iIdx - 1; i <= iIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (let j = jIdx - 1; j <= jIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            // if (!board[i][j].minesAroundCount) expandShown(board, i, j);
            if (board[i][j].isMine) {
                continue;
            } else if (board[i][j].isMarked) {
                continue;
            } else {
                board[i][j].isShown = true;
            }
        }
    }
    renderBoard(gBoard);
    console.log('expanded');
}

function updateHeader() {
    if (!gGame.isOn) return;
    var elFieldHeader = document.querySelector('.field-header');
    var strHTML = ``;

    var scoreDiv = `<td class="score">${gGame.shownCount}</td>\n`;
    var restartBtn = `\t<td colspan="${gLevel.SIZE - 2}"><button class="restart" onclick="init(gLevel.SIZE, gLevel.MINES)"
     type="button">${standbySmiley}</button></td>\n`;
    var timerDiv = `<td class="timer">${gTimerStarter++}s</td>\n`;

    strHTML += scoreDiv + restartBtn + timerDiv;
    elFieldHeader.innerHTML = strHTML;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function moveMineToRandPos(board, iIdx, jIdx) {
    var pos = { i: iIdx, j: jIdx };
    board[iIdx][jIdx].isMine = false;
    board[iIdx][jIdx].minesAroundCount = setMinesNegsCount(pos, board);

    var notMineCell = getNotMineCell(board);
    board[notMineCell.i][notMineCell.j].isMine = true;
}

function getNotMineCell(board) {
    var emptyCells = [];
    var currElCell;

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            currElCell = board[i][j];
            if (!currElCell.isMine) {
                emptyCells.push({ i: i, j: j });
            }
        }
    }
    var empCell = emptyCells[getRandomIntInclusive(0, emptyCells.length - 1)];

    return empCell;
}

function getHint(elBtn) {
    var notMineCell = getNotMineCell(gBoard);
    var elHintBtn = elBtn;
    toggleNeighsShow(notMineCell);
    setTimeout(() => {toggleNeighsShow(notMineCell)}, 2000);
    elHintBtn.hidden = true;
    console.log('gethint hide');
}


function toggleNeighsShow(pos) {
    for (let i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (gBoard[i][j].isMarked) {
                continue;
            } else if (gBoard[i][j].isShown) {
                gBoard[i][j].isShown = false;
            } else {
                gBoard[i][j].isShown = true;
            }
        }
    }
    renderBoard(gBoard);
}

function resetHints(){
    var elHintBtns = document.querySelectorAll('.hint');
    for (var i = 0; i < elHintBtns.length; i++) {
        elHintBtns[i].hidden = false;
    }
}