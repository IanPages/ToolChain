import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'

interface PdfViewerModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string
  fileName: string
}

function PdfViewerModal({ isOpen, onClose, pdfUrl, fileName }: PdfViewerModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pdf-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pdf-modal-header">
              <h3>{fileName}</h3>
              <div className="pdf-modal-actions">
                <button 
                  onClick={handleDownload}
                  className="pdf-download-button"
                  title="Descargar PDF"
                >
                  <Download />
                </button>
                <button 
                  onClick={onClose}
                  className="pdf-modal-close"
                  title="Cerrar"
                >
                  <X />
                </button>
              </div>
            </div>
            <div className="pdf-modal-body">
              <embed
                src={pdfUrl}
                type="application/pdf"
                title={fileName}
                className="pdf-viewer"
                width="100%"
                height="100%"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PdfViewerModal
