const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'data.json')

function readData(){
  if (!fs.existsSync(file)) {
    const base = { users: [], stats: {} }
    fs.writeFileSync(file, JSON.stringify(base, null, 2))
    return base
  }
  const raw = fs.readFileSync(file, 'utf8')
  try{ return JSON.parse(raw) }catch(e){
    const base = { users: [], stats: {} }
    fs.writeFileSync(file, JSON.stringify(base, null, 2))
    return base
  }
}

function writeData(data){
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function getUserByGoogleId(googleId){
  const data = readData()
  return data.users.find(u => u.google_id === googleId)
}

function createUser(googleId, email, name, picture){
  const data = readData()
  const id = (data.users.length ? Math.max(...data.users.map(u=>u.id)) : 0) + 1
  const user = { id, google_id: googleId, email, name, picture }
  data.users.push(user)
  data.stats[id] = { wins_x:0, wins_o:0, draws:0 }
  writeData(data)
  return user
}

function getOrCreateUser(googleId, email, name, picture){
  const u = getUserByGoogleId(googleId)
  if (u) return u
  return createUser(googleId, email, name, picture)
}

function getUserById(id){
  const data = readData()
  return data.users.find(u => u.id === id)
}

function ensureStats(userId){
  const data = readData()
  if (!data.stats[userId]){
    data.stats[userId] = { wins_x:0, wins_o:0, draws:0 }
    writeData(data)
  }
  return data.stats[userId]
}

function getStats(userId){
  ensureStats(userId)
  const data = readData()
  return data.stats[userId]
}

function incrementStat(userId, result){
  const data = readData()
  data.stats[userId] ||= { wins_x:0, wins_o:0, draws:0 }
  if (result === 'X') data.stats[userId].wins_x = (data.stats[userId].wins_x || 0) + 1
  else if (result === 'O') data.stats[userId].wins_o = (data.stats[userId].wins_o || 0) + 1
  else if (result === 'DRAW') data.stats[userId].draws = (data.stats[userId].draws || 0) + 1
  writeData(data)
  return data.stats[userId]
}

function resetStats(userId){
  const data = readData()
  data.stats[userId] = { wins_x:0, wins_o:0, draws:0 }
  writeData(data)
  return data.stats[userId]
}

module.exports = { getOrCreateUser, getUserByGoogleId, getUserById, getStats, incrementStat, resetStats }
