import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App integration', () => {
  it('plays a game and updates session scoreboard for X', async () => {
    render(<App />)
    const buttons = await screen.findAllByLabelText(/square/i)
    // play moves: X:0, O:3, X:1, O:4, X:2 -> X wins
    await userEvent.click(buttons[0])
    await userEvent.click(buttons[3])
    await userEvent.click(buttons[1])
    await userEvent.click(buttons[4])
    await userEvent.click(buttons[2])

    // scoreboard should show X: 1
    const xBox = await screen.findByText(/X:\s*1/) 
    expect(xBox).toBeDefined()
  })
})
