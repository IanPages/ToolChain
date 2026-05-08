import { motion, AnimatePresence } from 'framer-motion'
import { FileText, FileDown, Plus, Trash2 } from 'lucide-react'
import type { UploadedFile } from '../App'

interface FilesSectionProps {
  files: UploadedFile[]
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteFile: (filename: string) => void
}

export default function FilesSection({ files, onFileUpload, onDeleteFile }: FilesSectionProps) {
  return (
    <div className="sidebar-section">
      <div className="panel-header">
        <FileText className="panel-icon" />
        <h2>Archivos</h2>
        <label className="upload-button">
          <Plus />
          <input 
            type="file" 
            multiple 
            onChange={onFileUpload}
            className="file-input"
          />
        </label>
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
              <p>Sube archivos para procesar</p>
            </motion.div>
          ) : (
            files.map((file) => (
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
                  onClick={() => onDeleteFile(file.name)}
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
  )
}
