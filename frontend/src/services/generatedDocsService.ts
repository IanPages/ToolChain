import type { FileInfo, DeleteResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function getGeneratedFiles(): Promise<FileInfo[]> {
  const response = await fetch(`${API_BASE_URL}/generated-files`)
  
  if (!response.ok) {
    throw new Error('Error al obtener los archivos generados')
  }
  
  return response.json()
}

export async function deleteGeneratedFile(filename: string): Promise<DeleteResponse> {
  // Codificar el nombre del archivo para manejar espacios y caracteres especiales
  const encodedFilename = encodeURIComponent(filename)
  
  const response = await fetch(`${API_BASE_URL}/generated-files/${encodedFilename}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el archivo generado')
  }

  return response.json()
}
