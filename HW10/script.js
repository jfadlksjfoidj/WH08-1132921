const BOARD_SIZE = 8;
const EMPTY = 0, BLACK = 1, WHITE = 2;
let board = [];
let currentPlayer = BLACK;
let isComputerMode = true;
let isProcessing = false;

const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
const dc = [-1, 0, 1, -1, 1, -1, 0, 1];

const boardEl = document.getElementById('game-board');
const statusEl = document.getElementById('status-text');
const scoreBlackEl = document.getElementById('score-black');
const scoreWhiteEl = document.getElementById('score-white');
const p1InfoEl = document.getElementById('p1-info');
const p2InfoEl = document.getElementById('p2-info');

// 勝利畫面元素
const victoryOverlay = document.getElementById('victory-overlay');
const winnerTitle = document.getElementById('winner-title');
const endBlackScore = document.getElementById('end-black');
const endWhiteScore = document.getElementById('end-white');

// === 初始化 ===
function initGame() {
    boardEl.innerHTML = '';
    board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.onclick = () => handleCellClick(r, c);
            
            const discContainer = document.createElement('div');
            discContainer.classList.add('disc-container');
            discContainer.style.transform = 'scale(0)'; 
            
            const front = document.createElement('div');
            front.className = 'face front';
            const back = document.createElement('div');
            back.className = 'face back';
            
            discContainer.appendChild(front);
            discContainer.appendChild(back);
            cell.appendChild(discContainer);
            boardEl.appendChild(cell);
        }
    }

    setDisc(3, 3, WHITE, false);
    setDisc(3, 4, BLACK, false);
    setDisc(4, 3, BLACK, false);
    setDisc(4, 4, WHITE, false);

    currentPlayer = BLACK;
    isProcessing = false;
    isComputerMode = document.getElementById('chk-computer').checked;
    
    victoryOverlay.classList.remove('visible'); // 隱藏勝利畫面
    stopConfetti(); // 停止煙火
    
    updateUI();
}
async function computerMove() {
    // 1. 取得目前選單的難度值
    const difficulty = document.getElementById('difficulty-level').value;
    
    let bestMove = null;
    let validMoves = []; // 用來存所有合法步 (給基本棋力用)

    // 掃描棋盤找出所有合法步
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === EMPTY) {
                const flips = getFlippableDiscs(r, c, WHITE);
                if (flips.length > 0) {
                    // 記錄這一手
                    validMoves.push({ r, c, flips: flips.length });
                }
            }
        }
    }

    // 如果沒有合法步，直接結束 (交給 nextTurn 處理 Pass)
    if (validMoves.length === 0) return;

    // === 分歧點：根據難度決定策略 ===
    
    if (difficulty === 'basic') {
        // ★ 基本棋力：完全隨機 ★
        // 從所有合法步中，隨機挑一個 index
        const randomIndex = Math.floor(Math.random() * validMoves.length);
        bestMove = validMoves[randomIndex];
        console.log("電腦 (基本)：隨機下子");
    } 
    else {
        // ★ 進階棋力：貪婪演算法 + 權重 ★
        let maxScore = -9999;
        
        for (let move of validMoves) {
            let score = move.flips; // 基礎分 = 吃掉的子數
            const { r, c } = move;

            // 策略加分
            // 1. 角落是超級好位 (+15)
            if ((r === 0 || r === 7) && (c === 0 || c === 7)) {
                score += 15;
            }
            // 2. 邊邊是不錯的位置 (+2)，但要小心不要送角
            else if (r === 0 || r === 7 || c === 0 || c === 7) {
                score += 2;
            }
            // 3. (進階) 避免下在角落旁邊的 "X點" 或 "C點" (這裡簡化處理，以免太強)
            
            if (score > maxScore) {
                maxScore = score;
                bestMove = move;
            }
        }
        console.log("電腦 (進階)：計算最佳位置");
    }

    // 執行下子
    if (bestMove) {
        if (await tryMove(bestMove.r, bestMove.c)) {
            await nextTurn();
        }
    }
}
// === 遊戲邏輯 ===
async function handleCellClick(r, c) {
    isComputerMode = document.getElementById('chk-computer').checked;
    if (isProcessing) return;
    if (isComputerMode && currentPlayer === WHITE) return;
    if (board[r][c] !== EMPTY) return;

    if (await tryMove(r, c)) {
        await nextTurn();
    }
}

async function tryMove(r, c) {
    const flips = getFlippableDiscs(r, c, currentPlayer);
    if (flips.length === 0) return false;

    isProcessing = true;
    board[r][c] = currentPlayer;
    setDisc(r, c, currentPlayer, true);

    // 依距離排序，產生波浪效果
    flips.sort((a, b) => (Math.abs(a.r - r) + Math.abs(a.c - c)) - (Math.abs(b.r - r) + Math.abs(b.c - c)));

    for (const p of flips) {
        await wait(100);
        board[p.r][p.c] = currentPlayer;
        flipDisc(p.r, p.c, currentPlayer);
        updateScoreOnly();
    }
    
    await wait(400);
    return true;
}

function getFlippableDiscs(r, c, player) {
    const opponent = (player === BLACK) ? WHITE : BLACK;
    let allFlips = [];
    for (let i = 0; i < 8; i++) {
        let tempFlips = [];
        let nr = r + dr[i], nc = c + dc[i];
        while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === opponent) {
            tempFlips.push({r: nr, c: nc});
            nr += dr[i]; nc += dc[i];
        }
        if (tempFlips.length > 0 && nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
            allFlips.push(...tempFlips);
        }
    }
    return allFlips;
}

async function nextTurn() {
    updateUI();
    const nextPlayer = (currentPlayer === BLACK) ? WHITE : BLACK;
    
    if (hasValidMove(nextPlayer)) {
        currentPlayer = nextPlayer;
    } else {
        if (hasValidMove(currentPlayer)) {
            alert((nextPlayer === BLACK ? "黑棋" : "白棋") + " 無處可下，Pass！");
        } else {
            showGameOver(); // 觸發遊戲結束特效
            return;
        }
    }

    updateUI();
    isProcessing = false;

    if (isComputerMode && currentPlayer === WHITE) {
        isProcessing = true;
        await wait(800);
        computerMove();
    }
}

async function computerMove() {
    let bestMove = null;
    let maxScore = -9999;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === EMPTY) {
                const flips = getFlippableDiscs(r, c, WHITE);
                if (flips.length > 0) {
                    let score = flips.length;
                    if ((r===0 || r===7) && (c===0 || c===7)) score += 15;
                    else if (r===0 || r===7 || c===0 || c===7) score += 2;
                    if (score > maxScore) {
                        maxScore = score;
                        bestMove = {r, c};
                    }
                }
            }
        }
    }

    if (bestMove) {
        if (await tryMove(bestMove.r, bestMove.c)) {
            await nextTurn();
        }
    }
}

// === 畫面更新與動畫 ===
function setDisc(r, c, type, animate) {
    board[r][c] = type;
    const disc = getCell(r, c).querySelector('.disc-container');
    const rot = (type === BLACK) ? 'rotateY(0deg)' : 'rotateY(180deg)';
    
    if (animate) {
        disc.style.transition = 'none';
        disc.style.transform = `${rot} scale(0.1)`;
        void disc.offsetWidth;
        disc.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        disc.style.transform = `${rot} scale(1)`;
    } else {
        disc.style.transition = 'none';
        disc.style.transform = `${rot} scale(1)`;
        setTimeout(() => disc.style.transition = '', 50);
    }
}

function flipDisc(r, c, newType) {
    const disc = getCell(r, c).querySelector('.disc-container');
    disc.style.transform = (newType === BLACK) ? 'rotateY(0deg) scale(1)' : 'rotateY(180deg) scale(1)';
}

function updateUI() {
    let black = 0, white = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = getCell(r, c);
            cell.classList.remove('valid-move');
            cell.removeAttribute('data-count');
            if (board[r][c] === BLACK) black++;
            else if (board[r][c] === WHITE) white++;
            else if ((!isComputerMode || currentPlayer === BLACK)) {
                const flips = getFlippableDiscs(r, c, currentPlayer);
                if (flips.length > 0) {
                    cell.classList.add('valid-move');
                    cell.setAttribute('data-count', flips.length);
                }
            }
        }
    }
    scoreBlackEl.innerText = black;
    scoreWhiteEl.innerText = white;
    
    if (currentPlayer === BLACK) {
        p1InfoEl.classList.add('active');
        p2InfoEl.classList.remove('active');
        statusEl.innerText = "輪到：黑棋";
    } else {
        p1InfoEl.classList.remove('active');
        p2InfoEl.classList.add('active');
        statusEl.innerText = "輪到：白棋";
    }
}

function updateScoreOnly() {
    let black = 0, white = 0;
    for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++)
            if (board[r][c] === BLACK) black++;
            else if (board[r][c] === WHITE) white++;
    scoreBlackEl.innerText = black;
    scoreWhiteEl.innerText = white;
}

// === 遊戲結束特效 ===
function showGameOver() {
    const b = parseInt(scoreBlackEl.innerText);
    const w = parseInt(scoreWhiteEl.innerText);
    endBlackScore.innerText = b;
    endWhiteScore.innerText = w;

    if (b > w) {
        winnerTitle.innerText = "🎉 黑棋獲勝！ 🎉";
        winnerTitle.style.color = "#f1c40f";
    } else if (w > b) {
        winnerTitle.innerText = "🎉 白棋獲勝！ 🎉";
        winnerTitle.style.color = "#fff";
    } else {
        winnerTitle.innerText = "🤝 雙方平手！ 🤝";
        winnerTitle.style.color = "#2ecc71";
    }

    victoryOverlay.classList.add('visible');
    startConfetti(); // 啟動煙火
}

function closeVictoryAndRestart() {
    victoryOverlay.classList.remove('visible');
    stopConfetti();
    initGame();
}

// === 簡易煙火/彩帶特效系統 (Canvas) ===
let confettiReq;
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 5 + 5,
            rotation: Math.random() * 360
        });
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y += p.vy;
            p.x += p.vx;
            p.rotation += 5;

            if (p.y > canvas.height) p.y = -10;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        });
        confettiReq = requestAnimationFrame(render);
    }
    render();
}

function stopConfetti() {
    if (confettiReq) cancelAnimationFrame(confettiReq);
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function hasValidMove(player) {
    for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++)
            if (board[r][c] === EMPTY && getFlippableDiscs(r, c, player).length > 0) return true;
    return false;
}

function getCell(r, c) { return boardEl.children[r * BOARD_SIZE + c]; }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function restartGame() { initGame(); }

// 啟動
initGame();