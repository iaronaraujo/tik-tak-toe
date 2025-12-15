import { describe, it, expect } from 'vitest'
import { calculateWinner, findBestMove } from '../game'

describe('calculateWinner', () => {
  it('detects row wins', () => {
    const b = ['X','X','X', null,null,null,null,null,null]
    expect(calculateWinner(b)).toBe('X')
  })

  it('returns null for no winner', () => {
    const b = [null,null,null,null,null,null,null,null,null]
    expect(calculateWinner(b)).toBeNull()
  })
})

describe('findBestMove', () => {
  it('finds winning move for AI', () => {
    const b = ['X','X',null, 'O','O',null, null,null,null]
    // if AI is X, it should play at 2 to win
    expect(findBestMove(b, 'X')).toBe(2)
  })

  it('blocks opponent immediate win', () => {
    const b = ['X','X',null, 'O',null,null, null,null,null]
    // if AI is O, it should block X at 2
    expect(findBestMove(b, 'O')).toBe(2)
  })
})
