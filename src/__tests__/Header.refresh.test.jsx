import React, { createRef } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Header from '../components/Header'

describe('Header refresh()', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    // Mock window.google to prevent script loading errors in test
    global.window.google = undefined
  })
  afterEach(() => {
    global.fetch = originalFetch
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('can call refresh() without errors', async () => {
    localStorage.setItem('token', 'test-token')
    const stats = { wins_x: 2, wins_o: 3, draws: 1 }
    
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/stats')) return Promise.resolve({ ok: true, json: () => Promise.resolve(stats) })
      return Promise.resolve({ ok: false })
    })

    const ref = createRef()
    render(<Header ref={ref} />)

    // Wait for ref to be ready
    await waitFor(() => expect(ref.current).toBeTruthy())
    
    // Call refresh should not throw
    await expect(ref.current.refresh()).resolves.toBeUndefined()
  })

  it('renders the sign-in container when not signed in', async () => {
    render(<Header />)
    await screen.findByTestId('google-container')
  })
})
