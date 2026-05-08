import { useState, useEffect } from 'react'
import Header from './components/Header'
import MainContent from './components/MainContent'
import './App.css'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface UploadedFile {
  id: string
  name: string
  uploadedAt: Date
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [sessionId] = useState(() => Date.now().toString())

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
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
      <Header 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      <MainContent
        messages={messages}
        setMessages={setMessages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sessionId={sessionId}
      />
    </div>
  )
}

export default App
