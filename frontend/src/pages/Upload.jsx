import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload as UploadIcon, FileText, Trash2, CheckCircle, AlertCircle, Loader, Database } from 'lucide-react'
import { uploadPDF, getDocuments, deleteDocument, getVectorStats } from '../services/api'

export default function Upload() {
  const [docs, setDocs] = useState([])
  const [stats, setStats] = useState({ total_chunks: 0 })
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      const [docRes, statsRes] = await Promise.all([getDocuments(), getVectorStats()])
      setDocs(docRes.data)
      setStats(statsRes.data)
    } catch {}
  }

  useEffect(() => { fetchData() }, [])

  const handleFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF files are supported', 'error')
      return
    }
    setUploading(true)
    try {
      const res = await uploadPDF(file)
      showToast(`✅ ${res.data.filename} indexed (${res.data.chunks_indexed} chunks)`)
      fetchData()
    } catch (e) {
      showToast(e.response?.data?.detail || 'Upload failed', 'error')
    }
    setUploading(false)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const handleDelete = async (id, name) => {
    try {
      await deleteDocument(id)
      showToast(`Deleted ${name}`)
      fetchData()
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Document Library</h2>
        <p className="text-slate-400">Upload PDF files to enhance AI responses with your own knowledge base</p>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6">
        {[
          { label: 'Documents', value: docs.length, icon: FileText, color: '#6366f1' },
          { label: 'Indexed Chunks', value: stats.total_chunks, icon: Database, color: '#22d3ee' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <s.icon size={20} style={{color: s.color}} />
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all mb-6 ${
          dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-indigo-900/50 hover:border-indigo-700/70'
        }`}>
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader size={40} className="text-indigo-400 animate-spin" />
            <p className="text-slate-300">Processing PDF and creating embeddings...</p>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.3)'}}>
              <UploadIcon size={28} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-medium">Drop PDF here or click to browse</p>
              <p className="text-sm text-slate-500 mt-1">Lecture notes, research papers, AI textbooks • Max 50MB</p>
            </div>
            <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          </label>
        )}
      </div>

      {/* Documents list */}
      <AnimatePresence>
        {docs.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-xl p-4 flex items-center gap-4">
                <FileText size={20} className="text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
                  <p className="text-xs text-slate-500">{doc.chunk_count} chunks • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(doc.id, doc.filename)}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all">
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
            style={toast.type === 'error'
              ? {background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5'}
              : {background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)',color:'#6ee7b7'}}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
