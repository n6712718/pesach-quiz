'use client'
import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import { supabase } from '@/lib/supabase'
import type { Participant, Lottery } from '@/lib/types'

type AdminTab = 'dashboard' | 'participants' | 'lotteries' | 'questions'

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
    if (authed) loadData()
  }, [authed, loadData])

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
      </div>
    </div>
  )
}
