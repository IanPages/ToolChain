import type { Message } from '../App'
import { useMainContent } from '../hooks/useMainContent'
import ChatPanel from './ChatPanel'
import Sidebar from './Sidebar'
import FileSelectionModal from '../modals/FileSelectionModal'
import AudioSelectionModal from '../modals/AudioSelectionModal'
import PdfViewerModal from '../modals/PdfViewerModal'

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

function MainContent({messages,setMessages,inputValue,setInputValue,isProcessing,setIsProcessing,sidebarOpen,setSidebarOpen,sessionId
}: MainContentProps) {
  const {
    uploadedFiles,
    generatedFiles,
    isSummaryModalOpen,
    isExamModalOpen,
    isAudioModalOpen,
    isPdfModalOpen,
    selectedPdf,
    isGeneratingSummary,
    isGeneratingExam,
    isGeneratingAudio,
    handleSendMessage,
    handleFileUpload,
    handleDeleteFile,
    handleDeleteGeneratedFile,
    handleFileClick,
    handleGenerateSummary,
    handleGenerateExam,
    handleGenerateAudio,
    handleSummarySubmit,
    handleExamSubmit,
    handleAudioSubmit,
    setIsSummaryModalOpen,
    setIsExamModalOpen,
    setIsAudioModalOpen,
    setIsPdfModalOpen,
  } = useMainContent({ messages, setMessages, sessionId })

  const handleSendMessageWrapper = () => {
    handleSendMessage(inputValue, setInputValue, setIsProcessing)
  }

  const handleFileUploadWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, setIsProcessing)
  }

  return (
    <main className="main-content">
      <ChatPanel
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        isProcessing={isProcessing}
        onSendMessage={handleSendMessageWrapper}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        uploadedFiles={uploadedFiles}
        generatedFiles={generatedFiles}
        isProcessing={isProcessing}
        isGeneratingSummary={isGeneratingSummary}
        isGeneratingExam={isGeneratingExam}
        isGeneratingAudio={isGeneratingAudio}
        onFileUpload={handleFileUploadWrapper}
        onDeleteFile={handleDeleteFile}
        onDeleteGeneratedFile={handleDeleteGeneratedFile}
        onFileClick={handleFileClick}
        onGenerateSummary={handleGenerateSummary}
        onGenerateExam={handleGenerateExam}
        onGenerateAudio={handleGenerateAudio}
      />

      <FileSelectionModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        files={uploadedFiles}
        onSubmit={handleSummarySubmit}
      />

      <FileSelectionModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        files={uploadedFiles}
        onSubmit={handleExamSubmit}
      />

      <AudioSelectionModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        files={uploadedFiles}
        onSubmit={handleAudioSubmit}
      />

      <PdfViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        pdfUrl={selectedPdf?.url || ''}
        fileName={selectedPdf?.name || ''}
      />
    </main>
  )
}

export default MainContent
