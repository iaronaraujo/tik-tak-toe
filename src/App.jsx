import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Toolbar from './components/Toolbar'
import { calculateWinner, findBestMove } from './game'
import { playClickSound, playWinSound, playDrawSound } from './audio'
import Header from './components/Header'

// Google sign-in will be handled here and token stored in localStorage

export default function App(){
  const headerRef = useRef(null)

  // nothing auth-related here; header handles profile and account stats
  const [menuOpen, setMenuOpen] = useState(false)
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('HUMAN'); // 'HUMAN' or 'AI'
  const [aiPlays, setAiPlays] = useState('O'); // AI plays 'O' or 'X'

  // Score tracking
  // session scores: only for the current browser session and shown in the board/toolbar
  const [sessionScoreX, setSessionScoreX] = useState(0);
  const [sessionScoreO, setSessionScoreO] = useState(0);
  const [sessionScoreDraws, setSessionScoreDraws] = useState(0);
  // account scores are handled inside the Header component
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

  // increment session scores once per finished game and persist to account
  useEffect(() => {
    if (winner && lastOutcomeRef.current !== winner){
      if (winner === 'X') setSessionScoreX(s => s + 1);
      if (winner === 'O') setSessionScoreO(s => s + 1);
      lastOutcomeRef.current = winner;
      // persist to backend if logged in and refresh account scores
      const token = localStorage.getItem('token')
      if (token){
        fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats/increment`, {
          method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ result: winner })
        }).then(async r => {
          if (r.ok){
            try{ headerRef.current && headerRef.current.refresh && headerRef.current.refresh() }catch(e){}
          }
        }).catch(()=>{})
      }
    } else if (isDraw && lastOutcomeRef.current !== 'DRAW'){
      setSessionScoreDraws(s => s + 1);
      lastOutcomeRef.current = 'DRAW';
      const token = localStorage.getItem('token')
      if (token){
        fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats/increment`, {
          method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ result: 'DRAW' })
        }).then(async r => { if (r.ok){ try{ headerRef.current && headerRef.current.refresh && headerRef.current.refresh() }catch(e){} } }).catch(()=>{})
      }
    }
  }, [winner, isDraw]);

  return (
    <div className="app-root">
      <Header ref={headerRef} />

      <main className="game-card">
        <div className="game">
      <Toolbar mode={mode} setMode={setMode} aiPlays={aiPlays} setAiPlays={setAiPlays} scoreX={sessionScoreX} scoreO={sessionScoreO} scoreDraws={sessionScoreDraws} />

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


