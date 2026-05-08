import { motion, AnimatePresence } from 'framer-motion'
import { FileText, FileDown, Trash2 } from 'lucide-react'
import type { UploadedFile } from '../App'

interface GeneratedFilesSectionProps {
  files: UploadedFile[]
  onFileClick: (filename: string) => void
  onDeleteFile: (filename: string) => void
}

export default function GeneratedFilesSection({ files, onFileClick, onDeleteFile }: GeneratedFilesSectionProps) {
  return (
    <div className="sidebar-section">
      <div className="panel-header">
        <FileText className="panel-icon" />
        <h2>Archivos Generados</h2>
      </div>
      
      <div className="files-list">
        <AnimatePresence>
          {files.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-files"
            >
              <FileText className="empty-icon" />
              <p>No hay archivos generados</p>
            </motion.div>
          ) : (
            files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="file-item clickable"
                onClick={() => onFileClick(file.name)}
                title="Clic para ver el archivo"
              >
                <div className="file-info">
                  <FileDown className="file-icon" />
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteFile(file.name)
                  }}
                  className="delete-button"
                  title="Eliminar archivo"
                >
                  <Trash2 />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
