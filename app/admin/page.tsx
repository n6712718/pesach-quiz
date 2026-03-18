'use client'
import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import { supabase, getQuizConfig, saveQuizConfig, getQuestions, updateQuestion } from '@/lib/supabase'
import type { Participant, Lottery, QuizConfig, QuestionDB } from '@/lib/types'

type AdminTab = 'dashboard' | 'participants' | 'lotteries' | 'settings' | 'questions'

const DEFAULT_CONFIG: QuizConfig = {
  quiz_name: 'חידון הלכות פסח',
  school_name: 'ישיבת בני עקיבא עלי',
  year: 'תשפ״ו',
  start_date: '2025-03-20',
  end_date: '2025-04-08',
  total_days: 20,
  classes: ['ז1', 'ז2', 'ז3', 'ח1', 'ח2', 'ח3', 'ח4'],
  lottery_dates: [],
  prize_first: 'אוהל ל-4 אנשים',
  prize_second: 'פקל קפה מקצועי',
  prize_third: 'שובר להמבורגר',
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, completions: 0 })
  const [lotteryRunning, setLotteryRunning] = useState(false)
  const [lotteryResult, setLotteryResult] = useState<{ winner: { name: string; class: string }; type: string; emailsSent: number } | null>(null)
  const [sendEmails, setSendEmails] = useState(true)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [config, setConfig] = useState<QuizConfig>(DEFAULT_CONFIG)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [settingsMsgType, setSettingsMsgType] = useState<'success' | 'error'>('success')
  const [newClass, setNewClass] = useState('')
  const [newLotteryDate, setNewLotteryDate] = useState('')
  const [questions, setQuestions] = useState<QuestionDB[]>([])
  const [editingQId, setEditingQId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ question: string; options: string[]; correct_index: number }>({
    question: '', options: ['', '', '', ''], correct_index: 0,
  })
  const [qSaving, setQSaving] = useState(false)
  const [qMsg, setQMsg] = useState('')

  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'eli-admin-2025'

  function tryLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASS) setAuthed(true)
    else setMsg('סיסמה שגויה')
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: parts } = await supabase.from('participants').select('*').order('total_points', { ascending: false })
    const { data: lots } = await supabase.from('lotteries').select('*').order('held_at', { ascending: false })
    const { count: completionCount } = await supabase.from('quiz_completions').select('id', { count: 'exact', head: true })

    setParticipants(parts || [])
    setLotteries(lots || [])
    setStats({
      total: parts?.length || 0,
      active: parts?.filter(p => p.last_quiz_day > 0).length || 0,
      completions: completionCount || 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed) {
      loadData()
      getQuizConfig().then(data => { if (data) setConfig({ ...DEFAULT_CONFIG, ...data }) })
      getQuestions().then(setQuestions)
    }
  }, [authed, loadData])

  function calcTotalDays(start: string, end: string) {
    if (!start || !end) return config.total_days
    const diff = new Date(end).getTime() - new Date(start).getTime()
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1)
  }

  function setDate(field: 'start_date' | 'end_date', value: string) {
    setConfig(c => {
      const updated = { ...c, [field]: value }
      updated.total_days = calcTotalDays(
        field === 'start_date' ? value : c.start_date,
        field === 'end_date' ? value : c.end_date,
      )
      return updated
    })
  }

  async function saveSettings() {
    setSettingsSaving(true)
    setSettingsMsg('')
    try {
      await saveQuizConfig({
        quiz_name: config.quiz_name,
        school_name: config.school_name,
        year: config.year,
        start_date: config.start_date,
        end_date: config.end_date,
        total_days: config.total_days,
        classes: config.classes,
        lottery_dates: config.lottery_dates,
        prize_first: config.prize_first,
        prize_second: config.prize_second,
        prize_third: config.prize_third,
      })
      setSettingsMsgType('success')
      setSettingsMsg('✅ ההגדרות נשמרו בהצלחה!')
    } catch {
      setSettingsMsgType('error')
      setSettingsMsg('❌ שגיאה בשמירה. נסה שוב.')
    } finally {
      setSettingsSaving(false)
      setTimeout(() => setSettingsMsg(''), 4000)
    }
  }

  async function runLottery(type: 'regular' | 'grand') {
    if (!confirm(`להפעיל הגרלה ${type === 'grand' ? 'גדולה' : 'רגילה'}?${sendEmails ? '\nמיילים יישלחו לכל המשתתפים.' : ''}`)) return
    setLotteryRunning(true)
    try {
      const res = await fetch('/api/lottery/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_PASS}`,
        },
        body: JSON.stringify({ type, sendEmails }),
      })
      const data = await res.json()
      if (!res.ok) { alert(`שגיאה: ${data.error}`); return }
      setLotteryResult({ winner: data.winner, type, emailsSent: data.emailsSent })
      loadData()
    } catch (e) { console.error(e); alert('שגיאה בהפעלת ההגרלה') }
    setLotteryRunning(false)
  }

  async function deleteParticipant(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return
    await supabase.from('quiz_completions').delete().eq('participant_id', id)
    await supabase.from('participants').delete().eq('id', id)
    loadData()
  }

  async function resetParticipant(id: string) {
    if (!confirm('לאפס נקודות משתתף זה?')) return
    await supabase.from('quiz_completions').delete().eq('participant_id', id)
    await supabase.from('participants').update({ total_points: 0, streak: 0, last_quiz_day: 0 }).eq('id', id)
    loadData()
  }

  function startEditQ(q: QuestionDB) {
    setEditingQId(q.id)
    setEditForm({ question: q.question, options: [...q.options], correct_index: q.correct_index })
    setQMsg('')
  }

  async function saveEditQ() {
    if (!editingQId) return
    // Consecutive pattern check: warn if >3 questions in a row have same index 0 or 1
    const qIdx = questions.findIndex(q => q.id === editingQId)
    if (qIdx >= 3 && (editForm.correct_index === 0 || editForm.correct_index === 1)) {
      const prev3 = questions.slice(qIdx - 3, qIdx)
      if (prev3.every(q => q.correct_index === editForm.correct_index)) {
        const letter = ['A', 'B', 'C', 'D'][editForm.correct_index]
        setQMsg(`⚠️ 4 שאלות ברצף עם תשובה ${letter} — בדוק שזה אכן נכון לפני השמירה`)
        return
      }
    }
    setQSaving(true)
    try {
      await updateQuestion(editingQId, {
        question: editForm.question,
        options: editForm.options,
        correct_index: editForm.correct_index,
      })
      setQuestions(prev => prev.map(q => q.id === editingQId ? { ...q, ...editForm } : q))
      setEditingQId(null)
      setQMsg('✅ השאלה נשמרה')
      setTimeout(() => setQMsg(''), 3000)
    } catch {
      setQMsg('❌ שגיאה בשמירה')
    }
    setQSaving(false)
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-black text-ba-blue-800">פאנל ניהול</h1>
          <p className="text-gray-500 text-sm">ישיבת בני עקיבא עלי</p>
        </div>
        <form onSubmit={tryLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="סיסמת מנהל"
            className="w-full border-2 border-ba-blue-200 rounded-xl px-4 py-3 text-center focus:border-ba-blue-500 focus:outline-none"
          />
          {msg && <div className="text-red-500 text-sm text-center">{msg}</div>}
          <button type="submit" className="w-full bg-ba-blue-700 text-white py-3 rounded-xl font-bold hover:bg-ba-blue-800 transition-all">
            כניסה
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-ba-blue-800">פאנל ניהול</h1>
            <p className="text-gray-500">חידון הלכות פסח – ישיבת בני עקיבא עלי</p>
          </div>
          <button onClick={loadData} className="btn-secondary !py-2 !px-4 !text-sm">
            🔄 רענון
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '👥', value: stats.total, label: 'משתתפים רשומים' },
            { icon: '✅', value: stats.active, label: 'פעילים' },
            { icon: '📝', value: stats.completions, label: 'השלמות שאלון' },
            { icon: '🏆', value: lotteries.length, label: 'הגרלות שנערכו' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-3xl font-black text-ba-blue-800">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {([
            { id: 'dashboard', label: '🎲 הגרלות' },
            { id: 'participants', label: '👥 משתתפים' },
            { id: 'lotteries', label: '📋 היסטוריה' },
            { id: 'settings', label: '⚙️ הגדרות' },
            { id: 'questions', label: `❓ שאלות${questions.filter(q => q.correct_index === 1).length > 0 ? ` ⚠️${questions.filter(q => q.correct_index === 1).length}` : ''}` },
          ] as { id: AdminTab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${tab === t.id ? 'bg-ba-blue-700 text-white' : 'bg-white text-ba-blue-600 border border-ba-blue-200 hover:bg-ba-blue-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Lottery tab */}
        {tab === 'dashboard' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Email toggle */}
            <div className="md:col-span-2 card flex items-center gap-3 bg-ba-blue-50 border border-ba-blue-200">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <div className={`w-12 h-6 rounded-full transition-colors relative ${sendEmails ? 'bg-ba-blue-700' : 'bg-gray-300'}`}
                  onClick={() => setSendEmails(!sendEmails)}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${sendEmails ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
                <div>
                  <div className="font-bold text-ba-blue-800 text-sm">📧 שלח מיילים לכל המשתתפים</div>
                  <div className="text-ba-blue-500 text-xs">נדרש RESEND_API_KEY בקובץ ה-.env</div>
                </div>
              </label>
            </div>

            <div className="card text-center">
              <div className="text-5xl mb-3">🎲</div>
              <h3 className="text-xl font-black text-ba-blue-800 mb-2">הגרלה רגילה</h3>
              <p className="text-gray-500 mb-4 text-sm">בין כל מי שהשלים שאלון לפחות פעם אחת</p>
              <div className="text-ba-blue-600 font-bold mb-4">{participants.filter(p => p.last_quiz_day > 0).length} משתתפים מתאימים</div>
              <button onClick={() => runLottery('regular')} disabled={lotteryRunning}
                className="w-full bg-ba-blue-700 text-white py-3 rounded-xl font-bold hover:bg-ba-blue-800 transition-all disabled:opacity-50">
                {lotteryRunning ? '⏳ מפעיל...' : '🎲 הפעל הגרלה'}
              </button>
            </div>
            <div className="card text-center bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-ba-gold">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-xl font-black text-yellow-900 mb-2">הגרלה גדולה</h3>
              <p className="text-yellow-700 mb-4 text-sm">משוקלל לפי נקודות – כל 10 נקודות = כרטיס הגרלה</p>
              <div className="text-yellow-700 font-bold mb-4">{participants.filter(p => p.total_points > 0).length} משתתפים מתאימים</div>
              <button onClick={() => runLottery('grand')} disabled={lotteryRunning}
                className="w-full bg-ba-gold text-yellow-900 py-3 rounded-xl font-bold hover:bg-yellow-300 transition-all disabled:opacity-50">
                {lotteryRunning ? '⏳ מפעיל...' : '🏆 הגרלה גדולה'}
              </button>
            </div>

            {lotteryResult && (
              <div className="md:col-span-2 card bg-green-50 border-2 border-green-400 text-center animate-bounce-in">
                <div className="text-6xl mb-3">🎉</div>
                <h3 className="text-2xl font-black text-green-800 mb-1">הזוכה הוא...</h3>
                <div className="text-4xl font-black text-green-700">{lotteryResult.winner.name}</div>
                <div className="text-green-600 mt-1">{lotteryResult.winner.class}</div>
                {lotteryResult.emailsSent > 0 && (
                  <div className="mt-2 text-sm text-green-700">📧 {lotteryResult.emailsSent} מיילים נשלחו</div>
                )}
                <button onClick={() => setLotteryResult(null)} className="mt-4 text-green-600 hover:underline text-sm">סגור</button>
              </div>
            )}
          </div>
        )}

        {/* Participants tab */}
        {tab === 'participants' && (
          <div>
            <div className="mb-4 text-sm text-gray-500">{participants.length} משתתפים</div>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-right border-b border-gray-200">
                    <th className="pb-3 pr-2 text-ba-blue-700 font-bold">#</th>
                    <th className="pb-3 pr-2 text-ba-blue-700 font-bold">שם</th>
                    <th className="pb-3 pr-2 text-ba-blue-700 font-bold">כיתה</th>
                    <th className="pb-3 pr-2 text-ba-blue-700 font-bold">נקודות</th>
                    <th className="pb-3 pr-2 text-ba-blue-700 font-bold">יום אחרון</th>
                    <th className="pb-3 text-ba-blue-700 font-bold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-2 text-gray-500 text-sm">{i + 1}</td>
                      <td className="py-3 pr-2">
                        <div className="font-bold text-ba-blue-800">{p.name}</div>
                        <div className="text-gray-400 text-xs">{p.email}</div>
                      </td>
                      <td className="py-3 pr-2 text-gray-600 text-sm">{p.class}</td>
                      <td className="py-3 pr-2">
                        <span className="font-black text-ba-blue-700">{p.total_points}</span>
                      </td>
                      <td className="py-3 pr-2 text-gray-500 text-sm">
                        {p.last_quiz_day > 0 ? `יום ${p.last_quiz_day}` : 'לא התחיל'}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button onClick={() => resetParticipant(p.id)} className="text-orange-500 hover:text-orange-700 text-xs font-bold px-2 py-1 rounded bg-orange-50 hover:bg-orange-100">
                            אפס
                          </button>
                          <button onClick={() => deleteParticipant(p.id, p.name)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded bg-red-50 hover:bg-red-100">
                            מחק
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {loading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">טוען...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lotteries history */}
        {tab === 'lotteries' && (
          <div className="space-y-3">
            {lotteries.map(lot => (
              <div key={lot.id} className="card flex items-center gap-4">
                <div className="text-4xl">{lot.type === 'grand' ? '🏆' : '🎲'}</div>
                <div className="flex-1">
                  <div className="font-black text-ba-blue-800">{lot.winner_name}</div>
                  <div className="text-gray-500 text-sm">{lot.winner_class}</div>
                  <div className="text-gray-400 text-xs">{lot.description}</div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${lot.type === 'grand' ? 'bg-ba-gold text-yellow-900' : 'bg-ba-blue-100 text-ba-blue-700'}`}>
                    {lot.type === 'grand' ? 'גדולה' : 'רגילה'}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">{new Date(lot.held_at).toLocaleDateString('he-IL')}</div>
                </div>
              </div>
            ))}
            {lotteries.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">📋</div>
                <div>אין הגרלות עדיין</div>
              </div>
            )}
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="space-y-6 max-w-2xl">

            {/* Toast */}
            {settingsMsg && (
              <div className={`card text-center font-bold text-sm py-3 ${settingsMsgType === 'success' ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-red-50 text-red-700 border border-red-300'}`}>
                {settingsMsg}
              </div>
            )}

            {/* תאריכים */}
            <div className="card">
              <h3 className="text-lg font-black text-ba-blue-800 mb-4">📅 תאריכים</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-ba-blue-700 mb-1">תאריך התחלה</label>
                  <input type="date" value={config.start_date}
                    onChange={e => setDate('start_date', e.target.value)}
                    className="w-full border-2 border-ba-blue-200 rounded-xl px-3 py-2 focus:border-ba-blue-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ba-blue-700 mb-1">תאריך סיום</label>
                  <input type="date" value={config.end_date}
                    onChange={e => setDate('end_date', e.target.value)}
                    className="w-full border-2 border-ba-blue-200 rounded-xl px-3 py-2 focus:border-ba-blue-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ba-blue-700 mb-1">מספר ימים כולל</label>
                  <input type="number" min={1} value={config.total_days}
                    onChange={e => setConfig(c => ({ ...c, total_days: parseInt(e.target.value) || 1 }))}
                    className="w-full border-2 border-ba-blue-200 rounded-xl px-3 py-2 focus:border-ba-blue-500 focus:outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* פרטי החידון */}
            <div className="card">
              <h3 className="text-lg font-black text-ba-blue-800 mb-4">🏫 פרטי החידון</h3>
              <div className="space-y-3">
                {([
                  { key: 'quiz_name', label: 'שם החידון', placeholder: 'חידון הלכות פסח' },
                  { key: 'school_name', label: 'שם המוסד', placeholder: 'ישיבת בני עקיבא עלי' },
                  { key: 'year', label: 'שנה', placeholder: 'תשפ״ו' },
                ] as { key: keyof QuizConfig; label: string; placeholder: string }[]).map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-bold text-ba-blue-700 mb-1">{f.label}</label>
                    <input type="text" value={config[f.key] as string} placeholder={f.placeholder}
                      onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                      className="w-full border-2 border-ba-blue-200 rounded-xl px-3 py-2 text-right focus:border-ba-blue-500 focus:outline-none text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* כיתות */}
            <div className="card">
              <h3 className="text-lg font-black text-ba-blue-800 mb-4">🎓 כיתות</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {config.classes.map(cls => (
                  <span key={cls} className="flex items-center gap-1 bg-ba-blue-50 border border-ba-blue-200 rounded-lg px-3 py-1 text-sm font-bold text-ba-blue-700">
                    {cls}
                    <button type="button"
                      onClick={() => setConfig(c => ({ ...c, classes: c.classes.filter(x => x !== cls) }))}
                      className="text-red-400 hover:text-red-600 font-black leading-none mr-1">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newClass} placeholder="כיתה חדשה (למשל ט1)"
                  onChange={e => setNewClass(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newClass.trim()) {
                      setConfig(c => ({ ...c, classes: [...c.classes, newClass.trim()] }))
                      setNewClass('')
                    }
                  }}
                  className="flex-1 border-2 border-ba-blue-200 rounded-xl px-3 py-2 text-right focus:border-ba-blue-500 focus:outline-none text-sm" />
                <button type="button"
                  onClick={() => { if (newClass.trim()) { setConfig(c => ({ ...c, classes: [...c.classes, newClass.trim()] })); setNewClass('') } }}
                  className="bg-ba-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-ba-blue-800 transition-all">
                  + הוסף
                </button>
              </div>
            </div>

            {/* הגרלות */}
            <div className="card">
              <h3 className="text-lg font-black text-ba-blue-800 mb-4">🎲 תאריכי הגרלות</h3>
              <div className="space-y-2 mb-3">
                {config.lottery_dates.map(d => (
                  <div key={d} className="flex items-center justify-between bg-ba-blue-50 border border-ba-blue-200 rounded-xl px-3 py-2">
                    <span className="text-sm font-bold text-ba-blue-700">{new Date(d).toLocaleDateString('he-IL')}</span>
                    <button type="button"
                      onClick={() => setConfig(c => ({ ...c, lottery_dates: c.lottery_dates.filter(x => x !== d) }))}
                      className="text-red-400 hover:text-red-600 font-black text-lg leading-none">×</button>
                  </div>
                ))}
                {config.lottery_dates.length === 0 && (
                  <div className="text-gray-400 text-sm text-center py-2">אין תאריכים מוגדרים</div>
                )}
              </div>
              <div className="flex gap-2">
                <input type="date" value={newLotteryDate}
                  onChange={e => setNewLotteryDate(e.target.value)}
                  className="flex-1 border-2 border-ba-blue-200 rounded-xl px-3 py-2 focus:border-ba-blue-500 focus:outline-none text-sm" />
                <button type="button"
                  onClick={() => { if (newLotteryDate && !config.lottery_dates.includes(newLotteryDate)) { setConfig(c => ({ ...c, lottery_dates: [...c.lottery_dates, newLotteryDate].sort() })); setNewLotteryDate('') } }}
                  className="bg-ba-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-ba-blue-800 transition-all">
                  + הוסף
                </button>
              </div>
            </div>

            {/* פרסים */}
            <div className="card">
              <h3 className="text-lg font-black text-ba-blue-800 mb-4">🏆 פרסים</h3>
              <div className="space-y-3">
                {([
                  { key: 'prize_first', label: '🥇 מקום ראשון' },
                  { key: 'prize_second', label: '🥈 מקום שני' },
                  { key: 'prize_third', label: '🥉 מקום שלישי' },
                ] as { key: keyof QuizConfig; label: string }[]).map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-bold text-ba-blue-700 mb-1">{f.label}</label>
                    <input type="text" value={config[f.key] as string}
                      onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                      className="w-full border-2 border-ba-blue-200 rounded-xl px-3 py-2 text-right focus:border-ba-blue-500 focus:outline-none text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <button onClick={saveSettings} disabled={settingsSaving}
              className="w-full bg-ba-blue-700 text-white py-4 rounded-2xl font-black text-lg hover:bg-ba-blue-800 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
              {settingsSaving ? '⏳ שומר...' : '💾 שמור הגדרות'}
            </button>
          </div>
        )}

        {/* Questions tab */}
        {tab === 'questions' && (
          <div>
            {/* Toast */}
            {qMsg && (
              <div className={`card text-center text-sm font-bold py-3 mb-4 ${
                qMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-300' :
                qMsg.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700 border border-yellow-300' :
                'bg-red-50 text-red-700 border border-red-300'
              }`}>
                {qMsg}
                {qMsg.startsWith('⚠️') && (
                  <button onClick={async () => { setQMsg(''); setQSaving(true); try { await updateQuestion(editingQId!, { question: editForm.question, options: editForm.options, correct_index: editForm.correct_index }); setQuestions(prev => prev.map(q => q.id === editingQId ? { ...q, ...editForm } : q)); setEditingQId(null); setQMsg('✅ השאלה נשמרה'); setTimeout(() => setQMsg(''), 3000) } catch { setQMsg('❌ שגיאה') } setQSaving(false) }}
                    className="mr-4 underline font-bold">שמור בכל זאת</button>
                )}
              </div>
            )}

            {/* Inline edit form */}
            {editingQId && (
              <div className="card border-2 border-ba-blue-500 mb-4">
                <h3 className="font-black text-ba-blue-800 mb-4">✏️ עריכת שאלה</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-ba-blue-700 mb-1">שאלה</label>
                    <textarea value={editForm.question} rows={3}
                      onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                      className="w-full border-2 border-ba-blue-200 rounded-xl px-3 py-2 text-right focus:border-ba-blue-500 focus:outline-none text-sm resize-none" />
                  </div>
                  {(['א', 'ב', 'ג', 'ד'] as const).map((letter, i) => (
                    <div key={i}>
                      <label className="block text-sm font-bold text-ba-blue-700 mb-1">אפשרות {letter} ({['A','B','C','D'][i]})</label>
                      <input type="text" value={editForm.options[i] ?? ''}
                        onChange={e => setEditForm(f => {
                          const opts = [...f.options]
                          opts[i] = e.target.value
                          return { ...f, options: opts }
                        })}
                        className="w-full border-2 border-ba-blue-200 rounded-xl px-3 py-2 text-right focus:border-ba-blue-500 focus:outline-none text-sm" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-bold text-ba-blue-700 mb-1">✅ תשובה נכונה</label>
                    <select
                      value={editForm.correct_index}
                      onChange={e => setEditForm(f => ({ ...f, correct_index: parseInt(e.target.value) }))}
                      className="w-full border-2 border-ba-blue-500 rounded-xl px-3 py-2 focus:outline-none text-sm bg-white font-bold text-ba-blue-800"
                    >
                      {(['A', 'B', 'C', 'D'] as const).map((letter, i) => (
                        <option key={i} value={i}>{letter} — {editForm.options[i] || '(ריק)'}</option>
                      ))}
                    </select>
                    {(editForm.correct_index === 0 || editForm.correct_index === 1) && (
                      <p className="text-yellow-600 text-xs mt-1 font-bold">
                        ⚠️ תשובה {['A','B','C','D'][editForm.correct_index]} נפוצה כשגיאה — ודא שזה נכון
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={saveEditQ} disabled={qSaving}
                    className="flex-1 bg-ba-blue-700 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-ba-blue-800 transition-all disabled:opacity-50">
                    {qSaving ? '⏳ שומר...' : '💾 שמור'}
                  </button>
                  <button onClick={() => { setEditingQId(null); setQMsg('') }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="text-sm text-gray-500">{questions.length} שאלות</span>
              {questions.filter(q => q.correct_index === 1).length > 0 && (
                <span className="text-sm font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  ⚠️ {questions.filter(q => q.correct_index === 1).length} שאלות עם תשובה B — דורשות בדיקה
                </span>
              )}
            </div>

            {/* Question list */}
            <div className="space-y-2">
              {questions.map((q) => {
                const isSuspect = q.correct_index === 1
                const isEditing = editingQId === q.id
                return (
                  <div key={q.id}
                    className={`card flex items-start gap-3 transition-all ${
                      isEditing ? 'border-2 border-ba-blue-500 bg-ba-blue-50' :
                      isSuspect ? 'border-2 border-red-300 bg-red-50' : ''
                    }`}>
                    <div className="flex-shrink-0 text-center pt-0.5">
                      <div className="bg-ba-blue-100 text-ba-blue-700 font-bold text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                        יום {q.day_number}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ba-blue-800 text-sm leading-snug line-clamp-2">{q.question}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isSuspect ? 'bg-red-200 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          תשובה: {['A', 'B', 'C', 'D'][q.correct_index]}
                        </span>
                        {isSuspect && (
                          <span className="text-red-600 text-xs font-bold">
                            ⚠️ יש לוודא שהתשובה הנכונה אכן היא B
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => startEditQ(q)}
                      className="flex-shrink-0 text-ba-blue-600 hover:text-ba-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg bg-ba-blue-50 hover:bg-ba-blue-100 border border-ba-blue-200 transition-all whitespace-nowrap">
                      ערוך
                    </button>
                  </div>
                )
              })}
              {questions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-3">❓</div>
                  <div>אין שאלות בטבלה</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
