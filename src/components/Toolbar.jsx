import React from 'react'
import Scoreboard from './Scoreboard'

export default function Toolbar({ mode, setMode, aiPlays, setAiPlays, scoreX, scoreO, scoreDraws }){
  return (
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
      <Scoreboard x={scoreX} o={scoreO} draws={scoreDraws} />
    </div>
  )
}
