import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const Header = forwardRef(function Header(_, ref){
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountScoreX, setAccountScoreX] = useState(0)
  const [accountScoreO, setAccountScoreO] = useState(0)
  const [accountScoreDraws, setAccountScoreDraws] = useState(0)
  const googleLoaded = useRef(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try{
        const s = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
        if (s.ok){
          const stats = await s.json()
          setAccountScoreX(stats.wins_x || 0)
          setAccountScoreO(stats.wins_o || 0)
          setAccountScoreDraws(stats.draws || 0)
        }
      }catch(e){}
    }
  }))

  // load Google script
  useEffect(()=>{
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
        const container = document.getElementById('google-signin-button')
        const token = localStorage.getItem('token')
        if (token){
          ;(async () => {
            try{
              const me = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
              if (me.ok){
                const u = await me.json()
                setUser(u)
                const s = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
                if (s.ok){ const stats = await s.json(); setAccountScoreX(stats.wins_x||0); setAccountScoreO(stats.wins_o||0); setAccountScoreDraws(stats.draws||0) }
                return
              }
            }catch(e){ }
            if (container) window.google.accounts.id.renderButton(container, { theme:'outline', size:'medium' })
          })()
        } else {
          if (container) window.google.accounts.id.renderButton(container, { theme:'outline', size:'medium' })
        }
      }
    }
    document.body.appendChild(script)
  }, [clientId])

  async function handleCredentialResponse(resp){
    const id_token = resp.credential
    try{
      const r = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/auth/google`, {
        method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id_token })
      })
      if (!r.ok) throw new Error('auth failed')
      const data = await r.json()
      localStorage.setItem('token', data.token)
      // clear google button while we fetch profile
      try{ const el = document.getElementById('google-signin-button'); if (el) el.innerHTML = '' }catch(e){}
      try{
        const me = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/me`, { headers: { Authorization: `Bearer ${data.token}` } })
        if (me.ok){ const u = await me.json(); setUser(u) }
        else setUser(data.user)
        const s = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats`, { headers: { Authorization: `Bearer ${data.token}` } })
        if (s.ok){ const stats = await s.json(); setAccountScoreX(stats.wins_x||0); setAccountScoreO(stats.wins_o||0); setAccountScoreDraws(stats.draws||0) }
      }catch(e){ setUser(data.user) }
    }catch(e){ console.error(e) }
  }

  function logout(){
    localStorage.removeItem('token')
    setUser(null)
    setAccountScoreX(0)
    setAccountScoreO(0)
    setAccountScoreDraws(0)
    if (googleLoaded.current && window.google){
      requestAnimationFrame(() => {
        const container = document.getElementById('google-signin-button')
        if (container) container.innerHTML = ''
        try{ window.google.accounts.id.renderButton(container, { theme:'outline', size:'medium' }) }catch(e){}
      })
    }
  }

  async function resetStats(){
    const token = localStorage.getItem('token')
    if (!token) return
    try{
      const r = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/stats/reset`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (r.ok){ const stats = await r.json(); setAccountScoreX(stats.wins_x||0); setAccountScoreO(stats.wins_o||0); setAccountScoreDraws(stats.draws||0) }
    }catch(e){}
    setMenuOpen(false)
  }

  function exportStats(){
    const payload = { user: user || null, stats: { wins_x: accountScoreX, wins_o: accountScoreO, draws: accountScoreDraws } }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2))
    const dl = document.createElement('a')
    dl.setAttribute('href', dataStr)
    dl.setAttribute('download', `tik-tac-toe-stats-${user && user.email ? user.email : 'guest'}.json`)
    dl.click()
    setMenuOpen(false)
  }

  return (
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
                <div style={{fontSize:11,color:'#666'}}>Account: X {accountScoreX} • O {accountScoreO} • D {accountScoreDraws}</div>
              </div>
              <button onClick={logout} style={{padding:'6px 8px',borderRadius:8,border:'none',cursor:'pointer'}}>Logout</button>
              {menuOpen && (
                <div style={{position:'absolute',right:0,top:56,background:'#fff',border:'1px solid #ddd',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.08)',padding:8,zIndex:20}}>
                  <button onClick={resetStats} style={{display:'block',width:200,textAlign:'left',padding:8,border:'none',background:'transparent',cursor:'pointer'}}>Reset stats</button>
                  <button onClick={exportStats} style={{display:'block',width:200,textAlign:'left',padding:8,border:'none',background:'transparent',cursor:'pointer'}}>Export stats</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
})

export default Header
