import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send } from 'lucide-react'
import type { Message } from '../App'

interface ChatPanelProps {
  messages: Message[]
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  isProcessing: boolean
  onSendMessage: () => void
}

export default function ChatPanel({ messages, inputValue, setInputValue, isProcessing, onSendMessage }: ChatPanelProps) {
  return (
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
              onSendMessage()
            }
          }}
        />
        <button 
          onClick={onSendMessage}
          disabled={!inputValue.trim() || isProcessing}
          className="send-button"
        >
          <Send />
        </button>
      </div>
    </section>
  )
}
