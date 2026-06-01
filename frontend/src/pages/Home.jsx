import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brain, MessageSquare, Upload, FileText, BarChart2, ArrowRight, Zap, Globe, BookOpen } from 'lucide-react'

const features = [
  { icon: MessageSquare, title: 'AI Chat', desc: 'Ask anything about AI/ML with hybrid RAG retrieval', to: '/chat', color: '#6366f1' },
  { icon: Upload, title: 'PDF Upload', desc: 'Upload lecture notes, papers, books for semantic search', to: '/upload', color: '#22d3ee' },
  { icon: FileText, title: 'Exam Mode', desc: 'AI-generated MCQs with auto-evaluation and scoring', to: '/exam', color: '#a78bfa' },
  { icon: BarChart2, title: 'Analytics', desc: 'Track your learning progress and performance', to: '/analytics', color: '#34d399' },
]

const sources = [
  { icon: BookOpen, label: 'PDF Documents', sub: 'Local knowledge base' },
  { icon: Globe, label: 'Web Search', sub: 'DuckDuckGo live search' },
  { icon: Zap, label: 'Wikipedia', sub: 'Encyclopedia coverage' },
  { icon: Brain, label: 'Arxiv Papers', sub: 'Research literature' },
]

export default function Home() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6"
          style={{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.3)',color:'#a5b4fc'}}>
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Powered by Ollama + LLama3 + ChromaDB
        </div>
        <h1 className="text-6xl font-bold mb-4 leading-tight">
          <span className="text-white">Learn </span>
          <span style={{background:'linear-gradient(135deg,#6366f1,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Artificial Intelligence
          </span>
          <br />
          <span className="text-white">with an AI Tutor</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-8">
          An intelligent learning platform combining local LLMs with hybrid retrieval from PDFs, Wikipedia, Arxiv, and the web.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/chat"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
            style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
            Start Learning <ArrowRight size={18} />
          </Link>
          <Link to="/exam"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-indigo-300 transition-all hover:bg-indigo-900/30"
            style={{border:'1px solid rgba(99,102,241,0.4)'}}>
            Take Exam <FileText size={18} />
          </Link>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-12">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Link to={f.to} className="glass-card rounded-2xl p-6 flex items-start gap-4 hover:border-indigo-500/40 transition-all group block">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${f.color}20`, border:`1px solid ${f.color}30`}}>
                <f.icon size={22} style={{color: f.color}} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                  {f.title} <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Knowledge Sources */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Brain size={18} className="text-indigo-400" /> Hybrid Knowledge Sources
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {sources.map((s) => (
            <div key={s.label} className="text-center p-4 rounded-xl" style={{background:'rgba(99,102,241,0.05)'}}>
              <s.icon size={24} className="text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">{s.label}</p>
              <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
