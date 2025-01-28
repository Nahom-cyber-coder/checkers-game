// Game State Variables
let currentPlayer = 1;
let boardState = Array(8).fill().map(() => Array(8).fill(null));
let selectedPiece = null;
let isMultiplayer = false;
let player1Name = "Player 1";
let player2Name = "Player 2";
let player1Score = 0;
let player2Score = 0;
let player1ScoreGroup = 0;
let player2ScoreGroup = 0;

const themeToggle = document.getElementById('themeToggle');

function initializeBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  boardState = Array(8).fill().map(() => Array(8).fill(null));
  player1Score = 0;
  player2Score = 0;
  player1ScoreGroup = 0;
  player2ScoreGroup = 0;
  updateScoreboard();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if ((row + col) % 2 !== 0) cell.classList.add('dark');
      else cell.classList.add('light');
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', () => handleCellClick(row, col));
      board.appendChild(cell);
      if (row < 3 && (row + col) % 2 !== 0) boardState[row][col] = { player: 2, king: false };
      else if (row > 4 && (row + col) % 2 !== 0) boardState[row][col] = { player: 1, king: false };
    }
  }
  renderPieces();
  updateTurnIndicator();
  showInstructions();
}

function renderPieces() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const piece = boardState[row][col];
    cell.innerHTML = '';
    if (piece) {
      const pieceElement = document.createElement('div');
      pieceElement.classList.add('piece', `player${piece.player}`);
      if (piece.king) pieceElement.classList.add('king');
      if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) pieceElement.classList.add('selected');
      pieceElement.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePieceClick(row, col);
      });
      cell.appendChild(pieceElement);
    }
  });
}

function handlePieceClick(row, col) {
  const piece = boardState[row][col];
  if (piece && piece.player === currentPlayer) {
    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
      selectedPiece = null;
      clearHighlights();
      renderPieces();
      return;
    }
    const mandatoryCaptures = getMandatoryCaptures();
    if (mandatoryCaptures.length > 0 && !isCaptureMove(row, col, mandatoryCaptures)) {
      const captureMessage = document.getElementById('captureMessage');
      captureMessage.classList.remove('hidden');
      setTimeout(() => {
        captureMessage.classList.add('hidden');
      }, 2000);
      return;
    }
    selectedPiece = { row, col };
    highlightPossibleMoves(row, col);
    renderPieces();
  }
}

function highlightPossibleMoves(row, col) {
  const piece = boardState[row][col];
  if (!piece) return;
  clearHighlights();
  const directions = getAllowedDirections(piece);
  directions.forEach(dir => {
    let newRow = row + dir.row;
    let newCol = col + dir.col;
    while (isWithinBounds(newRow, newCol) && !boardState[newRow][newCol]) {
      const cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
      if (cell) cell.classList.add('highlight');
      if (!piece.king) break;
      newRow += dir.row;
      newCol += dir.col;
    }
    let captureRow = row + 2 * dir.row;
    let captureCol = col + 2 * dir.col;
    if (isValidMove(row, col, captureRow, captureCol, piece, true)) {
      const captureCell = document.querySelector(`.cell[data-row="${captureRow}"][data-col="${captureCol}"]`);
      if (captureCell) captureCell.classList.add('highlight');
    }
  });
}

function getAllowedDirections(piece) {
  if (piece.king) {
    return [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 }
    ];
  } else {
    const direction = piece.player === 1 ? -1 : 1;
    return [
      { row: direction, col: -1 },
      { row: direction, col: 1 }
    ];
  }
}

function isWithinBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function handleCellClick(row, col) {
  if (selectedPiece) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell.classList.contains('highlight')) {
      const move = {
        fromRow: selectedPiece.row,
        fromCol: selectedPiece.col,
        toRow: row,
        toCol: col
      };
      movePiece(move.fromRow, move.fromCol, move.toRow, move.toCol);
      selectedPiece = null;
      clearHighlights();
      renderPieces();
      checkWinCondition();
      if (!isMultiplayer && currentPlayer === 2) setTimeout(makeAIMove, 500);
    } else {
      selectedPiece = null;
      clearHighlights();
      renderPieces();
    }
  }
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const piece = boardState[fromRow][fromCol];
  if (!piece) return;
  boardState[toRow][toCol] = piece;
  boardState[fromRow][fromCol] = null;
  if ((toRow === 0 && piece.player === 1) || (toRow === 7 && piece.player === 2)) piece.king = true;
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  if (Math.abs(rowDiff) === 2 || (piece.king && Math.abs(rowDiff) > 2)) {
    const midRow = Math.floor((fromRow + toRow) / 2);
    const midCol = Math.floor((fromCol + toCol) / 2);
    const capturedPiece = boardState[midRow][midCol];
    if (capturedPiece) {
      boardState[midRow][midCol] = null;
      if (piece.player === 1) player1ScoreGroup++;
      else player2ScoreGroup++;
      updateScoreboard();
    }
    const additionalCaptures = getValidCaptures(toRow, toCol, piece);
    if (additionalCaptures.length > 0) {
      selectedPiece = { row: toRow, col: toCol };
      highlightPossibleCaptures(toRow, toCol);
      renderPieces();
      return;
    }
  }
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateTurnIndicator();
}

function isCaptureMove(row, col, mandatoryCaptures) {
  return mandatoryCaptures.some(capture => capture.fromRow === row && capture.fromCol === col);
}

function getMandatoryCaptures() {
  const captures = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece && piece.player === currentPlayer) {
        const validCaptures = getValidCaptures(row, col, piece);
        if (validCaptures.length > 0) captures.push({ fromRow: row, fromCol: col });
      }
    }
  }
  return captures;
}

function getValidCaptures(row, col, piece) {
  const captures = [];
  const directions = getAllowedDirections(piece);
  directions.forEach(dir => {
    const midRow = row + dir.row;
    const midCol = col + dir.col;
    const jumpRow = row + 2 * dir.row;
    const jumpCol = col + 2 * dir.col;
    if (isValidMove(row, col, jumpRow, jumpCol, piece, true)) captures.push({ toRow: jumpRow, toCol: jumpCol });
  });
  return captures;
}

function highlightPossibleCaptures(row, col) {
  const piece = boardState[row][col];
  if (!piece) return;
  clearHighlights();
  const captures = getValidCaptures(row, col, piece);
  captures.forEach(capture => {
    const cell = document.querySelector(`.cell[data-row="${capture.toRow}"][data-col="${capture.toCol}"]`);
    if (cell) cell.classList.add('highlight');
  });
}

function isValidMove(fromRow, fromCol, toRow, toCol, piece, isCapture = false) {
  if (!piece) return false;
  if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
  if (boardState[toRow][toCol]) return false;
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const allowedDirections = getAllowedDirections(piece);
  const isDirectionAllowed = allowedDirections.some(dir => {
    return isCapture ? dir.row * 2 === rowDiff && dir.col * 2 === colDiff : dir.row === rowDiff && dir.col === colDiff;
  });
  if (!isDirectionAllowed) return false;
  if (!isCapture) return Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1;
  if (isCapture) {
    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const midRow = fromRow + rowDiff / 2;
      const midCol = fromCol + colDiff / 2;
      const midPiece = boardState[midRow][midCol];
      return midPiece && midPiece.player !== piece.player;
    }
    if (piece.king && Math.abs(rowDiff) > 2 && Math.abs(colDiff) > 2) {
      let currentRow = fromRow + (rowDiff > 0 ? 1 : -1);
      let currentCol = fromCol + (colDiff > 0 ? 1 : -1);
      let hasOpponentPiece = false;
      while (currentRow !== toRow && currentCol !== toCol) {
        const currentPiece = boardState[currentRow][currentCol];
        if (currentPiece) {
          if (currentPiece.player !== piece.player) hasOpponentPiece = true;
          else return false;
        }
        currentRow += (rowDiff > 0 ? 1 : -1);
        currentCol += (colDiff > 0 ? 1 : -1);
      }
      return hasOpponentPiece;
    }
  }
  return false;
}

function makeAIMove() {
  const moves = getAllPossibleMoves(2);
  if (moves.length === 0) {
    checkWinCondition();
    return;
  }
  const captureMoves = moves.filter(move => move.isCapture);
  let selectedMove;
  if (captureMoves.length > 0) selectedMove = selectBestCaptureMove(captureMoves);
  else selectedMove = selectBestRegularMove(moves);
  movePiece(selectedMove.fromRow, selectedMove.fromCol, selectedMove.toRow, selectedMove.toCol);
  renderPieces();
  checkWinCondition();
}

function selectBestCaptureMove(captureMoves) {
  return captureMoves[0];
}

function selectBestRegularMove(regularMoves) {
  return regularMoves[Math.floor(Math.random() * regularMoves.length)];
}

function getAllPossibleMoves(player) {
  const allMoves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece && piece.player === player) {
        const directions = getAllowedDirections(piece);
        directions.forEach(dir => {
          const newRow = row + dir.row;
          const newCol = col + dir.col;
          if (isValidMove(row, col, newRow, newCol, piece)) {
            allMoves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol, isCapture: false });
          }
          const jumpRow = row + 2 * dir.row;
          const jumpCol = col + 2 * dir.col;
          if (isValidMove(row, col, jumpRow, jumpCol, piece, true)) {
            allMoves.push({ fromRow: row, fromCol: col, toRow: jumpRow, toCol: jumpCol, isCapture: true });
          }
        });
      }
    }
  }
  return allMoves;
}

function checkWinCondition() {
  const player1Pieces = boardState.flat().filter(piece => piece && piece.player === 1).length;
  const player2Pieces = boardState.flat().filter(piece => piece && piece.player === 2).length;
  if (player1Pieces === 0) {
    showWinMessage(isMultiplayer ? `${player2Name} Wins!` : "AI Wins!");
    return;
  } else if (player2Pieces === 0) {
    showWinMessage(isMultiplayer ? `${player1Name} Wins!` : "You Win!");
    return;
  }
  if (!hasAnyMoves(currentPlayer)) {
    showWinMessage("It's a Draw!");
  }
}

function showWinMessage(message) {
  document.getElementById('message').textContent = message;
  document.getElementById('game').classList.add('hidden');
  document.getElementById('winLoseMessage').classList.remove('hidden');
}

function updateTurnIndicator() {
  const turnIndicator = document.getElementById('turnIndicator');
  if (isMultiplayer) {
    turnIndicator.textContent = currentPlayer === 1 ? `${player1Name}'s Turn` : `${player2Name}'s Turn`;
  } else {
    turnIndicator.textContent = currentPlayer === 1 ? "Your Turn" : "AI's Turn";
  }
}

function updateScoreboard() {
  document.getElementById('player1Score').textContent = `${player1Name} (You): ${player1Score + player1ScoreGroup}`;
  document.getElementById('player2Score').textContent = `${player2Name} (${isMultiplayer ? 'Player 2' : 'AI'}): ${player2Score + player2ScoreGroup}`;
}

function clearHighlights() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.classList.remove('highlight');
  });
}

function hasAnyMoves(player) {
  const moves = getAllPossibleMoves(player);
  return moves.length > 0;
}

function showInstructions() {
  const instructions = document.createElement('div');
  instructions.id = 'instructions';
  instructions.classList.add('container');
  instructions.innerHTML = `
    <h1>How to Play Neon Checkers</h1>
    <p>Kinging: Reach the opposite end of the board to king a piece. Kings can move in any direction.</p>
    <p>Capturing: Jump over an opponent's piece to capture it. Multiple captures are allowed in one turn.</p>
    <p>Moving: Pieces move diagonally forward. Kings can move diagonally in any direction.</p>
    <button id="closeInstructions">Close</button>
  `;
  document.body.appendChild(instructions);
  document.getElementById('closeInstructions').addEventListener('click', () => {
    instructions.classList.add('hidden');
  });
}

document.getElementById('userForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  if (name) {
    player1Name = name;
    document.getElementById('userName').textContent = name;
    document.getElementById('homepage').classList.add('hidden');
    document.getElementById('overview').classList.remove('hidden');
  }
});

document.getElementById('proceedBtn').addEventListener('click', () => {
  document.getElementById('overview').classList.add('hidden');
  document.getElementById('modeSelection').classList.remove('hidden');
});

document.getElementById('playWithAI').addEventListener('click', () => {
  isMultiplayer = false;
  document.getElementById('modeSelection').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  initializeBoard();
});

document.getElementById('playMultiplayer').addEventListener('click', () => {
  isMultiplayer = true;
  document.getElementById('modeSelection').classList.add('hidden');
  document.getElementById('multiplayerNames').classList.remove('hidden');
});

document.getElementById('multiplayerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const p1 = document.getElementById('player1').value.trim();
  const p2 = document.getElementById('player2').value.trim();
  if (p1 && p2) {
    player1Name = p1;
    player2Name = p2;
    document.getElementById('multiplayerNames').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    initializeBoard();
  }
});

document.getElementById('resetGame').addEventListener('click', () => {
  initializeBoard();
});

document.getElementById('playAgain').addEventListener('click', () => {
  document.getElementById('winLoseMessage').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  initializeBoard();
});

document.getElementById('backToHome').addEventListener('click', () => {
  document.getElementById('overview').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
});

document.getElementById('backToOverview').addEventListener('click', () => {
  document.getElementById('modeSelection').classList.add('hidden');
  document.getElementById('overview').classList.remove('hidden');
});

document.getElementById('backToModeSelectionFromGame').addEventListener('click', () => {
  document.getElementById('game').classList.add('hidden');
  document.getElementById('modeSelection').classList.remove('hidden');
  smoothTransition('modeSelection');
});

document.getElementById('backToModeSelectionFromWin').addEventListener('click', () => {
  document.getElementById('winLoseMessage').classList.add('hidden');
  document.getElementById('modeSelection').classList.remove('hidden');
  smoothTransition('modeSelection');
});

window.onload = () => {
  const theme = localStorage.getItem('theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.innerHTML = '&#9728;';
  } else {
    document.body.classList.remove('light-theme');
    themeToggle.innerHTML = '&#9790;';
  }
};

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  themeToggle.innerHTML = isLight ? '&#9728;' : '&#9790;';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  renderPieces();
});

function smoothTransition(elementId) {
  const element = document.getElementById(elementId);
  element.style.transition = 'opacity 0.5s ease-in-out';
  element.style.opacity = 0;
  setTimeout(() => {
    element.style.opacity = 1;
  }, 500);
}

document.getElementById('overview').addEventListener('transitionend', () => {
  smoothTransition('overview');
});

document.getElementById('modeSelection').addEventListener('transitionend', () => {
  smoothTransition('modeSelection');
});

document.getElementById('multiplayerNames').addEventListener('transitionend', () => {
  smoothTransition('multiplayerNames');
});

document.getElementById('game').addEventListener('transitionend', () => {
  smoothTransition('game');
});

document.getElementById('winLoseMessage').addEventListener('transitionend', () => {
  smoothTransition('winLoseMessage');
});
