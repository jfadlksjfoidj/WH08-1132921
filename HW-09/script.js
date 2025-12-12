// script.js

// 初始化棋盤
function init() {
    const boardEl = document.getElementById('board');
    const statusEl = document.getElementById('status');
    
    boardEl.innerHTML = '';
    // 移除之前的特效 class
    boardEl.classList.remove('shake-board'); 
    
    board = Array(9).fill(null);
    active = true;
    current = 'X';
    
    statusEl.innerText = '玩家 (X) 先手';
    statusEl.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // 重置狀態列顏色

    // 建立9個格子
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.onclick = () => playerMove(i);
        boardEl.appendChild(cell);
    }
}

// 處理下棋動作 (共用邏輯)
function makeMove(index, player) {
    board[index] = player;
    
    // 更新 DOM 與動畫
    const cells = document.getElementsByClassName('cell');
    const cell = cells[index];
    cell.innerText = player;
    cell.classList.add(player.toLowerCase()); // 加入 .x 或 .o class
    cell.classList.add('taken'); // 標記已被佔用
    cell.classList.add('pop-in'); // 觸發落下動畫
}

// 玩家下棋
function playerMove(i) {
    if (!active || board[i]) return;
    
    makeMove(i, 'X');
    
    const winInfo = checkWin('X');
    if (winInfo) {
        highlightWin(winInfo);
        endGame('玩家 (X) 勝利！', 'win');
        return;
    } else if (isFull()) {
        endGame('平手！', 'draw');
        return;
    }

    current = 'O';
    document.getElementById('status').innerText = '電腦思考中...';
    // 鎖定棋盤，避免玩家在電腦思考時連點
    active = false; 
    
    setTimeout(() => {
        computerMove();
        if(active) active = true; // 如果遊戲沒結束，解鎖
    }, 700);
}

// 電腦AI下棋邏輯
function computerMove() {
    // 遊戲若已結束則不動作
    if (checkWin('X') || isFull()) return;

    let move = findWinningMove('O');
    if (move === null) move = findWinningMove('X');
    if (move === null) move = getRandomMove();

    makeMove(move, 'O');

    const winInfo = checkWin('O');
    if (winInfo) {
        highlightWin(winInfo);
        endGame('電腦 (O) 勝利！', 'lose');
        return;
    } else if (isFull()) {
        endGame('平手！', 'draw');
        return;
    }

    current = 'X';
    document.getElementById('status').innerText = '輪到玩家 (X)';
    active = true; // 把控制權還給玩家
}

// 找到可立即獲勝的位置
function findWinningMove(player) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    for (let [a,b,c] of wins) {
        const line = [board[a], board[b], board[c]];
        if (line.filter(v => v === player).length === 2 && line.includes(null)) {
            return [a,b,c][line.indexOf(null)];
        }
    }
    return null;
}

// 隨機選擇空格
function getRandomMove() {
    const empty = board.map((v, i) => v ? null : i).filter(v => v !== null);
    return empty[Math.floor(Math.random() * empty.length)];
}

// 判斷勝利 (修改版：回傳連線組合)
function checkWin(player) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    // 找到符合的連線並回傳該陣列 (例如 [0,1,2])
    return wins.find(([a,b,c]) => 
        board[a] === player && board[b] === player && board[c] === player
    );
}

// 高亮勝利連線
function highlightWin(indices) {
    const cells = document.getElementsByClassName('cell');
    indices.forEach(index => {
        cells[index].classList.add('win');
    });
}

// 判斷是否平手
function isFull() {
    return board.every(cell => cell !== null);
}

// 結束遊戲
function endGame(message, type) {
    const statusEl = document.getElementById('status');
    const boardEl = document.getElementById('board');
    
    statusEl.innerText = message;
    active = false;

    // 根據結果給予不同視覺反饋
    if (type === 'lose') {
        boardEl.classList.add('shake-board'); // 輸了抖動棋盤
        statusEl.style.backgroundColor = '#ff4757'; // 紅底
    } else if (type === 'win') {
        statusEl.style.backgroundColor = '#2ed573'; // 綠底
    } else {
        statusEl.style.backgroundColor = '#ffa502'; // 平手橘底
    }
}

// 重開一局
function resetGame() {
    init();
}

// 初始化
init();