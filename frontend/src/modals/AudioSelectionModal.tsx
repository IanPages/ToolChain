import { useState } from 'react'
import { X, FileText, Check, Volume2 } from 'lucide-react'
import type { UploadedFile } from '../App'

interface AudioSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  files: UploadedFile[]
  onSubmit: (selectedFiles: UploadedFile[]) => void
}

function AudioSelectionModal({ isOpen, onClose, files, onSubmit }: AudioSelectionModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const toggleFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)))
    }
  }

  const handleSubmit = () => {
    const selectedFilesList = files.filter(f => selectedFiles.has(f.id))
    onSubmit(selectedFilesList)
    setSelectedFiles(new Set())
  }

  const handleClose = () => {
    setSelectedFiles(new Set())
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Generar Audio</h3>
          <button className="modal-close" onClick={handleClose}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Selecciona los documentos que deseas convertir a audio:
          </p>

          <div className="select-all-container">
            <button 
              className="select-all-button"
              onClick={handleSelectAll}
            >
              {selectedFiles.size === files.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
            <span className="selected-count">
              {selectedFiles.size} de {files.length} seleccionados
            </span>
          </div>

          <div className="files-selection-list">
            {files.map((file) => (
              <div
                key={file.id}
                className={`file-selection-item ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                onClick={() => toggleFile(file.id)}
              >
                <div className="file-selection-checkbox">
                  {selectedFiles.has(file.id) && <Check className="check-icon" />}
                </div>
                <FileText className="file-icon" />
                <span className="file-name">{file.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-button secondary" onClick={handleClose}>
            Cancelar
          </button>
          <button 
            className="modal-button primary"
            onClick={handleSubmit}
            disabled={selectedFiles.size === 0}
          >
            <Volume2 />
            Generar Audio
          </button>
        </div>
      </div>
    </div>
  )
}

export default AudioSelectionModal
