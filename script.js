// Game State Variables
let currentPlayer = 1; // 1 for Player 1, 2 for Player 2 (AI or Multiplayer)
let boardState = Array(8).fill().map(() => Array(8).fill(null)); // 8x8 board initialized with null
let selectedPiece = null; // Track selected piece for movement
let isMultiplayer = false; // Flag to track game mode
let player1Name = "Player 1"; // Default Player 1 name
let player2Name = "Player 2"; // Default Player 2 name
let player1Score = 0; // Player 1 score
let player2Score = 0; // Player 2 score
let player1ScoreGroup = 0; // Player 1 group score
let player2ScoreGroup = 0; // Player 2 group score

// Theme Toggle Elements
const themeToggle = document.getElementById('themeToggle');

/**
 * Initializes the game board by setting up pieces and resetting scores.
 */
function initializeBoard() {
  const board = document.getElementById('board');
  board.innerHTML = ''; // Clear existing board
  boardState = Array(8).fill().map(() => Array(8).fill(null)); // Reset board state
  player1Score = 0;
  player2Score = 0;
  player1ScoreGroup = 0;
  player2ScoreGroup = 0;
  updateScoreboard(); // Update score display

  // Populate the board with pieces
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      if ((row + col) % 2 !== 0) {
        cell.classList.add('dark'); // Dark cells where pieces can be placed
      } else {
        cell.classList.add('light'); // Light cells
      }
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', () => handleCellClick(row, col));
      board.appendChild(cell);

      // Add Player 1 pieces
      if (row < 3 && (row + col) % 2 !== 0) {
        boardState[row][col] = { player: 2, king: false };
      }
      // Add Player 2 pieces
      else if (row > 4 && (row + col) % 2 !== 0) {
        boardState[row][col] = { player: 1, king: false };
      }
    }
  }
  renderPieces(); // Display pieces on the board
  updateTurnIndicator(); // Update whose turn it is
}

/**
 * Renders the pieces on the board based on the current board state.
 */
function renderPieces() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const piece = boardState[row][col];
    cell.innerHTML = ''; // Clear existing piece

    if (piece) {
      const pieceElement = document.createElement('div');
      pieceElement.classList.add('piece', `player${piece.player}`);
      if (piece.king) {
        pieceElement.classList.add('king'); // Add king class if piece is a king
      }
      if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
        pieceElement.classList.add('selected'); // Highlight selected piece
      }

      pieceElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent cell click event
        handlePieceClick(row, col);
      });

      cell.appendChild(pieceElement);
    }
  });
}

/**
 * Handles the selection of a piece.
 * @param {number} row - The row of the selected piece.
 * @param {number} col - The column of the selected piece.
 */
function handlePieceClick(row, col) {
  const piece = boardState[row][col];
  if (piece && piece.player === currentPlayer) {
    // Deselect if the same piece is clicked again
    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
      selectedPiece = null;
      clearHighlights();
      renderPieces();
      return;
    }

    // If there are capture moves available, enforce capture selection
    const mandatoryCaptures = getMandatoryCaptures();
    if (mandatoryCaptures.length > 0 && !isCaptureMove(row, col, mandatoryCaptures)) {
      // Show the capture message
      const captureMessage = document.getElementById('captureMessage');
      captureMessage.classList.remove('hidden');
      setTimeout(() => {
        captureMessage.classList.add('hidden');
      }, 2000); // Hide the message after 2 seconds
      return;
    }

    selectedPiece = { row, col };
    highlightPossibleMoves(row, col); // Highlight valid moves
    renderPieces();
  }
}

/**
 * Highlights possible moves for the selected piece, allowing multiple row movements for kings.
 * @param {number} row - The row of the selected piece.
 * @param {number} col - The column of the selected piece.
 */
function highlightPossibleMoves(row, col) {
  const piece = boardState[row][col];
  if (!piece) return;

  clearHighlights(); // Remove previous highlights

  const directions = getAllowedDirections(piece);

  directions.forEach(dir => {
    let newRow = row + dir.row;
    let newCol = col + dir.col;

    while (isWithinBounds(newRow, newCol) && !boardState[newRow][newCol]) {
      // Highlight the cell if it's empty
      const cell = document.querySelector(`.cell[data-row="${newRow}"][data-col="${newCol}"]`);
      if (cell) {
        cell.classList.add('highlight');
      }

      if (!piece.king) break; // Regular pieces move only one step

      newRow += dir.row;
      newCol += dir.col;
    }

    // Check for capture moves in the same direction
    let captureRow = row + 2 * dir.row;
    let captureCol = col + 2 * dir.col;

    if (isValidMove(row, col, captureRow, captureCol, piece, true)) {
      const captureCell = document.querySelector(`.cell[data-row="${captureRow}"][data-col="${captureCol}"]`);
      if (captureCell) {
        captureCell.classList.add('highlight');
      }
    }
  });
}

/**
 * Retrieves allowed movement directions based on whether the piece is a king.
 * @param {Object} piece - The piece object.
 * @returns {Array} - Array of direction objects with row and col increments.
 */
function getAllowedDirections(piece) {
  if (piece.king) {
    return [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 }
    ];
  } else {
    // Regular pieces can only move forward
    const direction = piece.player === 1 ? -1 : 1;
    return [
      { row: direction, col: -1 },
      { row: direction, col: 1 }
    ];
  }
}

/**
 * Checks if the given position is within the board bounds.
 * @param {number} row 
 * @param {number} col 
 * @returns {boolean}
 */
function isWithinBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Handles a cell click event to move a selected piece.
 * @param {number} row - The row of the clicked cell.
 * @param {number} col - The column of the clicked cell.
 */
function handleCellClick(row, col) {
  if (selectedPiece) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell.classList.contains('highlight')) {
      // Perform the move
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

      // If playing against AI and it's AI's turn, make AI move
      if (!isMultiplayer && currentPlayer === 2) {
        setTimeout(makeAIMove, 500); // AI moves after a short delay
      }
    } else {
      // Deselect if the clicked cell is not a valid move
      selectedPiece = null;
      clearHighlights();
      renderPieces();
    }
  }
}

/**
 * Moves a piece from one cell to another, handling captures and kinging.
 * @param {number} fromRow - The original row of the piece.
 * @param {number} fromCol - The original column of the piece.
 * @param {number} toRow - The destination row.
 * @param {number} toCol - The destination column.
 */
function movePiece(fromRow, fromCol, toRow, toCol) {
  const piece = boardState[fromRow][fromCol];
  if (!piece) return;

  // Move the piece to the new cell
  boardState[toRow][toCol] = piece;
  boardState[fromRow][fromCol] = null;

  // King the piece if it reaches the opposite end
  if ((toRow === 0 && piece.player === 1) || (toRow === 7 && piece.player === 2)) {
    piece.king = true;
  }

  // Handle captures if the move is a jump
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;

  if (Math.abs(rowDiff) === 2 || (piece.king && Math.abs(rowDiff) > 2)) {
    const midRow = Math.floor((fromRow + toRow) / 2);
    const midCol = Math.floor((fromCol + toCol) / 2);
    const capturedPiece = boardState[midRow][midCol];
    if (capturedPiece) {
      boardState[midRow][midCol] = null; // Remove captured piece

      // Update group scores based on which player made the capture
      if (piece.player === 1) {
        player1ScoreGroup++;
      } else {
        player2ScoreGroup++;
      }
      updateScoreboard();
    }

    // Check for additional captures with the moved piece
    const additionalCaptures = getValidCaptures(toRow, toCol, piece);
    if (additionalCaptures.length > 0) {
      selectedPiece = { row: toRow, col: toCol };
      highlightPossibleCaptures(toRow, toCol);
      renderPieces();
      return; // Player gets another turn after capture
    }
  }

  // Switch turns between players
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateTurnIndicator();
}

/**
 * Checks if the selected move is among the mandatory capture moves.
 * @param {number} row - The row of the selected piece.
 * @param {number} col - The column of the selected piece.
 * @param {Array} mandatoryCaptures - Array of mandatory capture moves.
 * @returns {boolean} - True if the move is a capture, else false.
 */
function isCaptureMove(row, col, mandatoryCaptures) {
  return mandatoryCaptures.some(capture => capture.fromRow === row && capture.fromCol === col);
}

/**
 * Retrieves all mandatory capture moves for the current player.
 * @returns {Array} - Array of mandatory capture move objects.
 */
function getMandatoryCaptures() {
  const captures = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece && piece.player === currentPlayer) {
        const validCaptures = getValidCaptures(row, col, piece);
        if (validCaptures.length > 0) {
          captures.push({ fromRow: row, fromCol: col });
        }
      }
    }
  }
  return captures;
}

/**
 * Retrieves all valid capture moves for a specific piece.
 * @param {number} row - The row of the piece.
 * @param {number} col - The column of the piece.
 * @param {Object} piece - The piece object.
 * @returns {Array} - Array of valid capture move objects.
 */
function getValidCaptures(row, col, piece) {
  const captures = [];
  const directions = getAllowedDirections(piece);

  directions.forEach(dir => {
    const midRow = row + dir.row;
    const midCol = col + dir.col;
    const jumpRow = row + 2 * dir.row;
    const jumpCol = row + 2 * dir.col;

    if (isValidMove(row, col, jumpRow, jumpCol, piece, true)) {
      captures.push({ toRow: jumpRow, toCol: jumpCol });
    }
  });

  return captures;
}

/**
 * Highlights only the capture moves for the selected piece.
 * @param {number} row - The row of the selected piece.
 * @param {number} col - The column of the selected piece.
 */
function highlightPossibleCaptures(row, col) {
  const piece = boardState[row][col];
  if (!piece) return;

  clearHighlights(); // Remove previous highlights

  const captures = getValidCaptures(row, col, piece);
  captures.forEach(capture => {
    const cell = document.querySelector(`.cell[data-row="${capture.toRow}"][data-col="${capture.toCol}"]`);
    if (cell) {
      cell.classList.add('highlight'); // Highlight capture move
    }
  });
}

/**
 * Checks if a move is valid.
 * @param {number} fromRow - The original row of the piece.
 * @param {number} fromCol - The original column of the piece.
 * @param {number} toRow - The destination row.
 * @param {number} toCol - The destination column.
 * @param {Object} piece - The piece being moved.
 * @param {boolean} isCapture - Indicates if the move is a capture.
 * @returns {boolean} - True if the move is valid, else false.
 */
function isValidMove(fromRow, fromCol, toRow, toCol, piece, isCapture = false) {
  if (!piece) return false;

  // Check if the destination is within bounds
  if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

  // Check if the destination cell is empty
  if (boardState[toRow][toCol]) return false;

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;

  // Determine allowed directions based on piece type
  const allowedDirections = getAllowedDirections(piece);

  // Check if the move direction is allowed
  const isDirectionAllowed = allowedDirections.some(dir => {
    return isCapture
      ? dir.row * 2 === rowDiff && dir.col * 2 === colDiff
      : dir.row === rowDiff && dir.col === colDiff;
  });
  if (!isDirectionAllowed) return false;

  // Regular move
  if (!isCapture) {
    return Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1;
  }

  // Capture move (jump over opponent's piece)
  if (isCapture) {
    if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const midRow = fromRow + rowDiff / 2;
      const midCol = fromCol + colDiff / 2;
      const midPiece = boardState[midRow][midCol];
      return midPiece && midPiece.player !== piece.player;
    }

    // Handle multiple-row captures for kings
    if (piece.king && Math.abs(rowDiff) > 2 && Math.abs(colDiff) > 2) {
      let currentRow = fromRow + (rowDiff > 0 ? 1 : -1);
      let currentCol = fromCol + (colDiff > 0 ? 1 : -1);
      let hasOpponentPiece = false;

      while (currentRow !== toRow && currentCol !== toCol) {
        const currentPiece = boardState[currentRow][currentCol];
        if (currentPiece) {
          if (currentPiece.player !== piece.player) {
            hasOpponentPiece = true;
          } else {
            return false; // Cannot jump over own piece
          }
        }
        currentRow += (rowDiff > 0 ? 1 : -1);
        currentCol += (colDiff > 0 ? 1 : -1);
      }

      return hasOpponentPiece;
    }
  }

  return false;
}

/**
 * AI Move Logic - Makes a move for the AI player.
 * The AI prioritizes capture moves and selects the move that maximizes its advantage.
 */
function makeAIMove() {
  const moves = getAllPossibleMoves(2); // AI is Player 2
  if (moves.length === 0) {
    // No possible moves for AI
    checkWinCondition();
    return;
  }

  // Prioritize capture moves
  const captureMoves = moves.filter(move => move.isCapture);

  let selectedMove;

  if (captureMoves.length > 0) {
    // From capture moves, select the move that results in the most captures
    selectedMove = selectBestCaptureMove(captureMoves);
  } else {
    // If no capture moves, select a regular move
    selectedMove = selectBestRegularMove(moves);
  }

  movePiece(selectedMove.fromRow, selectedMove.fromCol, selectedMove.toRow, selectedMove.toCol);
  renderPieces();
  checkWinCondition();
}

/**
 * Selects the best capture move based on additional criteria.
 * @param {Array} captureMoves - Array of possible capture moves.
 * @returns {Object} - The selected capture move.
 */
function selectBestCaptureMove(captureMoves) {
  // Example strategy: Select the move that captures the most pieces
  // For simplicity, we'll select the first available capture move
  return captureMoves[0];
}

/**
 * Selects the best regular move.
 * @param {Array} regularMoves - Array of possible regular moves.
 * @returns {Object} - The selected regular move.
 */
function selectBestRegularMove(regularMoves) {
  // Example strategy: Move towards the center or prioritize creating kings
  // For simplicity, we'll select a random regular move
  return regularMoves[Math.floor(Math.random() * regularMoves.length)];
}

/**
 * Retrieves all possible moves for a given player.
 * @param {number} player - The player number (1 or 2).
 * @returns {Array} - Array of possible move objects.
 */
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

          // Capture move
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

/**
 * Checks for win or draw conditions after each move.
 */
function checkWinCondition() {
  const player1Pieces = boardState.flat().filter(piece => piece && piece.player === 1).length;
  const player2Pieces = boardState.flat().filter(piece => piece && piece.player === 2).length;

  // Check if Player 1 has no pieces left
  if (player1Pieces === 0) {
    showWinMessage(isMultiplayer ? `${player2Name} Wins!` : "AI Wins!");
    return;
  }
  // Check if Player 2 has no pieces left
  else if (player2Pieces === 0) {
    showWinMessage(isMultiplayer ? `${player1Name} Wins!` : "You Win!");
    return;
  }

  // Check for draw condition (no possible moves)
  if (!hasAnyMoves(currentPlayer)) {
    showWinMessage("It's a Draw!");
  }
}

/**
 * Displays the win/lose/draw message to the user.
 * @param {string} message - The message to display.
 */
function showWinMessage(message) {
  document.getElementById('message').textContent = message;
  document.getElementById('game').classList.add('hidden');
  document.getElementById('winLoseMessage').classList.remove('hidden');
}

/**
 * Updates the turn indicator to show whose turn it is.
 */
function updateTurnIndicator() {
  const turnIndicator = document.getElementById('turnIndicator');
  if (isMultiplayer) {
    turnIndicator.textContent = currentPlayer === 1 ? `${player1Name}'s Turn` : `${player2Name}'s Turn`;
  } else {
    turnIndicator.textContent = currentPlayer === 1 ? "Your Turn" : "AI's Turn";
  }
}

/**
 * Updates the scoreboard with the latest scores, including group scores.
 */
function updateScoreboard() {
  document.getElementById('player1Score').textContent = `${player1Name} (You): ${player1Score + player1ScoreGroup}`;
  document.getElementById('player2Score').textContent = `${player2Name} (${isMultiplayer ? 'Player 2' : 'AI'}): ${player2Score + player2ScoreGroup}`;
}

/**
 * Clears all highlighted cells on the board.
 */
function clearHighlights() {
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.classList.remove('highlight');
  });
}

/**
 * Checks if the current player has any possible moves.
 * @param {number} player - The player number (1 or 2).
 * @returns {boolean} - True if there are possible moves, else false.
 */
function hasAnyMoves(player) {
  const moves = getAllPossibleMoves(player);
  return moves.length > 0;
}

/**
 * Handles the homepage form submission to start the game.
 */
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

/**
 * Handles the proceed button to move from overview to mode selection.
 */
document.getElementById('proceedBtn').addEventListener('click', () => {
  document.getElementById('overview').classList.add('hidden');
  document.getElementById('modeSelection').classList.remove('hidden');
});

/**
 * Handles the selection to play against AI.
 */
document.getElementById('playWithAI').addEventListener('click', () => {
  isMultiplayer = false;
  document.getElementById('modeSelection').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  initializeBoard();
});

/**
 * Handles the selection to play multiplayer.
 */
document.getElementById('playMultiplayer').addEventListener('click', () => {
  isMultiplayer = true;
  document.getElementById('modeSelection').classList.add('hidden');
  document.getElementById('multiplayerNames').classList.remove('hidden');
});

/**
 * Handles the multiplayer form submission to set player names.
 */
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

/**
 * Handles resetting the game to its initial state.
 */
document.getElementById('resetGame').addEventListener('click', () => {
  initializeBoard();
});

/**
 * Handles the "Play Again" button after a game ends.
 */
document.getElementById('playAgain').addEventListener('click', () => {
  document.getElementById('winLoseMessage').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  initializeBoard();
});

/**
 * Handles navigating back to the homepage from the overview.
 */
document.getElementById('backToHome').addEventListener('click', () => {
  document.getElementById('overview').classList.add('hidden');
  document.getElementById('homepage').classList.remove('hidden');
});

/**
 * Handles navigating back to the overview from mode selection.
 */
document.getElementById('backToOverview').addEventListener('click', () => {
  document.getElementById('modeSelection').classList.add('hidden');
  document.getElementById('overview').classList.remove('hidden');
});

/**
 * Handles navigating back to mode selection from the multiplayer names form.
 */
document.getElementById('backToModeSelection').addEventListener('click', () => {
  document.getElementById('multiplayerNames').classList.add('hidden');
  document.getElementById('modeSelection').classList.remove('hidden');
});

/**
 * Handles navigating back to mode selection from the game view.
 */
document.getElementById('backToModeSelectionFromGame').addEventListener('click', () => {
  document.getElementById('game').classList.add('hidden');
  document.getElementById('modeSelection').classList.remove('hidden');
});

/**
 * Handles navigating back to mode selection from the win/lose/draw message.
 */
document.getElementById('backToModeSelectionFromWin').addEventListener('click', () => {
  document.getElementById('winLoseMessage').classList.add('hidden');
  document.getElementById('modeSelection').classList.remove('hidden');
});

/**
 * Initializes the board when the page loads.
 */
window.onload = () => {
  // Load theme preference
  const theme = localStorage.getItem('theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.innerHTML = '&#9728;'; // Sun icon
  } else {
    document.body.classList.remove('light-theme');
    themeToggle.innerHTML = '&#9790;'; // Moon icon
  }
};

/**
 * Handles theme toggling between dark and light modes.
 */
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  themeToggle.innerHTML = isLight ? '&#9728;' : '&#9790;'; // Sun or Moon icon
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  renderPieces(); // Re-render pieces to apply color changes
});
