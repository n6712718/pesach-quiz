'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { registerParticipant, getParticipantByEmail, updateParticipantAvatar } from '@/lib/supabase'
import { CLASSES } from '@/lib/data'
import { AvatarSvg, AVATAR_KEYS, getAvatarFromEmail } from '@/components/AvatarSvg'
import type { AvatarKey } from '@/components/AvatarSvg'

export default function RegisterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<AvatarKey>('דתי לאומי')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await getParticipantByEmail(email)
        if (!user) { setError('לא נמצא משתמש עם אימייל זה. הרשם תחילה.'); return }
        // Assign deterministic avatar for existing users without one
        if (!user.avatar) {
          const assigned = getAvatarFromEmail(email.trim())
          await updateParticipantAvatar(user.id, assigned)
          user.avatar = assigned
        }
        localStorage.setItem('pesach_user', JSON.stringify(user))
        router.push('/learn')
      } else {
        const existing = await getParticipantByEmail(email)
        if (existing) {
          if (!existing.avatar) {
            const assigned = getAvatarFromEmail(email.trim())
            await updateParticipantAvatar(existing.id, assigned)
            existing.avatar = assigned
          }
          localStorage.setItem('pesach_user', JSON.stringify(existing))
          router.push('/learn')
          return
        }
        const user = await registerParticipant(name.trim(), className, email.trim(), avatar)
        localStorage.setItem('pesach_user', JSON.stringify(user))
        router.push('/learn')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה, נסה שוב'
      setError(msg.includes('duplicate') ? 'אימייל זה כבר רשום. עבור להתחברות.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-md mx-auto px-4 py-12">

        {/* Header card */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-ba-blue-700 to-ba-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white font-black text-3xl">ב״ע</span>
          </div>
          <h1 className="text-3xl font-black text-ba-blue-800">ברוך הבא!</h1>
          <p className="text-gray-500 mt-2">הצטרף לחידון הלכות פסח של ישיבת בני עקיבא עלי</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-ba-blue-50 rounded-2xl p-1 mb-8 border border-ba-blue-200">
          {(['register', 'login'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                mode === m ? 'bg-ba-blue-700 text-white shadow-md' : 'text-ba-blue-600 hover:text-ba-blue-800'
              }`}
            >
              {m === 'register' ? '📝 הרשמה חדשה' : '🔑 כניסה חוזרת'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-bold text-ba-blue-800 mb-2">שם מלא *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="הכנס שמך המלא"
                  className="w-full border-2 border-ba-blue-200 rounded-xl px-4 py-3 text-right focus:border-ba-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ba-blue-800 mb-2">כיתה *</label>
                <select
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  required
                  className="w-full border-2 border-ba-blue-200 rounded-xl px-4 py-3 text-right focus:border-ba-blue-500 focus:outline-none transition-colors bg-white"
                >
                  <option value="">בחר כיתה</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Avatar picker */}
              <div>
                <label className="block text-sm font-bold text-ba-blue-800 mb-3">בחר אווטאר</label>
                <div className="flex gap-2 flex-wrap justify-center">
                  {AVATAR_KEYS.map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAvatar(key)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all border-2 ${
                        avatar === key
                          ? 'border-ba-blue-500 bg-ba-blue-50 scale-105 shadow-md'
                          : 'border-transparent hover:border-ba-blue-200 hover:bg-ba-blue-50'
                      }`}
                    >
                      <AvatarSvg type={key} size={60} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-ba-blue-800 mb-2">אימייל *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              dir="ltr"
              className="w-full border-2 border-ba-blue-200 rounded-xl px-4 py-3 text-left focus:border-ba-blue-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">האימייל משמש לזיהוי בלבד</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-ba-blue-700 text-white py-4 rounded-2xl font-black text-lg hover:bg-ba-blue-800 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ טוען...' : mode === 'register' ? '🚀 הרשמה לחידון!' : '🔑 כניסה'}
          </button>

          {mode === 'register' && (
            <p className="text-center text-xs text-gray-400">
              בהרשמה אתה מסכים להשתתפות בחידון ולהצגת שמך בלוח המובילים
            </p>
          )}
        </form>

        {/* Features reminder */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '📖', text: 'לימוד יומי' },
            { icon: '🏆', text: 'לוח מובילים' },
            { icon: '🎁', text: 'פרסים' },
          ].map(f => (
            <div key={f.text} className="bg-ba-blue-50 rounded-2xl p-4 border border-ba-blue-100">
              <div className="text-3xl mb-1">{f.icon}</div>
              <div className="text-ba-blue-700 font-bold text-sm">{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
