import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Clock, CheckCircle, XCircle, Trophy, RefreshCw, ChevronRight, Loader } from 'lucide-react'
import { getExamTopics, generateExam, submitExam } from '../services/api'

const DIFFICULTIES = ['easy', 'medium', 'hard']

function Timer({ seconds, total }) {
  const pct = (seconds / total) * 100
  const color = pct > 50 ? '#34d399' : pct > 25 ? '#fbbf24' : '#f87171'
  const m = Math.floor(seconds / 60), s = seconds % 60
  return (
    <div className="flex items-center gap-3">
      <Clock size={16} style={{color}} />
      <div className="w-32 h-1.5 rounded-full bg-slate-800">
        <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:color}} />
      </div>
      <span className="text-sm font-mono" style={{color}}>
        {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </span>
    </div>
  )
}

export default function ExamPage() {
  const [topics, setTopics] = useState([])
  const [phase, setPhase] = useState('setup') // setup | loading | exam | results
  const [config, setConfig] = useState({ topic: '', difficulty: 'medium', num: 10 })
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)
  const [current, setCurrent] = useState(0)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)
  const TOTAL_TIME = config.num * 60

  useEffect(() => {
    getExamTopics().then(r => {
      setTopics(r.data.topics)
      setConfig(c => ({ ...c, topic: r.data.topics[0] }))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase === 'exam') {
      setTimer(TOTAL_TIME)
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  const startExam = async () => {
    if (!config.topic) return
    setPhase('loading')
    try {
      const res = await generateExam(config.topic, config.difficulty, config.num)
      setQuestions(res.data.questions)
      setAnswers({})
      setCurrent(0)
      setPhase('exam')
    } catch {
      setPhase('setup')
    }
  }

  const handleSubmit = async () => {
    clearInterval(timerRef.current)
    try {
      const res = await submitExam(config.topic, questions, answers)
      setResults(res.data)
      setPhase('results')
    } catch { setPhase('setup') }
  }

  const selectAnswer = (qId, opt) => {
    const letter = opt.charAt(0)
    setAnswers(a => ({ ...a, [qId]: letter }))
  }

  const q = questions[current]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <AnimatePresence mode="wait">

        {/* Setup */}
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">Exam Mode</h2>
              <p className="text-slate-400">Test your AI knowledge with AI-generated questions</p>
            </div>
            <div className="glass-card rounded-2xl p-8 max-w-lg mx-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Topic</label>
                  <select value={config.topic} onChange={e => setConfig(c => ({...c, topic: e.target.value}))}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none"
                    style={{background:'rgba(15,23,42,0.8)',border:'1px solid rgba(99,102,241,0.3)'}}>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button key={d} onClick={() => setConfig(c => ({...c, difficulty: d}))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          config.difficulty === d ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        style={config.difficulty === d
                          ? {background:'linear-gradient(135deg,#6366f1,#4f46e5)'}
                          : {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Questions: {config.num}</label>
                  <input type="range" min={5} max={20} value={config.num}
                    onChange={e => setConfig(c => ({...c, num: +e.target.value}))}
                    className="w-full accent-indigo-500" />
                </div>
                <button onClick={startExam}
                  className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
                  style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
                  <FileText size={18} /> Start Exam
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <motion.div key="loading" className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader size={48} className="text-indigo-400 animate-spin" />
            <p className="text-slate-300">Generating {config.num} questions on {config.topic}...</p>
          </motion.div>
        )}

        {/* Exam */}
        {phase === 'exam' && q && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{config.topic}</h3>
                <p className="text-xs text-slate-400">{config.difficulty} • Q{current + 1}/{questions.length}</p>
              </div>
              <Timer seconds={timer} total={TOTAL_TIME} />
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-slate-800 rounded-full mb-6">
              <div className="h-full rounded-full transition-all bg-indigo-500"
                style={{width:`${((current+1)/questions.length)*100}%`}} />
            </div>

            <div className="glass-card rounded-2xl p-6 mb-4">
              <p className="text-white font-medium mb-6 text-lg">{q.question}</p>
              <div className="space-y-2">
                {q.options?.map(opt => {
                  const letter = opt.charAt(0)
                  const selected = answers[String(q.id)] === letter
                  return (
                    <button key={opt} onClick={() => selectAnswer(String(q.id), opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                        selected ? 'text-white' : 'text-slate-300 hover:text-white'
                      }`}
                      style={selected
                        ? {background:'rgba(99,102,241,0.25)',border:'1px solid rgba(99,102,241,0.5)'}
                        : {background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              {current > 0 && (
                <button onClick={() => setCurrent(c => c - 1)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-all"
                  style={{background:'rgba(255,255,255,0.05)'}}>
                  Previous
                </button>
              )}
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c + 1)}
                  className="ml-auto flex items-center gap-2 px-6 py-2 rounded-xl text-white transition-all"
                  style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit}
                  className="ml-auto flex items-center gap-2 px-6 py-2 rounded-xl text-white font-semibold transition-all"
                  style={{background:'linear-gradient(135deg,#34d399,#059669)'}}>
                  <CheckCircle size={16} /> Submit Exam
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {phase === 'results' && results && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center mb-8">
              <Trophy size={48} className="text-yellow-400 mx-auto mb-3" />
              <div className="text-6xl font-bold mb-2" style={{
                background:'linear-gradient(135deg,#fbbf24,#f59e0b)',
                WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                {results.score}%
              </div>
              <p className="text-2xl text-white font-semibold mb-1">Grade: {results.grade}</p>
              <p className="text-slate-400">{results.feedback}</p>
              <p className="text-sm text-slate-500 mt-2">{results.correct}/{results.total} correct</p>
            </div>

            {results.weak_areas?.length > 0 && (
              <div className="glass-card rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-red-400 mb-2">Areas to Review:</p>
                <ul className="space-y-1">
                  {results.weak_areas.map((w, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                      <XCircle size={12} className="text-red-400 flex-shrink-0" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {results.results?.map((r, i) => (
                <div key={i} className="glass-card rounded-xl p-4 text-sm">
                  <div className="flex items-start gap-2 mb-2">
                    {r.is_correct
                      ? <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                    <p className="text-slate-200">{r.question}</p>
                  </div>
                  {!r.is_correct && (
                    <p className="text-xs text-slate-400 ml-6">
                      Your: <span className="text-red-400">{r.user_answer || '—'}</span> •
                      Correct: <span className="text-emerald-400">{r.correct_answer}</span>
                    </p>
                  )}
                  {r.explanation && <p className="text-xs text-slate-500 ml-6 mt-1">{r.explanation}</p>}
                </div>
              ))}
            </div>

            <button onClick={() => setPhase('setup')}
              className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
              style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)'}}>
              <RefreshCw size={16} /> Take Another Exam
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
