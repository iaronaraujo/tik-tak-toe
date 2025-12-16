const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const db = require('./db')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4000
// support comma-separated client IDs (e.g. webClientId,otherClientId)
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_ID || '').split(',').map(s=>s.trim()).filter(Boolean)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const client = new OAuth2Client(GOOGLE_CLIENT_IDS[0] || '')

// db exposes async helpers using lowdb
async function getOrCreateUser(googleId, email, name, picture){
  return await db.getOrCreateUser(googleId, email, name, picture)
}

app.post('/api/auth/google', async (req, res) => {
  const { id_token } = req.body
  if (!id_token) return res.status(400).json({error: 'id_token required'})
  try{
    // verifyIdToken accepts an array of audiences; pass configured client IDs
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: (GOOGLE_CLIENT_IDS.length ? GOOGLE_CLIENT_IDS : undefined) })
    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload
    const user = await getOrCreateUser(googleId, email, name, picture)
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' })
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  }catch(err){
    console.error(err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

app.get('/api/me', authMiddleware, (req, res) => {
  const u = db.getUserById ? db.getUserById(req.userId) : null
  if (!u) return res.status(404).json({ error: 'not found' })
  res.json({ id: u.id, email: u.email, name: u.name, picture: u.picture })
})

// middleware to authenticate
function authMiddleware(req, res, next){
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({error:'missing token'})
  const token = auth.slice(7)
  try{
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    next()
  }catch(e){
    return res.status(401).json({ error: 'invalid token' })
  }
}

app.get('/api/stats', authMiddleware, async (req, res) => {
  const stats = await db.getStats(req.userId)
  res.json(stats)
})

app.post('/api/stats/increment', authMiddleware, async (req, res) => {
  const { result } = req.body // 'X' | 'O' | 'DRAW'
  if (!result) return res.status(400).json({ error: 'result is required' })
  const stats = await db.incrementStat(req.userId, result)
  res.json(stats)
})

app.post('/api/stats/reset', authMiddleware, async (req, res) => {
  const stats = await db.resetStats(req.userId)
  res.json(stats)
})

app.listen(PORT, () => console.log('Server running on', PORT))
