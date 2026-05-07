import { sendMessage } from './chatService'
import type { UploadedFile } from '../App'

export const generateAudio = async (selectedFiles: UploadedFile[], sessionId: string) => {
  const fileNames = selectedFiles.map(f => f.name).join(', ')
  const messageContent = `Generame un audio explicativo basado en los ficheros ${fileNames}. El audio debe resumir los puntos más importantes de los documentos de forma clara y concisa. Usa la herramienta generar_audio para crear el archivo de audio.`
  
  try {
    const response = await sendMessage(messageContent, sessionId)
    return {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: response.response,
      timestamp: new Date(response.timestamp)
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error al generar audio')
  }
}
