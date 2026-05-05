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

export const generateExam = async (selectedFiles: { name: string }[], sessionId: string): Promise<Message> => {
  const fileNames = selectedFiles.map(f => f.name).join(', ')
  const messageContent = `Generame un examen completo y detallado basado en los ficheros ${fileNames}. El examen debe incluir:
    1. Preguntas de opción múltiple (4 opciones cada una)
    2. Preguntas de desarrollo
    3. Preguntas verdadero/falso
    4. Casos prácticos o problemas a resolver
    5. Una hoja de respuestas separada

    Después creame un fichero PDF con el examen completo`  
  try {
    const response = await sendMessage(messageContent, sessionId)
    return {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.response,
      timestamp: new Date(response.timestamp)
    }
  } catch (error) {
    throw new Error('Error al generar el examen. Por favor, intenta nuevamente.')
  }
}