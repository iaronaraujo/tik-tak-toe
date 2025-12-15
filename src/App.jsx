import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Toolbar from './components/Toolbar'
import { calculateWinner, findBestMove } from './game'
import { playClickSound, playWinSound, playDrawSound } from './audio'

export default function App(){
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('HUMAN'); // 'HUMAN' or 'AI'
  const [aiPlays, setAiPlays] = useState('O'); // AI plays 'O' or 'X'

  // Score tracking (in-memory)
  const [scoreX, setScoreX] = useState(0);
  const [scoreO, setScoreO] = useState(0);
  const [scoreDraws, setScoreDraws] = useState(0);
  const lastOutcomeRef = useRef(null);

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

  // audio functions are imported from ./audio

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
    lastOutcomeRef.current = null;
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

  // increment in-memory scores once per finished game
  useEffect(() => {
    if (winner && lastOutcomeRef.current !== winner){
      if (winner === 'X') setScoreX(s => s + 1);
      if (winner === 'O') setScoreO(s => s + 1);
      lastOutcomeRef.current = winner;
    } else if (isDraw && lastOutcomeRef.current !== 'DRAW'){
      setScoreDraws(s => s + 1);
      lastOutcomeRef.current = 'DRAW';
    }
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
      <Toolbar mode={mode} setMode={setMode} aiPlays={aiPlays} setAiPlays={setAiPlays} scoreX={scoreX} scoreO={scoreO} scoreDraws={scoreDraws} />

      <div className="status">{winner ? <span className="winner">{status}</span> : status}</div>
      <Board squares={squares} onSquareClick={handleClick} />
      <div className="controls">
        <button className="reset" onClick={() => reset(true)}>Reset (X starts)</button>
        <button className="reset" style={{marginLeft:8}} onClick={() => reset(false)}>Reset (O starts)</button>
      </div>
        </div>
      </main>
    </div>
  );
}


