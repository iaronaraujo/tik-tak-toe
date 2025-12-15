export function calculateWinner(squares) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export function findBestMove(squares, aiPlayer){
  const human = aiPlayer === 'X' ? 'O' : 'X';
  function availableMoves(b){
    return b.map((v,i) => v ? null : i).filter(v => v !== null);
  }

  function minimax(board, player){
    const winner = calculateWinner(board);
    if (winner === aiPlayer) return {score: 10};
    if (winner === human) return {score: -10};
    if (board.every(Boolean)) return {score: 0};

    const moves = [];
    for (const i of availableMoves(board)){
      const newBoard = board.slice();
      newBoard[i] = player;
      const result = minimax(newBoard, player === 'X' ? 'O' : 'X');
      moves.push({index: i, score: result.score});
    }

    if (player === aiPlayer){
      let best = moves[0];
      for (const m of moves) if (m.score > best.score) best = m;
      return best;
    } else {
      let best = moves[0];
      for (const m of moves) if (m.score < best.score) best = m;
      return best;
    }
  }

  const move = minimax(squares, aiPlayer);
  return move && move.index != null ? move.index : null;
}
