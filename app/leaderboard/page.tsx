'use client'
import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import { supabase } from '@/lib/supabase'
import { getLotteries } from '@/lib/supabase'
import type { Lottery } from '@/lib/types'

interface LeaderEntry {
  id: string
  name: string
  class: string
  total_points: number
  streak: number
  last_quiz_day: number
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'lotteries'>('leaderboard')

  const fetchLeaders = useCallback(async () => {
    const { data } = await supabase
      .from('participants')
      .select('id, name, class, total_points, streak, last_quiz_day')
      .order('total_points', { ascending: false })
      .limit(100)
    setLeaders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('pesach_user')
    if (stored) setMyId(JSON.parse(stored).id)

    fetchLeaders()
    getLotteries().then(setLotteries)

    // Real-time subscription
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        fetchLeaders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchLeaders])

  const myRank = leaders.findIndex(l => l.id === myId) + 1

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-ba-blue-800 mb-2">🏆 לוח מובילים</h1>
          <p className="text-gray-500">עדכון בזמן אמת • חידון הלכות פסח תשפ"ו</p>
          {myRank > 0 && (
            <div className="inline-block mt-3 bg-ba-blue-700 text-white px-5 py-2 rounded-2xl font-bold">
              הדירוג שלי: #{myRank}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-ba-blue-50 rounded-2xl p-1 border border-ba-blue-200">
          <button onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'leaderboard' ? 'bg-ba-blue-700 text-white shadow' : 'text-ba-blue-600'}`}>
            🏆 דירוג
          </button>
          <button onClick={() => setActiveTab('lotteries')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'lotteries' ? 'bg-ba-blue-700 text-white shadow' : 'text-ba-blue-600'}`}>
            🎲 הגרלות {lotteries.length > 0 && <span className="bg-ba-gold text-yellow-900 rounded-full px-2 text-xs mr-1">{lotteries.length}</span>}
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <div>
            {/* Top 3 podium */}
            {!loading && leaders.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-8">
                {/* 2nd */}
                <div className="text-center flex-1">
                  <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-black text-gray-500 border-4 border-gray-300">
                    {leaders[1].name.charAt(0)}
                  </div>
                  <div className="bg-gray-100 rounded-t-2xl px-3 py-4 h-24 flex flex-col justify-end items-center border-2 border-gray-200">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="font-bold text-gray-700 text-sm truncate w-full text-center">{leaders[1].name}</div>
                    <div className="text-gray-500 text-xs">{leaders[1].total_points} נק'</div>
                  </div>
                </div>
                {/* 1st */}
                <div className="text-center flex-1">
                  <div className="w-16 h-16 bg-ba-gold rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-black text-yellow-900 border-4 border-yellow-400 shadow-lg">
                    {leaders[0].name.charAt(0)}
                  </div>
                  <div className="bg-ba-gold/20 rounded-t-2xl px-3 py-4 h-32 flex flex-col justify-end items-center border-2 border-ba-gold">
                    <div className="text-3xl mb-1">🥇</div>
                    <div className="font-black text-ba-blue-800 truncate w-full text-center">{leaders[0].name}</div>
                    <div className="text-ba-blue-600 text-sm font-bold">{leaders[0].total_points} נק'</div>
                  </div>
                </div>
                {/* 3rd */}
                <div className="text-center flex-1">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-black text-amber-700 border-4 border-amber-300">
                    {leaders[2].name.charAt(0)}
                  </div>
                  <div className="bg-amber-50 rounded-t-2xl px-3 py-4 h-20 flex flex-col justify-end items-center border-2 border-amber-200">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="font-bold text-gray-700 text-sm truncate w-full text-center">{leaders[2].name}</div>
                    <div className="text-gray-500 text-xs">{leaders[2].total_points} נק'</div>
                  </div>
                </div>
              </div>
            )}

            {/* Full list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl shimmer" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {leaders.map((entry, i) => {
                  const isMe = entry.id === myId
                  return (
                    <div key={entry.id} className={`card flex items-center gap-4 transition-all hover:shadow-lg ${isMe ? 'border-2 border-ba-blue-500 bg-ba-blue-50' : ''}`}>
                      {/* Rank */}
                      <div className={`rank-circle flex-shrink-0 ${
                        i === 0 ? 'bg-ba-gold text-yellow-900' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        i === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-ba-blue-50 text-ba-blue-700'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 bg-ba-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{entry.name.charAt(0)}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ba-blue-800 truncate">{entry.name}</span>
                          {isMe && <span className="text-xs bg-ba-blue-700 text-white px-2 py-0.5 rounded-full">אתה</span>}
                          {entry.streak >= 3 && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">🔥 {entry.streak}</span>}
                        </div>
                        <div className="text-gray-500 text-sm">{entry.class}</div>
                      </div>

                      {/* Points */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-black text-ba-blue-700 text-lg">{entry.total_points}</div>
                        <div className="text-gray-400 text-xs">נקודות</div>
                      </div>
                    </div>
                  )
                })}
                {leaders.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">🏆</div>
                    <div className="text-lg font-bold">עדיין אין משתתפים</div>
                    <div className="text-sm">היה הראשון!</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lotteries' && (
          <div>
            {lotteries.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-6xl mb-4">🎲</div>
                <div className="text-xl font-bold mb-2">ההגרלות יתחילו בקרוב!</div>
                <div className="text-sm">הגרלה ראשונה – לאחר 3 ימים</div>
              </div>
            ) : (
              <div className="space-y-4">
                {lotteries.map(lottery => (
                  <div key={lottery.id} className="card border-r-4 border-ba-gold">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{lottery.type === 'grand' ? '🏆' : '🎲'}</div>
                      <div className="flex-1">
                        <div className="font-black text-ba-blue-800 text-lg">{lottery.winner_name}</div>
                        <div className="text-gray-500">{lottery.winner_class}</div>
                        <div className="text-gray-400 text-sm mt-1">{lottery.description}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${lottery.type === 'grand' ? 'bg-ba-gold text-yellow-900' : 'bg-ba-blue-100 text-ba-blue-700'}`}>
                        {lottery.type === 'grand' ? 'הגרלה גדולה' : 'הגרלה'}
                      </div>
                    </div>
                    <div className="text-gray-400 text-xs mt-3">
                      {new Date(lottery.held_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
