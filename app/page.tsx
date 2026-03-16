'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { getCurrentDay } from '@/lib/supabase'
import { getTopicByDay } from '@/lib/data'
import { getLotteries } from '@/lib/supabase'
import type { Lottery, Participant } from '@/lib/types'

export default function HomePage() {
  const [user, setUser] = useState<Participant | null>(null)
  const [currentDay, setCurrentDay] = useState(1)
  const [todayTopic, setTodayTopic] = useState<ReturnType<typeof getTopicByDay>>(undefined)
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [daysLeft, setDaysLeft] = useState(20)

  useEffect(() => {
    const stored = localStorage.getItem('pesach_user')
    if (stored) setUser(JSON.parse(stored))

    const day = getCurrentDay()
    setCurrentDay(day)
    setTodayTopic(getTopicByDay(day))
    setDaysLeft(Math.max(0, 20 - day + 1))

    getLotteries().then(setLotteries)
  }, [])

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ba-blue-800 via-ba-blue-700 to-ba-blue-900" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-9xl">✡</div>
          <div className="absolute bottom-10 left-10 text-7xl">🕊️</div>
          <div className="absolute top-1/2 left-1/4 text-6xl">🫓</div>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center text-white">
          <div className="inline-block bg-ba-gold text-yellow-900 text-sm font-bold px-4 py-2 rounded-full mb-6 animate-bounce-in">
            🎉 ישיבת בני עקיבא עלי
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            חידון הלכות פסח
            <br />
            <span className="text-ba-gold">תשפ"ו</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-2xl mx-auto">
            למד מפניני הלכה, ענה על שאלות יומיות, צבור נקודות ותזכה בפרסים!
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-6 mb-10 flex-wrap">
            {[
              { icon: '📅', value: `${currentDay}/20`, label: 'יום נוכחי' },
              { icon: '⏰', value: `${daysLeft}`, label: 'ימים נותרים' },
              { icon: '📝', value: '10', label: 'שאלות ליום' },
              { icon: '⚡', value: '+6', label: 'אתגר ליום' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-2xl px-6 py-4 text-center min-w-[100px]">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-black text-ba-gold">{stat.value}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/learn" className="bg-ba-gold text-yellow-900 px-8 py-4 rounded-2xl font-black text-xl hover:bg-yellow-300 active:scale-95 transition-all shadow-xl">
                📖 לשיעור היומי
              </Link>
              <Link href="/leaderboard" className="bg-white/20 border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-xl hover:bg-white/30 active:scale-95 transition-all">
                🏆 לוח מובילים
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-ba-gold text-yellow-900 px-8 py-4 rounded-2xl font-black text-xl hover:bg-yellow-300 active:scale-95 transition-all shadow-xl">
                🚀 הרשמה לחידון
              </Link>
              <Link href="/leaderboard" className="bg-white/20 border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-xl hover:bg-white/30 active:scale-95 transition-all">
                👀 לוח מובילים
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Today's topic preview */}
        {todayTopic && (
          <section className="mb-12 animate-slide-up">
            <h2 className="text-2xl font-black text-ba-blue-800 mb-6 flex items-center gap-2">
              <span className="text-3xl">📚</span> נושא היום
            </h2>
            <div className="card border-r-4 border-ba-blue-700 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="text-ba-blue-500 text-sm font-medium mb-1">יום {currentDay} מתוך 20</div>
                  <h3 className="text-2xl font-black text-ba-blue-800 mb-2">{todayTopic.title}</h3>
                  <div className="text-ba-blue-500 text-sm mb-3 flex items-center gap-1">
                    <span>📖</span> {todayTopic.source}
                  </div>
                  <p className="text-gray-600 leading-relaxed line-clamp-3">{todayTopic.content}</p>
                </div>
                <Link href="/learn" className="bg-ba-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-ba-blue-800 active:scale-95 transition-all whitespace-nowrap shadow-md">
                  פתח שיעור ➜
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-ba-blue-800 mb-6 text-center">✨ איך זה עובד?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', icon: '📝', title: 'נרשמים', desc: 'הרשמה עם שם, כיתה ואימייל – חינם ומהיר!' },
              { step: '2', icon: '📖', title: 'לומדים ועונים', desc: 'כל יום נושא חדש מפניני הלכה + 10 שאלות יומיות' },
              { step: '3', icon: '🏆', title: 'זוכים בפרסים', desc: 'הגרלה כל שבוע + הגרלה גדולה ביום האחרון' },
            ].map(item => (
              <div key={item.step} className="card text-center hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-ba-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <div className="text-ba-blue-500 text-sm font-bold mb-1">שלב {item.step}</div>
                <h3 className="text-xl font-black text-ba-blue-800 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Points & Challenge explanation */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-ba-blue-800 mb-6 text-center">⚡ מערכת הנקודות והאתגר</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card border-r-4 border-ba-blue-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-ba-blue-100 rounded-2xl flex items-center justify-center text-2xl">📝</div>
                <div>
                  <h3 className="text-xl font-black text-ba-blue-800">שאלון יומי</h3>
                  <div className="text-ba-blue-500 text-sm">10 שאלות בכל יום</div>
                </div>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> קוראים את נושא היום מפניני הלכה</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> עונים על 10 שאלות רב-ברירה</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> כל תשובה נכונה = 10 נקודות</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> מקסימום 100 נקודות ליום</li>
              </ul>
            </div>
            <div className="card border-r-4 border-ba-gold bg-yellow-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-200 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
                <div>
                  <h3 className="text-xl font-black text-ba-blue-800">אתגר יומי</h3>
                  <div className="text-yellow-700 text-sm">6 שאלות מעמיקות – רק לאחר השאלון!</div>
                </div>
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2"><span className="text-ba-gold mt-0.5">★</span> נפתח אחרי השלמת השאלון היומי</li>
                <li className="flex items-start gap-2"><span className="text-ba-gold mt-0.5">★</span> שאלות עיון מעמיקות יותר</li>
                <li className="flex items-start gap-2"><span className="text-ba-gold mt-0.5">★</span> כל תשובה נכונה = 15–25 נקודות</li>
                <li className="flex items-start gap-2"><span className="text-ba-gold mt-0.5">★</span> הנקודות נוספות לסך הכולל!</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 card bg-ba-blue-50 text-center">
            <p className="text-ba-blue-700 font-bold text-lg">
              💡 כל נקודה = כרטיס הגרלה נוסף! ככל שתצבור יותר — כך גדל הסיכוי שלך לזכות
            </p>
          </div>
        </section>

        {/* Prizes */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-ba-blue-800 mb-2 text-center">🎁 פרסים</h2>
          <p className="text-center text-gray-500 mb-8">שני סוגי פרסים – הגרלות ביניים + פרסי סיום לפי דירוג</p>

          {/* Interim lottery */}
          <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-ba-gold mb-6 text-center">
            <div className="text-5xl mb-3">🎲</div>
            <h3 className="text-xl font-black text-yellow-900 mb-1">הגרלת ביניים – כל 3 ימים</h3>
            <p className="text-yellow-700 text-sm">כל מי שענה על שאלון לפחות פעם אחת נכנס אוטומטית להגרלה!</p>
            <div className="mt-3 inline-block bg-ba-gold text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">הגרלה ב-20/3, 23/3, 26/3, 29/3, 1/4, 4/4</div>
          </div>

          {/* End prizes */}
          <div className="mb-4 text-center">
            <h3 className="text-xl font-black text-ba-blue-800 mb-1">🏆 פרסי סיום – לפי דירוג ניקוד</h3>
            <p className="text-gray-500 text-sm mb-6">בסיום 20 הימים – הפרסים הולכים לשלושת המקומות הראשונים</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-400 text-center order-2 md:order-1">
              <div className="text-5xl mb-2">🥈</div>
              <div className="text-yellow-600 font-black text-lg mb-1">מקום שני</div>
              <div className="text-2xl font-black text-yellow-800">פקל קפל</div>
              <div className="text-yellow-700 text-sm mt-1">מקצועי</div>
            </div>
            <div className="card bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-500 text-center scale-105 shadow-xl order-1 md:order-2">
              <div className="text-6xl mb-2">🥇</div>
              <div className="text-yellow-700 font-black text-xl mb-1">מקום ראשון</div>
              <div className="text-3xl font-black text-yellow-900">אוהל</div>
              <div className="text-yellow-800 text-sm mt-1">ל-4 אנשים</div>
            </div>
            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 text-center order-3">
              <div className="text-5xl mb-2">🥉</div>
              <div className="text-orange-600 font-black text-lg mb-1">מקום שלישי</div>
              <div className="text-2xl font-black text-orange-800">שובר</div>
              <div className="text-orange-700 text-sm mt-1">להמבורגר</div>
            </div>
          </div>
          <div className="mt-4 card bg-ba-blue-50 text-center">
            <p className="text-ba-blue-700 font-bold">⚡ ככל שתצבור יותר נקודות — כך תעלה בדירוג! שאלות האתגר מעניקות נקודות בונוס</p>
          </div>
        </section>

        {/* Recent lotteries */}
        {lotteries.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black text-ba-blue-800 mb-6 flex items-center gap-2">
              <span>🎉</span> הגרלות אחרונות
            </h2>
            <div className="space-y-3">
              {lotteries.map(lottery => (
                <div key={lottery.id} className="card flex items-center gap-4 border-r-4 border-ba-gold">
                  <div className="text-4xl">🏆</div>
                  <div className="flex-1">
                    <div className="font-black text-ba-blue-800">{lottery.winner_name}</div>
                    <div className="text-gray-500 text-sm">{lottery.winner_class} • {lottery.description}</div>
                  </div>
                  <div className="badge-gold">{lottery.type === 'grand' ? 'הגרלה גדולה' : 'הגרלה'}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        {!user && (
          <section className="text-center bg-gradient-to-r from-ba-blue-700 to-ba-blue-900 rounded-3xl p-10 text-white">
            <h2 className="text-3xl font-black mb-4">מוכן להצטרף?</h2>
            <p className="text-blue-200 text-lg mb-6">הרשמה חינמית, ל-20 ימים של למידה ושמחה!</p>
            <Link href="/register" className="inline-block bg-ba-gold text-yellow-900 px-10 py-4 rounded-2xl font-black text-xl hover:bg-yellow-300 active:scale-95 transition-all shadow-xl">
              הרשמה עכשיו 🚀
            </Link>
          </section>
        )}
      </div>

      <footer className="text-center py-8 text-ba-blue-400 text-sm border-t border-blue-100 mt-8">
        <div className="font-bold text-ba-blue-600 mb-1">ישיבת בני עקיבא עלי</div>
        <div>חידון הלכות פסח תשפ"ו • "לשנה הבאה בירושלים"</div>
      </footer>
    </div>
  )
}
