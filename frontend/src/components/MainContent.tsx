import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  FileText, 
  Download, 
  FileDown, 
  Sparkles, 
  Plus,
  Send,
  Trash2,
  X
} from 'lucide-react'
import type { Message, UploadedFile } from '../App'
import { sendMessage } from '../services/chatService'
import { getFiles, uploadFiles } from '../services/docsService'
import { useState, useEffect, useCallback } from 'react'
import { deleteFile } from '../services/docsService'

interface MainContentProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  isProcessing: boolean
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  sessionId: string
}

function MainContent({messages,setMessages,inputValue,setInputValue,isProcessing,setIsProcessing,sidebarOpen,setSidebarOpen,sessionId}: MainContentProps)

{
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // Cargar archivos desde la API al montar el componente
  

  const handleSendMessage = async () => {
    const messageContent = inputValue.trim()
    if (!messageContent) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }
    
    setMessages([...messages, newMessage])
    setInputValue('')
    setIsProcessing(true)
    
    try {
      const response = await sendMessage(messageContent, sessionId)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      }
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error al enviar el mensaje. Por favor, intenta nuevamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  } 

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsProcessing(true)
    
    try {
      const fileList = Array.from(files)
      const response = await uploadFiles(fileList)
      
      // Add files to local state with proper IDs from backend response
      fileList.forEach(file => {
        const newFile: UploadedFile = {
          id: file.name,
          name: file.name,
          uploadedAt: new Date()
        }
        setUploadedFiles(prev => [...prev, newFile])
      })

      // Show success message
      const successMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `${response.message}\n\nSe procesaron ${response.files_processed} archivos y se indexaron ${response.documents_indexed} documentos.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, successMessage])

    } catch (error) {
      console.error('Error uploading files:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Error al subir los archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteFile = useCallback(async (filename: string) => {
    try {
      const result = await deleteFile(filename)
      console.log(`Eliminados ${result.documents_removed} documentos`)
      // Recargar la lista de archivos después de eliminar
      const files = await getFiles()
      const convertedFiles: UploadedFile[] = files.map(file => ({
        id: file.name,
        name: file.name,
        uploadedAt: new Date()
      }))
      setUploadedFiles(convertedFiles)
    } catch (error) {
      console.error('Error al eliminar:', error.message)
    }
  }, [])

  const handleGenerateSummary = () => {
    setIsProcessing(true)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '**Resumen generado**\n\nHe analizado los documentos subidos y creado un resumen estructurado de los puntos clave.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsProcessing(false)
    }, 1500)
  }

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await getFiles()
        const convertedFiles: UploadedFile[] = files.map(file => ({
          id: file.name,
          name: file.name, // La API no devuelve el tamaño
          uploadedAt: new Date()
        }))
        setUploadedFiles(convertedFiles)
      } catch (error) {
        console.error('Error al cargar archivos:', error)
      }
    }
    
    loadFiles()
  }, [])

  return (
    <main className="main-content">
      {/* Left Panel - Chat */}
      <section className="chat-panel">
        <div className="panel-header">
          <MessageSquare className="panel-icon" />
          <h2>Conversación</h2>
        </div>
        
        <div className="messages-container">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="empty-state"
              >
                <MessageSquare className="empty-icon" />
                <p>Comienza una conversación con el asistente</p>
              </motion.div>
            )}
            
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`message ${message.role}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
            
            {/*Animación 3 puntos */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="message assistant processing"
              >
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="message-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="send-button"
          >
            <Send />
          </button>
        </div>
      </section>

      {/* Right Panel - Files & Actions */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <button 
          className="close-sidebar-button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X />
        </button>
        {/* Files Section */}
        <div className="sidebar-section">
          <div className="panel-header">
            <FileText className="panel-icon" />
            <h2>Archivos</h2>
            <label className="upload-button">
              <Plus />
              <input 
                type="file" 
                multiple 
                onChange={handleFileUpload}
                className="file-input"
              />
            </label>
          </div>
          
          <div className="files-list">
            <AnimatePresence>
              {uploadedFiles.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="empty-files"
                >
                  <FileText className="empty-icon" />
                  <p>Sube archivos para procesar</p>
                </motion.div>
              ) : (
                uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="file-item"
                  >
                    <div className="file-info">
                      <FileDown className="file-icon" />
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteFile(file.name)}
                      className="delete-button"
                    >
                      <Trash2 />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions Section */}
        <div className="sidebar-section">
          <div className="panel-header">
            <Sparkles className="panel-icon" />
            <h2>Acciones</h2>
          </div>
          
          <div className="actions-grid">
            <button 
              onClick={handleGenerateSummary}
              disabled={isProcessing || uploadedFiles.length === 0}
              className="action-button"
            >
              <FileText />
              <span>Generar Resumen</span>
            </button>
            
            <button 
              disabled={isProcessing || uploadedFiles.length === 0}
              className="action-button"
            >
              <MessageSquare />
              <span>Crear Cuestionario</span>
            </button>
            
            <button 
              disabled={isProcessing || messages.length === 0}
              className="action-button"
            >
              <Download />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default MainContent
