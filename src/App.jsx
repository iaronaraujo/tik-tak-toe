import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Toolbar from './components/Toolbar'
import { calculateWinner, findBestMove } from './game'
import { playClickSound, playWinSound, playDrawSound } from './audio'

// Google sign-in will be handled here and token stored in localStorage

export default function App(){
  const [user, setUser] = useState(null)
  const googleLoaded = useRef(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  let userToken = null

  // load Google Identity Services and render button in header when needed
  useEffect(() => {
    if (!clientId) return
    if (googleLoaded.current) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      googleLoaded.current = true
      /* global google */
      if (window.google){
        window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse })
        userToken = localStorage.getItem('token')
        // render only if not logged in
        if (!userToken){
          window.google.accounts.id.renderButton(document.getElementById('google-signin-button'), { theme:'outline', size:'medium' })
        }
      }
    }
    document.body.appendChild(script)
  }, [clientId, userToken])

  async function handleCredentialResponse(resp){
    const id_token = resp.credential
    try{
      const r = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/auth/google`, {
        method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id_token })
      })
      if (!r.ok) throw new Error('auth failed')
      const data = await r.json()
      localStorage.setItem('token', data.token)
      // remove sign-in button immediately so UI updates while we fetch profile
      try{
        const el = document.getElementById('google-signin-button')
        if (el) el.innerHTML = ''
      }catch(e){}
      // fetch profile + stats
      try{
        const me = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/me`, { headers: { Authorization: `Bearer ${data.token}` } })
        if (me.ok){
          const u = await me.json()
          setUser(u)
        } else {
          setUser(data.user)
        }
        const s = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats`, { headers: { Authorization: `Bearer ${data.token}` } })
        if (s.ok){
          const stats = await s.json()
          // populate account scores
          setAccountScoreX(stats.wins_x || 0)
          setAccountScoreO(stats.wins_o || 0)
          setAccountScoreDraws(stats.draws || 0)
          lastOutcomeRef.current = null
        }
      }catch(e){
        setUser(data.user)
      }
    }catch(e){
      console.error(e)
    }
  }

  function logout(){
    localStorage.removeItem('token')
    setUser(null)
    // clear account scores on logout
    setAccountScoreX(0)
    setAccountScoreO(0)
    setAccountScoreDraws(0)
    // re-render google button if client loaded
    if (googleLoaded.current && window.google){
      // delay render until React has mounted the signin container
      requestAnimationFrame(() => {
        const container = document.getElementById('google-signin-button')
        if (container) container.innerHTML = ''
        try{
          window.google.accounts.id.renderButton(document.getElementById('google-signin-button'), { theme:'outline', size:'medium' })
        }catch(e){}
      })
    }
  }

  // on mount, if token exists show a simple logged state and fetch stats
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    setUser({ logged:true })
    ;(async ()=>{
      try{
        // fetch profile
        const me = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (me.ok){
          const u = await me.json()
          setUser(u)
        }
        const s = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
        if (s.ok){
          const stats = await s.json()
          setAccountScoreX(stats.wins_x || 0)
          setAccountScoreO(stats.wins_o || 0)
          setAccountScoreDraws(stats.draws || 0)
        }
      }catch(e){}
    })()
  }, [])
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
  // account scores: persisted in DB and shown in the header when logged in
  const [accountScoreX, setAccountScoreX] = useState(0);
  const [accountScoreO, setAccountScoreO] = useState(0);
  const [accountScoreDraws, setAccountScoreDraws] = useState(0);
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
            try{
              const s2 = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
              if (s2.ok){
                const stats2 = await s2.json()
                setAccountScoreX(stats2.wins_x || 0)
                setAccountScoreO(stats2.wins_o || 0)
                setAccountScoreDraws(stats2.draws || 0)
              }
            }catch(e){}
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
        }).then(async r => {
          if (r.ok){
            try{
              const s2 = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
              if (s2.ok){
                const stats2 = await s2.json()
                setAccountScoreX(stats2.wins_x || 0)
                setAccountScoreO(stats2.wins_o || 0)
                setAccountScoreDraws(stats2.draws || 0)
              }
            }catch(e){}
          }
        }).catch(()=>{})
      }
    }
  }, [winner, isDraw]);

  return (
    <div className="app-root">
      <header className="rbx-header">
        <div className="rbx-inner">
          <div className="rbx-logo">R</div>
          <div className="rbx-title">Tik-Tac-Toe</div>
          <div className="rbx-spacer" />
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {!user && clientId ? (
              <div id="google-signin-button" />
            ) : !clientId ? (
              <div style={{fontSize:12,color:'#888'}}>Set VITE_GOOGLE_CLIENT_ID to enable Google SSO</div>
            ) : (
              <div style={{display:'flex',gap:8,alignItems:'center',position:'relative'}}>
                {user && user.picture ? (
                  <img src={user.picture} alt="avatar" style={{width:36,height:36,borderRadius:18,objectFit:'cover',cursor:'pointer'}} onClick={()=>setMenuOpen(o=>!o)} />
                ) : (
                  <div style={{width:36,height:36,borderRadius:18,background:'#eee',display:'inline-block'}} onClick={()=>setMenuOpen(o=>!o)} />
                )}
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                  <div style={{fontSize:13}}>{user && user.name ? user.name : 'Signed in'}</div>
                  <div style={{fontSize:11,color:'#666'}}>
                    Account: X {accountScoreX} • O {accountScoreO} • D {accountScoreDraws}
                  </div>
                </div>
                <button onClick={logout} style={{padding:'6px 8px',borderRadius:8,border:'none',cursor:'pointer'}}>Logout</button>
                {menuOpen && (
                  <div style={{position:'absolute',right:0,top:56,background:'#fff',border:'1px solid #ddd',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.08)',padding:8,zIndex:20}}>
                    <button onClick={async ()=>{
                      const token = localStorage.getItem('token')
                      if (!token) return
                      try{
                        const r = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats/reset`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                        if (r.ok){
                          const stats = await r.json()
                          setAccountScoreX(stats.wins_x || 0)
                          setAccountScoreO(stats.wins_o || 0)
                          setAccountScoreDraws(stats.draws || 0)
                        }
                      }catch(e){ }
                      setMenuOpen(false)
                    }} style={{display:'block',width:200,textAlign:'left',padding:8,border:'none',background:'transparent',cursor:'pointer'}}>Reset stats</button>
                    <button onClick={() => {
                      const payload = { user: user || null, stats: { wins_x: accountScoreX, wins_o: accountScoreO, draws: accountScoreDraws } }
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2))
                      const dl = document.createElement('a')
                      dl.setAttribute('href', dataStr)
                      dl.setAttribute('download', `tik-tac-toe-stats-${user && user.email ? user.email : 'guest'}.json`)
                      dl.click()
                      setMenuOpen(false)
                    }} style={{display:'block',width:200,textAlign:'left',padding:8,border:'none',background:'transparent',cursor:'pointer'}}>Export stats</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

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


