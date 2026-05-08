import { useState, useEffect, useCallback } from 'react'
import type { Message, UploadedFile } from '../App'
import { sendMessage } from '../services/chatService'
import { getFiles, uploadFiles, deleteFile } from '../services/docsService'
import { generateSummary, generateExam } from '../services/toolsService'
import { generateAudio } from '../services/audioService'
import { getGeneratedFiles, deleteGeneratedFile } from '../services/generatedDocsService'

interface UseMainContentProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  sessionId: string
}

export function useMainContent({ messages, setMessages, sessionId }: UseMainContentProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [generatedFiles, setGeneratedFiles] = useState<UploadedFile[]>([])
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [isExamModalOpen, setIsExamModalOpen] = useState(false)
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null)
  
  // Loading states para botones de acción
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isGeneratingExam, setIsGeneratingExam] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

  const handleSendMessage = async (inputValue: string, setInputValue: React.Dispatch<React.SetStateAction<string>>, setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>) => {
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
      
      // Recargar archivos generados por si la IA creó nuevos archivos
      const generated = await getGeneratedFiles()
      const convertedGenerated: UploadedFile[] = generated.map(file => ({
        id: file.name,
        name: file.name,
        uploadedAt: new Date()
      }))
      setGeneratedFiles(convertedGenerated)
      
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>) => {
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
      console.error('Error al eliminar:', error)
    }
  }, [])

  const handleDeleteGeneratedFile = useCallback(async (filename: string) => {
    try {
      const result = await deleteGeneratedFile(filename)
      console.log(`Eliminados ${result.documents_removed} documentos generados`)
      // Recargar la lista de archivos generados después de eliminar
      const files = await getGeneratedFiles()
      const convertedFiles: UploadedFile[] = files.map(file => ({
        id: file.name,
        name: file.name,
        uploadedAt: new Date()
      }))
      setGeneratedFiles(convertedFiles)
    } catch (error) {
      console.error('Error al eliminar archivo generado:', error)
    }
  }, [])

  const handleFileClick = (filename: string) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
    const fileUrl = `${API_BASE_URL}/generated-files/${encodeURIComponent(filename)}`
    setSelectedPdf({ url: fileUrl, name: filename })
    setIsPdfModalOpen(true)
  }

  const handleGenerateSummary = () => {
    setIsSummaryModalOpen(true)
  }

  const handleGenerateExam = () => {
    setIsExamModalOpen(true)
  }

  const handleGenerateAudio = () => {
    setIsAudioModalOpen(true)
  }

  const handleSummarySubmit = async (selectedFiles: UploadedFile[]) => {
    setIsSummaryModalOpen(false)
    setIsGeneratingSummary(true)
    
    try {
      const aiResponse = await generateSummary(selectedFiles, sessionId)
      setMessages(prev => [...prev, aiResponse])
      
      // Recargar archivos generados después de que la IA complete la tarea
      const generated = await getGeneratedFiles()
      const convertedGenerated: UploadedFile[] = generated.map(file => ({
        id: file.name,
        name: file.name,
        uploadedAt: new Date()
      }))
      setGeneratedFiles(convertedGenerated)
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Error al generar el resumen. Por favor, intenta nuevamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleExamSubmit = async (selectedFiles: UploadedFile[]) => {
    setIsExamModalOpen(false)
    setIsGeneratingExam(true)
    
    try {
      const aiResponse = await generateExam(selectedFiles, sessionId)
      setMessages(prev => [...prev, aiResponse])
      
      // Recargar archivos generados después de que la IA complete la tarea
      const generated = await getGeneratedFiles()
      const convertedGenerated: UploadedFile[] = generated.map(file => ({
        id: file.name,
        name: file.name,
        uploadedAt: new Date()
      }))
      setGeneratedFiles(convertedGenerated)
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Error al generar el examen. Por favor, intenta nuevamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingExam(false)
    }
  }

  const handleAudioSubmit = async (selectedFiles: UploadedFile[]) => {
    setIsAudioModalOpen(false)
    setIsGeneratingAudio(true)
    
    try {
      const aiResponse = await generateAudio(selectedFiles, sessionId)
      setMessages(prev => [...prev, aiResponse])
      
      // Recargar archivos generados después de que la IA complete la tarea
      const generated = await getGeneratedFiles()
      const convertedGenerated: UploadedFile[] = generated.map(file => ({
        id: file.name,
        name: file.name,
        uploadedAt: new Date()
      }))
      setGeneratedFiles(convertedGenerated)
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Error al generar el audio. Por favor, intenta nuevamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  useEffect(() => {
    const loadFiles = async () => {
      try {
        // Cargar archivos subidos
        const files = await getFiles()
        const convertedFiles: UploadedFile[] = files.map(file => ({
          id: file.name,
          name: file.name,
          uploadedAt: new Date()
        }))
        setUploadedFiles(convertedFiles)
        
        // Cargar archivos generados
        const generated = await getGeneratedFiles()
        const convertedGenerated: UploadedFile[] = generated.map(file => ({
          id: file.name,
          name: file.name,
          uploadedAt: new Date()
        }))
        setGeneratedFiles(convertedGenerated)
      } catch (error) {
        console.error('Error al cargar archivos:', error)
      }
    }
    
    loadFiles()
  }, [])

  return {
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
  }
}
