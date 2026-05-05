import type { ChatRequest, ChatResponse } from '../types/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function sendMessage(content: string, sessionId: string): Promise<ChatResponse> {
  try {
    const request: ChatRequest = {
      message: content,
      session_id: sessionId
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error('Error sending message')
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}
