import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  FileText, 
  Download, 
  FileDown, 
  Sparkles, 
  Plus,
  X,
  Send,
  Trash2,
  Menu,
  ChevronLeft
} from 'lucide-react'
import './App.css'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UploadedFile {
  id: string
  name: string
  size: number
  uploadedAt: Date
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    
    setMessages([...messages, newMessage])
    setInputValue('')
    setIsProcessing(true)
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Esta es una respuesta simulada del asistente. En producción, esto se conectaría con tu backend Python.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsProcessing(false)
    }, 1000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date()
      }
      setUploadedFiles(prev => [...prev, newFile])
    })
  }

  const handleDeleteFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleGenerateSummary = () => {
    setIsProcessing(true)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '📝 **Resumen generado**\n\nHe analizado los documentos subidos y creado un resumen estructurado de los puntos clave.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsProcessing(false)
    }, 1500)
  }

  const handleGenerateQuiz = () => {
    setIsProcessing(true)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❓ **Cuestionario generado**\n\n1. ¿Cuál es el concepto principal de BERT?\n2. ¿Cómo funciona el mecanismo de atención?\n3. ¿Qué ventajas ofrece sobre modelos anteriores?',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsProcessing(false)
    }, 1500)
  }

  const handleDownloadDocument = () => {
    setIsProcessing(true)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '📄 **Documento generado**\n\nSe ha creado un documento PDF con el contenido de la conversación actual. Puedes descargarlo desde el panel de archivos.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
      setIsProcessing(false)
    }, 1500)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Sparkles className="logo-icon" />
            <h1>ToolChain AI</h1>
          </div>
          <div className="header-actions">
            <button 
              className="mobile-menu-button"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft /> : <Menu />}
            </button>
            <div className="header-status">
              <div className="status-dot"></div>
              <span>Conectado</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                          <span className="file-size">{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
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
                onClick={handleGenerateQuiz}
                disabled={isProcessing || uploadedFiles.length === 0}
                className="action-button"
              >
                <MessageSquare />
                <span>Crear Cuestionario</span>
              </button>
              
              <button 
                onClick={handleDownloadDocument}
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
    </div>
  )
}

export default App
