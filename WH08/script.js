// 初始變數
const boardEl = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const btnReset = document.getElementById('reset');
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

// 三格成直線狀態
const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diags
];

// 起始函式
function init() {
    board = Array(9).fill('');
    current = 'X'; 
    active = true;
    
    cells.forEach(c => {
        c.textContent = '';
        c.className = 'cell'; // 重置 class
        c.disabled = false;
    });
    
    // 確保元素存在才設定，避免報錯
    if(turnEl) turnEl.textContent = current;
    if(stateEl) stateEl.textContent = '';
}

// 下手
function place(idx) {
    if (!active || board[idx]) return;
    
    board[idx] = current;
    const cell = cells[idx];
    cell.textContent = current;
    cell.classList.add(current.toLowerCase()); // 加 x 或 o class
    
    const result = evaluate();
    if (result.finished) {
        endGame(result);
    } else {
        switchTurn();
    }
}

// 換手函式
function switchTurn() {
    current = current === 'X' ? 'O' : 'X';
    if(turnEl) turnEl.textContent = current;
}

// 下手後計算是否成一線結束遊戲的函式
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

// 確認是否結束遊戲
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

// 更新計分板
function updateScoreboard(){
    if(scoreXEl) scoreXEl.textContent = scoreX;
    if(scoreOEl) scoreOEl.textContent = scoreO;
    if(scoreDrawEl) scoreDrawEl.textContent = scoreDraw;
}

// 事件監聽：點擊格子
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const idx = +cell.getAttribute('data-idx');
        place(idx);
    });
});

// 綁定事件：重開遊戲（保留分數）
if(btnReset) {
    btnReset.addEventListener('click', init);
}

// 啟動遊戲 (這行現在一定會執行到了)
init();