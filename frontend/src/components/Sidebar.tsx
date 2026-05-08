import { X } from 'lucide-react'
import type { UploadedFile } from '../App'
import FilesSection from './FilesSection'
import GeneratedFilesSection from './GeneratedFilesSection'
import ActionsSection from './ActionsSection'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  uploadedFiles: UploadedFile[]
  generatedFiles: UploadedFile[]
  isProcessing: boolean
  isGeneratingSummary: boolean
  isGeneratingExam: boolean
  isGeneratingAudio: boolean
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteFile: (filename: string) => void
  onDeleteGeneratedFile: (filename: string) => void
  onFileClick: (filename: string) => void
  onGenerateSummary: () => void
  onGenerateExam: () => void
  onGenerateAudio: () => void
}

export default function Sidebar({
  isOpen,
  onClose,
  uploadedFiles,
  generatedFiles,
  isProcessing,
  isGeneratingSummary,
  isGeneratingExam,
  isGeneratingAudio,
  onFileUpload,
  onDeleteFile,
  onDeleteGeneratedFile,
  onFileClick,
  onGenerateSummary,
  onGenerateExam,
  onGenerateAudio
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button 
        className="close-sidebar-button"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        <X />
      </button>
      
      <FilesSection 
        files={uploadedFiles}
        onFileUpload={onFileUpload}
        onDeleteFile={onDeleteFile}
      />

      <GeneratedFilesSection 
        files={generatedFiles}
        onFileClick={onFileClick}
        onDeleteFile={onDeleteGeneratedFile}
      />

      <ActionsSection 
        isProcessing={isProcessing}
        uploadedFilesCount={uploadedFiles.length}
        isGeneratingSummary={isGeneratingSummary}
        isGeneratingExam={isGeneratingExam}
        isGeneratingAudio={isGeneratingAudio}
        onGenerateSummary={onGenerateSummary}
        onGenerateExam={onGenerateExam}
        onGenerateAudio={onGenerateAudio}
      />
    </aside>
  )
}
