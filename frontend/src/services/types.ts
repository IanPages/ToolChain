export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatRequest {
  message: string
  session_id: string
}

export interface ChatResponse {
  response: string
  session_id: string
  timestamp: string
}

export interface FileUploadResponse {
  id: string
  name: string
  size: number
  uploadedAt: Date
  status: 'success' | 'error'
  error?: string
}

export interface DocumentGenerationResponse {
  message: string
  documentId?: string
  status: 'success' | 'error'
  error?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface FileInfo {
  name: string
  count: number
}
