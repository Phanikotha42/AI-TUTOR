import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, MessageSquare, Upload, FileText, BarChart2, Settings, Zap } from 'lucide-react'
import api from '../services/api'

const navItems = [
  { to: '/', label: 'Home', icon: Brain, exact: true },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/upload', label: 'Documents', icon: Upload },
  { to: '/exam', label: 'Exam', icon: FileText },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const [ollamaStatus, setOllamaStatus] = useState({ reachable: false, models: [] })

  useEffect(() => {
    const check = () =>
      api.get('/health')
        .then((r) => setOllamaStatus(r.data.ollama || { reachable: false, models: [] }))
        .catch(() => setOllamaStatus({ reachable: false, models: [] }))
    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [])

  const activeModel = ollamaStatus.models?.[0]?.split(':')[0] || 'llama3'

  return (
    <div className="flex min-h-screen" style={{background:'linear-gradient(135deg,#08080f 0%,#0d0d1f 50%,#080f1a 100%)'}}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col glass border-r border-indigo-900/30 relative z-10">
        {/* Logo */}
        <div className="p-6 border-b border-indigo-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6366f1,#22d3ee)'}}>
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight glow-text">AI Tutor</h1>
              <p className="text-xs text-indigo-400">Intelligent Learning</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  {label}
                  {isActive && (
                    <motion.div layoutId="nav-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-indigo-900/30">
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-cyan-400" />
              <span className="text-xs text-slate-400">Powered by Ollama</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${ollamaStatus.reachable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className={`text-xs ${ollamaStatus.reachable ? 'text-emerald-400' : 'text-red-400'}`}>
                {ollamaStatus.reachable ? `${activeModel} ready` : 'Ollama offline (port 11434)'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={useLocation().pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
