import type { FileInfo, UploadResponse, DeleteResponse } from '../types/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function getFiles(): Promise<FileInfo[]> {
  const response = await fetch(`${API_BASE_URL}/files`)
  
  if (!response.ok) {
    throw new Error('Error al obtener los archivos')
  }
  
  return response.json()
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()
  
  files.forEach(file => {
    formData.append('files', file)
  })
  
  console.log(formData)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al subir los archivos')
  }

  return response.json()
}

export async function deleteFile(filename: string): Promise<DeleteResponse> {
  // Codificar el nombre del archivo para manejar espacios y caracteres especiales
  const encodedFilename = encodeURIComponent(filename)
  
  const response = await fetch(`${API_BASE_URL}/delete/${encodedFilename}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Error al eliminar el archivo')
  }

  return response.json()
}
