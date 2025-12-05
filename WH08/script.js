// 初始變數
const boardEl = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const btnReset = document.getElementById('reset');
// 補回這個變數
const btnResetAll = document.getElementById('reset-all');
const turnEl = document.getElementById('turn');
const stateEl = document.getElementById('state');

// 計分用變數
let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreDrawEl = document.getElementById('score-draw');

let board, current, active;

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function init() {
    board = Array(9).fill('');
    current = 'X'; 
    active = true;
    
    cells.forEach(c => {
        c.textContent = '';
        c.className = 'cell';
        c.disabled = false;
    });
    
    if(turnEl) turnEl.textContent = current;
    if(stateEl) stateEl.textContent = '';
}

function place(idx) {
    if (!active || board[idx]) return;
    
    board[idx] = current;
    const cell = cells[idx];
    cell.textContent = current;
    cell.classList.add(current.toLowerCase());
    
    const result = evaluate();
    if (result.finished) {
        endGame(result);
    } else {
        switchTurn();
    }
}

function switchTurn() {
    current = current === 'X' ? 'O' : 'X';
    if(turnEl) turnEl.textContent = current;
}

function evaluate() {
    for (const line of WIN_LINES) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { finished: true, winner: board[a], line };
        }
    }
    if (board.every(v => v)) return { finished: true, winner: null };
    return { finished: false };
}

function endGame({winner, line}){
    active = false;
    if(winner){
        stateEl.textContent = `${winner} 勝利！`;
        line.forEach(i=> cells[i].classList.add('win'));
        if(winner==='X') scoreX++; else scoreO++;
    } else {
        stateEl.textContent = '平手';
        scoreDraw++;
    }
    updateScoreboard();
    cells.forEach(c=> c.disabled = true);
}

function updateScoreboard(){
    if(scoreXEl) scoreXEl.textContent = scoreX;
    if(scoreOEl) scoreOEl.textContent = scoreO;
    if(scoreDrawEl) scoreDrawEl.textContent = scoreDraw;
}

// 監聽器
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const idx = +cell.getAttribute('data-idx');
        place(idx);
    });
});

if(btnReset) {
    btnReset.addEventListener('click', init);
}

// 補回重置積分功能
if(btnResetAll) {
    btnResetAll.addEventListener('click', () => {
        scoreX = 0;
        scoreO = 0;
        scoreDraw = 0;
        updateScoreboard();
        init(); // 重置分數時順便重開一局
    });
}

// 啟動遊戲
init();
