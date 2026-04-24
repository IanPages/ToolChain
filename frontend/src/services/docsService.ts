import type { FileInfo } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function getFiles(): Promise<FileInfo[]> {
  const response = await fetch(`${API_BASE_URL}/files`)
  
  if (!response.ok) {
    throw new Error('Error al obtener los archivos')
  }
  
  return response.json()
}