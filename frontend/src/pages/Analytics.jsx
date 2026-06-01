import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, MessageSquare, FileText, Trophy, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { getAnalytics, getLeaderboard } from '../services/api'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-300">{label}</p>
        <p className="text-indigo-400 font-medium">{payload[0].value}%</p>
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAnalytics(), getLeaderboard()])
      .then(([a, l]) => {
        setAnalytics(a.data)
        setLeaderboard(l.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-slate-500">Loading analytics...</div>
    </div>
  )

  const summary = analytics?.summary || {}
  const scoreData = (analytics?.score_trend || []).map(s => ({
    topic: s.topic?.split(' ')[0] || 'Exam',
    score: s.score
  })).slice(0, 8)

  const topicData = analytics?.top_topics || []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">Learning Analytics</h2>
        <p className="text-slate-400">Track your progress and performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Questions Asked', value: summary.total_questions_asked || 0, icon: MessageSquare, color: '#6366f1' },
          { label: 'Exams Taken', value: summary.total_exams_taken || 0, icon: FileText, color: '#22d3ee' },
          { label: 'Avg Score', value: `${summary.average_exam_score || 0}%`, icon: TrendingUp, color: '#a78bfa' },
          { label: 'Documents', value: summary.documents_uploaded || 0, icon: BarChart2, color: '#34d399' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <s.icon size={20} style={{color: s.color}} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Score trend */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" /> Exam Score Trend
          </h3>
          {scoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="topic" tick={{fill:'#64748b',fontSize:11}} />
                <YAxis domain={[0,100]} tick={{fill:'#64748b',fontSize:11}} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{fill:'#6366f1',r:4}} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              No exam data yet. Take an exam to see trends!
            </div>
          )}
        </div>

        {/* Top topics */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-cyan-400" /> Topics Studied
          </h3>
          {topicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topicData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="topic" tick={{fill:'#64748b',fontSize:10}} />
                <YAxis tick={{fill:'#64748b',fontSize:11}} />
                <Tooltip contentStyle={{background:'#0f172a',border:'1px solid rgba(99,102,241,0.3)',color:'#e2e8f0'}} />
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              No topic data yet. Start studying!
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-yellow-400" /> Top Scores
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-6">No exam scores yet. Take an exam!</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((l) => (
              <div key={l.rank} className="flex items-center gap-4 py-2">
                <span className={`text-sm font-bold w-6 ${l.rank === 1 ? 'text-yellow-400' : l.rank === 2 ? 'text-slate-300' : 'text-amber-600'}`}>
                  #{l.rank}
                </span>
                <span className="flex-1 text-sm text-slate-300">{l.topic}</span>
                <div className="w-32 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{width:`${l.score}%`}} />
                </div>
                <span className="text-sm font-medium text-white w-12 text-right">{l.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
