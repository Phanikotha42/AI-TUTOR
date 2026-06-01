import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Server, Brain, Globe, Save, CheckCircle } from 'lucide-react'
import { getModels } from '../services/api'

export default function Settings() {
  const [models, setModels] = useState([])
  const [saved, setSaved] = useState(false)
  const [config, setConfig] = useState({
    model: localStorage.getItem('ai_model') || 'llama3',
    useWeb: localStorage.getItem('use_web') !== 'false',
    ollamaUrl: localStorage.getItem('ollama_url') || 'http://localhost:11434',
    backendUrl: localStorage.getItem('backend_url') || 'http://localhost:8000',
  })

  useEffect(() => {
    getModels().then(r => setModels(r.data.models || ['llama3', 'mistral'])).catch(() => setModels(['llama3', 'mistral']))
  }, [])

  const save = () => {
    if (config.backendUrl.includes('11434')) {
      alert('Backend URL must be port 8000 (FastAPI), not 11434 (Ollama). Use http://localhost:8000 or leave blank to use the dev proxy.')
      return
    }
    Object.entries(config).forEach(([k, v]) => localStorage.setItem(k === 'model' ? 'ai_model' : k === 'useWeb' ? 'use_web' : k === 'ollamaUrl' ? 'ollama_url' : 'backend_url', String(v)))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetBackendUrl = () => {
    localStorage.removeItem('backend_url')
    setConfig((c) => ({ ...c, backendUrl: import.meta.env.DEV ? '/api (Vite proxy)' : 'http://localhost:8000' }))
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-slate-400">Configure your AI Tutor</p>
      </div>

      <div className="space-y-6">
        {/* Model */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Brain size={16} className="text-indigo-400" /> AI Model
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(models.length ? models : ['llama3', 'mistral']).map(m => (
              <button key={m} onClick={() => setConfig(c => ({...c, model: m}))}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  config.model === m ? 'text-white' : 'text-slate-400'
                }`}
                style={config.model === m
                  ? {background:'linear-gradient(135deg,#6366f1,#4f46e5)'}
                  : {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Web retrieval */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Globe size={16} className="text-cyan-400" /> Web Retrieval
          </h3>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-slate-300">Enable web search</p>
              <p className="text-xs text-slate-500">Search Wikipedia, Arxiv, and web for answers</p>
            </div>
            <div onClick={() => setConfig(c => ({...c, useWeb: !c.useWeb}))}
              className={`w-12 h-6 rounded-full transition-all relative ${config.useWeb ? 'bg-indigo-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config.useWeb ? 'left-7' : 'left-1'}`} />
            </div>
          </label>
        </div>

        {/* URLs */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Server size={16} className="text-emerald-400" /> Server Config
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Backend URL', key: 'backendUrl' },
              { label: 'Ollama URL', key: 'ollamaUrl' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                <input
                  value={f.key === 'backendUrl' && import.meta.env.DEV && !localStorage.getItem('backend_url') ? '/api' : config[f.key]}
                  onChange={e => setConfig(c => ({...c, [f.key]: e.target.value}))}
                  placeholder={f.key === 'backendUrl' ? 'http://localhost:8000 or /api in dev' : ''}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none font-mono"
                  style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(99,102,241,0.3)'}} />
              </div>
            ))}
            <button type="button" onClick={resetBackendUrl}
              className="text-xs text-indigo-400 hover:text-indigo-300">
              Reset backend URL to default (fixes wrong Ollama port)
            </button>
          </div>
        </div>

        <button onClick={save}
          className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
          {saved ? <><CheckCircle size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
        </button>

        {/* Info */}
        <div className="glass-card rounded-xl p-4 text-xs text-slate-500 space-y-1">
          <p>• Make sure <span className="text-indigo-400 font-mono">ollama serve</span> is running</p>
          <p>• Pull models with <span className="text-indigo-400 font-mono">ollama pull llama3</span></p>
          <p>• Backend runs on <span className="text-indigo-400 font-mono">python app.py</span></p>
        </div>
      </div>
    </div>
  )
}
