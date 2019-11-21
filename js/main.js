var gLevel = { SIZE: 4, MINES: 2 }
var MINE = `<img src="imgs/mine.png"/>`;
var MARKED = `<img src="imgs/flag.png"/>`;
var UNSHOWN_CELL = ' ';
var standbySmiley = `<img src="imgs/standby_smiley.png"/>`;
var sadSmiley = `<img src="imgs/sad_smiley.png"/>`;
var coolSmiley = `<img src="imgs/cool_smiley.png"/>`;
var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, lives: 2 };
var gBoard = null;
var gGameInterval = null;
var gIsHint = false;
var gSafeClickCnt = 3;


function init(sizeNum, minesNum) {
    gLevel.SIZE = sizeNum;
    gLevel.MINES = minesNum;
    gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, lives: 2 };
    resetHints();
    gGame.isOn = true;
    gBoard = buildBoard(gLevel.SIZE);
    renderBoard(gBoard);
    updateHeader();
    updateScore();
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
        isHint: false
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
    if (gGame.secsPassed === 1) {
        gGameInterval = setInterval(updateHeader, 1000);
    }
    if (!gGame.shownCount) {
        if (gBoard[iIdx][jIdx].isMine) {
            moveMineToRandPos(gBoard, iIdx, jIdx);
        }
    }

    if (gBoard[iIdx][jIdx].isMine && !gGame.lives) {
        gameOver();
        document.querySelector(`.life${gGame.lives + 1}`).style.display = 'none';
    } else if (gBoard[iIdx][jIdx].isMine) {
        document.querySelector(`.life${gGame.lives-- + 1}`).style.display = 'none';
        gBoard[iIdx][jIdx].isShown = true;
        renderBoard(gBoard);
        setTimeout(() => { gBoard[iIdx][jIdx].isShown = false; renderBoard(gBoard) }, 450);
    }
    if (gBoard[iIdx][jIdx].isShown || !gGame.isOn) return;
    if (gBoard[iIdx][jIdx].isMarked) return;
    if (!gBoard[iIdx][jIdx].minesAroundCount) {
        return expandShown(gBoard, iIdx, jIdx);
    }
    gBoard[iIdx][jIdx].isShown = true;
    renderBoard(gBoard);
    isWin();
}

function cellMarked(iIdx, jIdx) {
    //cell is marked
    if (gGame.secsPassed === 1) {
        gGameInterval = setInterval(updateHeader, 1000);
    }
    if (gBoard[iIdx][jIdx].isShown || !gGame.isOn) return;
    if (gBoard[iIdx][jIdx].isMarked) {
        gBoard[iIdx][jIdx].isMarked = false;
        return renderBoard(gBoard);
    }
    gBoard[iIdx][jIdx].isMarked = true;
    renderBoard(gBoard);
    isWin();
}

function gameOver() {
    updateScore();
    gGame.isOn = false;
    clearInterval(gGameInterval);
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            gBoard[i][j].isShown = true;
        }
    }
    renderBoard(gBoard);
    document.querySelector('.restart').innerHTML = sadSmiley;
    document.querySelector('.modal').hidden = false;
    document.querySelector('.modal-content').innerHTML = 'Lost, try again.';
}


function isWin() {
    if (gGame.shownCount === (gLevel.SIZE ** 2 - gLevel.MINES)
        && gGame.markedCount === gLevel.MINES) {
        updateScore();
        gGame.isOn = false;
        clearInterval(gGameInterval);
        for (var i = 0; i < gLevel.SIZE; i++) {
            for (var j = 0; j < gLevel.SIZE; j++) {
                gBoard[i][j].isShown = true;
            }
        }
        renderBoard(gBoard);
        document.querySelector('.restart').innerHTML = coolSmiley;
        document.querySelector('.modal').hidden = false;
        document.querySelector('.modal-content').innerHTML = 'VICTORY!!';

    }
}

// function expandShown(board, iIdx, jIdx) {
//     // var pos = { i: iIdx, j: jIdx };

//     for (let i = iIdx - 1; i <= iIdx + 1; i++) {
//         if (i < 0 || i >= board.length) continue;
//         for (let j = jIdx - 1; j <= jIdx + 1; j++) {
//             if (j < 0 || j >= board[0].length) continue;
//             // if (!board[i][j].minesAroundCount) expandShown(board, i, j);
//             if (board[i][j].isMine) {
//                 continue;
//             } else if (board[i][j].isMarked) {
//                 continue;
//             } else {
//                 board[i][j].isShown = true;
//             }
//         }
//     }
//     renderBoard(gBoard);
//     console.log('expanded');
// }


function expandShown(board, iIdx, jIdx) {
    if (iIdx < 0 || iIdx >= board.length || jIdx < 0 || jIdx >= gBoard[0].length) return; // check for bounds
    if (board[iIdx][jIdx].minesAroundCount) {
        board[iIdx][jIdx].isShown = true;
        renderBoard(board);
        return;
    }
    if (!board[iIdx][jIdx].isMine && !board[iIdx][jIdx].isShown) {
        board[iIdx][jIdx].isShown = true;
        renderBoard(board);
        expandShown(board, iIdx + 1, jIdx);
        expandShown(board, iIdx - 1, jIdx);
        expandShown(board, iIdx, jIdx - 1);
        expandShown(board, iIdx, jIdx + 1);
    } else {
        return;
    }
}

function updateHeader() {
    if (!gGame.isOn) return;
    var elFieldHeader = document.querySelector('.field-header');
    var strHTML = ``;

    var scoreDiv = `<td class="score">${gGame.shownCount}</td>\n`;
    var restartBtn = `\t<td colspan="${gLevel.SIZE - 2}"><button class="restart" onclick="init(gLevel.SIZE, gLevel.MINES)"
     type="button">${standbySmiley}</button></td>\n`;
    var timerDiv = `<td class="timer">${gGame.secsPassed++}s</td>\n`;

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

    var notMineCellPos = getNotMineCell(board);
    board[notMineCellPos.i][notMineCellPos.j].isMine = true;
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
    if (!gGame.isOn) return;
    if (gIsHint) return;
    gIsHint = true;
    var notMineCellPos = getNotMineCell(gBoard);
    var elHintBtn = elBtn;
    showNeighs(notMineCellPos);
    setTimeout(() => { hideNeighs(notMineCellPos) }, 2000);
    elHintBtn.hidden = true;
    gIsHint = false;
}


function showNeighs(pos) {
    for (let i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (gBoard[i][j].isMarked || gBoard[i][j].isShown) {
                continue;
            }
            gBoard[i][j].isShown = true;
            gBoard[i][j].isHint = true;

        }
    }
    renderBoard(gBoard);
}

function hideNeighs(pos) {
    for (let i = pos.i - 1; i <= pos.i + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (let j = pos.j - 1; j <= pos.j + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue;
            if (gBoard[i][j].isHint) {
                gBoard[i][j].isShown = false;
                gBoard[i][j].isHint = false;
            }
        }
    }
    renderBoard(gBoard);
}

function resetHints() {
    var elHintBtns = document.querySelectorAll('.hint');
    var elLifeImgs = document.querySelectorAll('img.life');
    for (var i = 0; i < elHintBtns.length; i++) {
        elHintBtns[i].hidden = false;
    }

    for (var j = 0; j < elLifeImgs.length; j++) {
        elLifeImgs[j].style.display = 'inline-block';
    }
}

function updateScore() {
    var level = gLevel.SIZE;
    var time = gGame.secsPassed;
    var elBestLvl = document.querySelector('.best-level');
    var elBestTime = document.querySelector('.best-time');

    if (!localStorage.getItem(level)) {
        localStorage.setItem(`${level}`, `${time}`);
    }
    if (time > localStorage.getItem(level)) {
        localStorage.setItem(`${level}`, `${time}`);
    }

    elBestLvl.innerText = `${level}*${level}`;
    elBestTime.innerText = localStorage.getItem(level);
}

function safeClick() {
    var notMineCellPos = getNotMineCell(gBoard);
    var elCell = document.querySelector(`cell${notMineCellPos.i}-${notMineCellPos.j}`);

    if (!gSafeClickCnt) return;
    gSafeClickCnt--;
    elCell.style.backgroundColor = "lightgreen";

    setTimeout(() => { elCell.style.backgroundColor = rgb(108, 61, 185); }, 1000);
}