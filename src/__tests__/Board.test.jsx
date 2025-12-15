import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Board from '../components/Board'

describe('Board component', () => {
  it('renders 9 squares and calls handler on click', async () => {
    const squares = Array(9).fill(null)
    const handle = vi.fn()
    render(<Board squares={squares} onSquareClick={handle} />)
    const buttons = screen.getAllByLabelText(/square/i)
    expect(buttons).toHaveLength(9)
    await userEvent.click(buttons[0])
    expect(handle).toHaveBeenCalledWith(0)
  })
})
