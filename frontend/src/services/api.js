import axios from 'axios'

/** Resolve API base URL. In dev, default `/api` uses Vite proxy → no CORS issues. */
export function getBaseUrl() {
  const stored = localStorage.getItem('backend_url')?.trim()
  if (stored) {
    // Common mistake: saving Ollama URL (11434) as the backend URL
    if (stored.includes('11434') || !/^https?:\/\//i.test(stored)) {
      localStorage.removeItem('backend_url')
    } else {
      return stored.replace(/\/$/, '')
    }
  }
  if (import.meta.env.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  }
  // Dev: same-origin proxy. Production build: direct backend URL.
  return import.meta.env.DEV ? '/api' : 'http://localhost:8000'
}

const api = axios.create({ timeout: 300000 })
api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl()
  return config
})

export function formatApiError(error) {
  const base = getBaseUrl()
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return `Request timed out. The first message can take 1–3 minutes while AI models load. Try again, or turn off **Web On** in chat.`
    }
    return `Cannot reach the backend (${base}). Start it with: .\\start-backend.ps1 — API should be at http://localhost:8000`
  }
  const detail = error.response.data?.detail
  const detailText = typeof detail === 'string' ? detail : JSON.stringify(detail)
  if (error.response.status >= 500) {
    return `Backend error (${error.response.status}): ${detailText || 'Internal server error'}`
  }
  return `Request failed (${error.response.status}): ${detailText || error.message}`
}
export const sendMessage = (message, model = 'llama3', useWeb = true) =>
  api.post('/chat/', { message, model, use_web: useWeb })
export const getChatHistory = () => api.get('/chat/history')
export const clearChatHistory = () => api.delete('/chat/history')
export const getModels = () => api.get('/chat/models')
export const uploadPDF = (file) => {
  const fd = new FormData(); fd.append('file', file)
  return api.post('/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const getDocuments = () => api.get('/upload/documents')
export const deleteDocument = (id) => api.delete(`/upload/documents/${id}`)
export const getVectorStats = () => api.get('/upload/stats')
export const getExamTopics = () => api.get('/exam/topics')
export const generateExam = (topic, difficulty = 'medium', numQuestions = 10) =>
  api.post('/exam/generate', { topic, difficulty, num_questions: numQuestions })
export const submitExam = (topic, questions, answers) =>
  api.post('/exam/submit', { topic, questions, answers })
export const getExamHistory = () => api.get('/exam/history')
export const getAnalytics = () => api.get('/analytics/')
export const getLeaderboard = () => api.get('/analytics/leaderboard')
export const webSearch = (query, sources = ['web', 'wikipedia', 'arxiv']) =>
  api.post('/web-search/', { query, sources })
export default api
