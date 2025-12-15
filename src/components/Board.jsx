import React from 'react'
import Square from './Square'

export default function Board({ squares, onSquareClick }){
  return (
    <div className="board">
      {squares.map((s,i) => (
        <Square key={i} value={s} onClick={() => onSquareClick(i)} />
      ))}
    </div>
  );
}
