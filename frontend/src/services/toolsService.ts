import { sendMessage } from './chatService'
import type { Message } from '../App'

export const generateSummary = async (selectedFiles: { name: string }[], sessionId: string): Promise<Message> => {
  const fileNames = selectedFiles.map(f => f.name).join(', ')
    const messageContent = `Generame un resumen detallado y extenso con los ficheros ${fileNames} y después creame un fichero PDF con el contenido generado.`  
  try {
    const response = await sendMessage(messageContent, sessionId)
    return {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.response,
      timestamp: new Date(response.timestamp)
    }
  } catch (error) {
    throw new Error('Error al generar el resumen. Por favor, intenta nuevamente.')
  }
}