import React, { useState, useEffect, useRef } from 'react'

function calculateWinner(squares) {
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

function Square({ value, onClick }){
  return (
    <button className="square" onClick={onClick}>
      {value}
    </button>
  );
}

export default function App(){
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('HUMAN'); // 'HUMAN' or 'AI'
  const [aiPlays, setAiPlays] = useState('O'); // AI plays 'O' or 'X'

  useEffect(() => {
    const winner = calculateWinner(squares);
    const aiTurn = mode === 'AI' && !winner && ((aiPlays === 'X' && xIsNext) || (aiPlays === 'O' && !xIsNext));
    if (aiTurn) {
      const t = setTimeout(() => {
        const move = findBestMove(squares, aiPlays);
        if (move != null) makeMove(move);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [squares, xIsNext, mode, aiPlays]);

  // Audio (WebAudio) — create on demand
  const audioRef = useRef(null);
  function getAudioCtx(){
    if (!audioRef.current){
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioRef.current = new AudioCtx();
    }
    return audioRef.current;
  }

  function playClickSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    o.start(now);
    o.stop(now + 0.18);
  }

  function playWinSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [660, 880, 1100];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(g); g.connect(ctx.destination);
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.start(t);
      o.stop(t + 0.3);
    });
  }

  function playDrawSound(){
    const ctx = getAudioCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 320;
    o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.start(now);
    o.stop(now + 0.24);
  }

  function makeMove(i){
    setSquares(prev => {
      const newSquares = prev.slice();
      newSquares[i] = xIsNext ? 'X' : 'O';
      return newSquares;
    });
    setXIsNext(prev => !prev);
    // play click sound for both human and AI moves
    try{ playClickSound(); }catch(e){}
  }

  function handleClick(i){
    if (squares[i] || calculateWinner(squares)) return;
    // if AI mode and it's AI's turn, ignore clicks
    const aiTurn = mode === 'AI' && ((aiPlays === 'X' && xIsNext) || (aiPlays === 'O' && !xIsNext));
    if (aiTurn) return;
    makeMove(i);
  }

  function reset(startX = true){
    setSquares(Array(9).fill(null));
    setXIsNext(startX);
  }

  const winner = calculateWinner(squares);
  const isDraw = !winner && squares.every(Boolean);
  let status;
  if (winner) status = `Winner: ${winner}`;
  else if (isDraw) status = 'Draw';
  else status = `Next player: ${xIsNext ? 'X' : 'O'}`;

  // play sounds for end states
  useEffect(() => {
    if (winner) playWinSound();
    else if (isDraw) playDrawSound();
  }, [winner, isDraw]);

  return (
    <div className="app-root">
      <header className="rbx-header">
        <div className="rbx-inner">
          <div className="rbx-logo">R</div>
          <div className="rbx-title">Tik-Tac-Toe</div>
          <div className="rbx-spacer" />
        </div>
      </header>

      <main className="game-card">
        <div className="game">
      <div className="toolbar">
        <div className="mode">
          <div className="label">Mode</div>
          <label><input type="radio" name="mode" value="HUMAN" checked={mode==='HUMAN'} onChange={() => setMode('HUMAN')} /> Human vs Human</label>
          <label><input type="radio" name="mode" value="AI" checked={mode==='AI'} onChange={() => setMode('AI')} /> Human vs AI</label>
        </div>
        <div className="aiselect">
          <div className="label">AI plays</div>
          <label><input type="radio" name="ai" value="X" checked={aiPlays==='X'} onChange={() => setAiPlays('X')} /> X</label>
          <label><input type="radio" name="ai" value="O" checked={aiPlays==='O'} onChange={() => setAiPlays('O')} /> O</label>
        </div>
      </div>

      <div className="status">{winner ? <span className="winner">{status}</span> : status}</div>
      <div className="board">
        {squares.map((s,i) => (
          <Square key={i} value={s} onClick={() => handleClick(i)} />
        ))}
      </div>
      <div className="controls">
        <button className="reset" onClick={() => reset(true)}>Reset (X starts)</button>
        <button className="reset" style={{marginLeft:8}} onClick={() => reset(false)}>Reset (O starts)</button>
      </div>
        </div>
      </main>
    </div>
  );
}

// Minimax AI
function findBestMove(squares, aiPlayer){
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
      // maximize
      let best = moves[0];
      for (const m of moves) if (m.score > best.score) best = m;
      return best;
    } else {
      // minimize
      let best = moves[0];
      for (const m of moves) if (m.score < best.score) best = m;
      return best;
    }
  }

  const move = minimax(squares, aiPlayer);
  return move && move.index != null ? move.index : null;
}
