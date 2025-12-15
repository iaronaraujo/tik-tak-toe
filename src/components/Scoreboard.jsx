import React from 'react'

export default function Scoreboard({ x, o, draws }){
  return (
    <div className="scoreboard" aria-live="polite">
      <div className="scorebox">X: {x}</div>
      <div className="scorebox">O: {o}</div>
      <div className="scorebox">Draws: {draws}</div>
    </div>
  );
}
