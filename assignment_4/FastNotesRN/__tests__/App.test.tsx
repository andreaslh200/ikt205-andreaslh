import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import App, { NewNoteScreen, MainScreen } from '../App'
import { supabase } from '../lib/supabase'

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn().mockReturnValue(jest.fn()),
}

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@test.com',
  },
} as any

// Unit Test - creating a note navigates back
test('creating a note calls goBack after save', async () => {
  const mockInsert = jest.fn().mockResolvedValue({ error: null })
  ;(supabase.from as jest.Mock).mockReturnValue({
    insert: mockInsert,
  })

  render(<NewNoteScreen navigation={mockNavigation} session={mockSession} />)

  fireEvent.changeText(screen.getByPlaceholderText('Title'), 'Test Note')
  fireEvent.changeText(screen.getByPlaceholderText('Content'), 'Test content')
  fireEvent.press(screen.getByText('Save'))

  await waitFor(() => {
    expect(mockNavigation.goBack).toHaveBeenCalled()
  })
})

// Integration Test - loader shows while fetching, disappears when done
test('shows loader while fetching notes, then shows notes', async () => {
  const mockNotes = [
    { id: 1, title: 'Note 1', content: 'Content', user_email: 'a@b.com', updated_at: new Date().toISOString(), image_url: null },
  ]

  ;(supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue({
        range: jest.fn().mockResolvedValue({ data: mockNotes, error: null }),
      }),
    }),
  })

  render(<MainScreen navigation={mockNavigation} session={mockSession} />)

  expect(screen.getByTestId('loading-indicator')).toBeTruthy()

  await waitFor(() => {
    expect(screen.getByText('Note 1')).toBeTruthy()
  })
})

// Auth Guard Test - shows login when not authenticated
test('shows login screen when user is not authenticated', async () => {
  ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: null },
  })

  render(<App />)

  await waitFor(() => {
    expect(screen.getByText('FastNotes')).toBeTruthy()
    expect(screen.getByPlaceholderText('email@address.com')).toBeTruthy()
  })
})
