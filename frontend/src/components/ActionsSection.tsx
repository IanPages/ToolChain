import { Sparkles, FileText, MessageSquare, Volume2 } from 'lucide-react'

interface ActionsSectionProps {
  isProcessing: boolean
  uploadedFilesCount: number
  isGeneratingSummary: boolean
  isGeneratingExam: boolean
  isGeneratingAudio: boolean
  onGenerateSummary: () => void
  onGenerateExam: () => void
  onGenerateAudio: () => void
}

export default function ActionsSection({ 
  isProcessing, 
  uploadedFilesCount, 
  isGeneratingSummary, 
  isGeneratingExam, 
  isGeneratingAudio,
  onGenerateSummary,
  onGenerateExam,
  onGenerateAudio
}: ActionsSectionProps) {
  return (
    <div className="sidebar-section actions-section">
      <div className="panel-header">
        <Sparkles className="panel-icon" />
        <h2>Acciones</h2>
      </div>
      
      <div className="actions-grid">
        <button 
          onClick={onGenerateSummary}
          disabled={isProcessing || uploadedFilesCount === 0 || isGeneratingSummary}
          className="action-button"
        >
          {isGeneratingSummary ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <FileText />
          )}
          <span>{isGeneratingSummary ? 'Generando...' : 'Generar Resumen'}</span>
        </button>
        
        <button 
          onClick={onGenerateExam}
          disabled={isProcessing || uploadedFilesCount === 0 || isGeneratingExam}
          className="action-button"
        >
          {isGeneratingExam ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <MessageSquare />
          )}
          <span>{isGeneratingExam ? 'Generando...' : 'Generar Examen'}</span>
        </button>
        
        <button 
          onClick={onGenerateAudio}
          disabled={isProcessing || uploadedFilesCount === 0 || isGeneratingAudio}
          className="action-button"
        >
          {isGeneratingAudio ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <Volume2 />
          )}
          <span>{isGeneratingAudio ? 'Generando...' : 'Generar Audio'}</span>
        </button>
      </div>
    </div>
  )
}
