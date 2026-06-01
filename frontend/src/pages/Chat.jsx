import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Trash2, Globe, GlobeLock, Copy, Check, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { sendMessage, clearChatHistory, getModels, formatApiError } from '../services/api'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{background:'linear-gradient(135deg,#6366f1,#22d3ee)'}}>
        <Bot size={16} className="text-white" />
      </div>
      <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const copy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-slate-700' : ''
      }`} style={!isUser ? {background:'linear-gradient(135deg,#6366f1,#22d3ee)'} : {}}>
        {isUser ? <User size={16} className="text-slate-300" /> : <Bot size={16} className="text-white" />}
      </div>
      <div className={`max-w-[75%] group relative ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm text-white'
            : 'rounded-bl-sm text-slate-200 glass-card'
        }`} style={isUser ? {background:'linear-gradient(135deg,#4f46e5,#6366f1)'} : {}}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && msg.sources?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {msg.sources.map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full text-cyan-400"
                style={{background:'rgba(6,182,212,0.1)',border:'1px solid rgba(6,182,212,0.2)'}}>
                {s}
              </span>
            ))}
          </div>
        )}
        {!isUser && (
          <button onClick={copy}
            className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-500 hover:text-slate-300">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '**Hello! I\'m your AI Tutor 🎓**\n\nI specialize in **Artificial Intelligence** topics including:\n- Machine Learning & Deep Learning\n- NLP, Transformers, LLMs\n- Computer Vision & CNNs\n- Reinforcement Learning\n- AI Ethics & more\n\nWhat would you like to learn today?', sources: [] }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useWeb, setUseWeb] = useState(true)
  const [model, setModel] = useState(localStorage.getItem('ai_model') || 'llama3')
  const [availableModels, setAvailableModels] = useState(['llama3', 'mistral'])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    getModels()
      .then((r) => {
        const names = (r.data.models || []).map((m) => m.split(':')[0])
        if (names.length) setAvailableModels([...new Set(names)])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await sendMessage(userMsg, model, useWeb)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        sources: res.data.sources || []
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${formatApiError(e)}`,
        sources: []
      }])
    }
    setLoading(false)
  }

  const clearChat = async () => {
    try { await clearChatHistory() } catch {}
    setMessages([{ role: 'assistant', content: 'Chat cleared! Ask me anything about AI. 🤖', sources: [] }])
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-900/30 glass">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Bot size={18} className="text-indigo-400" /> AI Chat
          </h2>
          <p className="text-xs text-slate-400">Hybrid RAG • {messages.length - 1} messages</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={model} onChange={e => { setModel(e.target.value); localStorage.setItem('ai_model', e.target.value) }}
            className="text-xs px-3 py-2 rounded-lg text-slate-300 outline-none"
            style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(99,102,241,0.3)'}}>
            {availableModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button onClick={() => setUseWeb(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              useWeb ? 'text-cyan-400' : 'text-slate-500'
            }`}
            style={useWeb ? {background:'rgba(6,182,212,0.1)',border:'1px solid rgba(6,182,212,0.3)'}
              : {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.1)'}}>
            {useWeb ? <Globe size={14} /> : <GlobeLock size={14} />}
            {useWeb ? 'Web On' : 'Web Off'}
          </button>
          <button onClick={clearChat}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            title="Clear chat">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </AnimatePresence>
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-indigo-900/30 glass">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about Machine Learning, Neural Networks, NLP..."
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
            style={{
              background:'rgba(15,23,42,0.8)',
              border:'1px solid rgba(99,102,241,0.3)',
              maxHeight:'120px'
            }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
            {loading ? <RefreshCw size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">Press Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  )
}
