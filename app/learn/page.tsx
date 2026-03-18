'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { getCurrentDay, isDayAvailable, hasCompletedDay, submitQuizCompletion, hasCompletedChallenge, submitChallengeCompletion } from '@/lib/supabase'
import { ALL_TOPICS, getTopicByDay, getQuestionsByDay } from '@/lib/data'
import { challengeTopics, challengeQuestions } from '@/lib/data-challenge'
import type { Participant, Question, QuizAnswer } from '@/lib/types'

function getChallengeTopicByDay(day: number) {
  return challengeTopics.find(t => t.dayNumber === day)
}
function getChallengeQuestionsByDay(day: number) {
  return challengeQuestions.filter((q: Question) => q.dayNumber === day)
}

type Phase = 'topic-list' | 'reading' | 'quiz' | 'result' | 'challenge-reading' | 'challenge-quiz' | 'challenge-result'

export default function LearnPage() {
  const router = useRouter()
  const [user, setUser] = useState<Participant | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [phase, setPhase] = useState<Phase>('topic-list')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set())
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const currentDay = getCurrentDay()

  useEffect(() => {
    const stored = localStorage.getItem('pesach_user')
    if (!stored) { router.push('/register'); return }
    const u = JSON.parse(stored)
    setUser(u)
    // Check completed days
    checkCompletions(u.id)
  }, [router])

  async function checkCompletions(userId: string) {
    const completed = new Set<number>()
    const challenges = new Set<number>()
    for (let d = 1; d <= currentDay; d++) {
      const done = await hasCompletedDay(userId, d)
      if (done) completed.add(d)
      const challengeDone = await hasCompletedChallenge(userId, d)
      if (challengeDone) challenges.add(d)
    }
    setCompletedDays(completed)
    setCompletedChallenges(challenges)
    // Default to today or first incomplete
    const today = getCurrentDay()
    setSelectedDay(today)
  }

  function startDay(day: number) {
    setSelectedDay(day)
    setPhase('reading')
    setAnswers([])
    setCurrentQ(0)
    setSelected(null)
  }

  function shuffleOptions(q: Question): Question {
    const keys = ['a', 'b', 'c', 'd'] as const
    const opts = keys.map(k => ({ k, text: q[`option${k.toUpperCase() as 'A'|'B'|'C'|'D'}`] }))
    const correctText = q[`option${q.correctAnswer.toUpperCase() as 'A'|'B'|'C'|'D'}`]
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]]
    }
    return {
      ...q,
      optionA: opts[0].text,
      optionB: opts[1].text,
      optionC: opts[2].text,
      optionD: opts[3].text,
      correctAnswer: keys[opts.findIndex(o => o.text === correctText)],
    }
  }

  function startQuiz() {
    const qs = getQuestionsByDay(selectedDay).map(shuffleOptions)
    setQuestions(qs)
    setPhase('quiz')
    setCurrentQ(0)
    setSelected(null)
    setShowExplanation(false)
  }

  function selectAnswer(opt: string) {
    if (selected) return
    setSelected(opt)
    setShowExplanation(true)
  }

  function nextQuestion() {
    const q = questions[currentQ]
    const isCorrect = selected === q.correctAnswer
    const newAnswers = [...answers, {
      questionIndex: currentQ,
      selected: selected || '',
      isCorrect,
      points: isCorrect ? q.points : 0,
    }]
    setAnswers(newAnswers)

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1)
      setSelected(null)
      setShowExplanation(false)
    } else {
      finishQuiz(newAnswers)
    }
  }

  const finishQuiz = useCallback(async (finalAnswers: QuizAnswer[]) => {
    const score = finalAnswers.reduce((s, a) => s + a.points, 0)
    setPhase('result')
    if (!user || submitting) return
    setSubmitting(true)
    try {
      await submitQuizCompletion(user.id, selectedDay, score, finalAnswers, selectedDay < currentDay)
      // Update local user
      const updated = { ...user, total_points: user.total_points + score }
      setUser(updated)
      localStorage.setItem('pesach_user', JSON.stringify(updated))
      setCompletedDays(prev => { const s = new Set(prev); s.add(selectedDay); return s })
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }, [user, selectedDay, submitting])

  function startChallenge() {
    setPhase('challenge-reading')
    setAnswers([])
    setCurrentQ(0)
    setSelected(null)
  }

  function startChallengeQuiz() {
    const qs = getChallengeQuestionsByDay(selectedDay).map(shuffleOptions)
    setQuestions(qs)
    setPhase('challenge-quiz')
    setCurrentQ(0)
    setSelected(null)
    setShowExplanation(false)
  }

  const finishChallengeQuiz = useCallback(async (finalAnswers: QuizAnswer[]) => {
    const score = finalAnswers.reduce((s, a) => s + a.points, 0)
    setPhase('challenge-result')
    if (!user || submitting) return
    setSubmitting(true)
    try {
      await submitChallengeCompletion(user.id, selectedDay, score, finalAnswers)
      const updated = { ...user, total_points: user.total_points + score }
      setUser(updated)
      localStorage.setItem('pesach_user', JSON.stringify(updated))
      setCompletedChallenges(prev => { const s = new Set(prev); s.add(selectedDay); return s })
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }, [user, selectedDay, submitting])

  const topic = getTopicByDay(selectedDay)
  const totalScore = answers.reduce((s, a) => s + a.points, 0)
  const correctCount = answers.filter(a => a.isCorrect).length
  const todayCompleted = completedDays.has(currentDay)
  const missedDays = Array.from({ length: currentDay - 1 }, (_, i) => i + 1)
    .filter(d => !completedDays.has(d))

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Topic list phase */}
        {phase === 'topic-list' && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-black text-ba-blue-800 mb-2">📚 לימוד יומי</h1>
            <p className="text-gray-500 mb-8">בחר יום ללמוד ולענות על שאלות</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_TOPICS.map(t => {
                const available = isDayAvailable(t.dayNumber)
                const done = completedDays.has(t.dayNumber)
                const isToday = t.dayNumber === currentDay
                return (
                  <button
                    key={t.dayNumber}
                    onClick={() => available && startDay(t.dayNumber)}
                    disabled={!available}
                    className={`card text-right transition-all relative ${
                      available
                        ? isToday
                          ? 'border-2 border-ba-blue-500 hover:shadow-xl cursor-pointer animate-pulse-gold'
                          : 'hover:shadow-xl cursor-pointer border-transparent hover:border-ba-blue-200'
                        : 'opacity-40 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    {isToday && <span className="absolute top-3 left-3 bg-ba-gold text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">היום</span>}
                    {done && <span className="absolute top-3 left-3 text-green-500 text-xl">✅</span>}
                    {!available && <span className="absolute top-3 left-3 text-gray-400 text-lg">🔒</span>}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                        done ? 'bg-green-100 text-green-700' : isToday ? 'bg-ba-blue-700 text-white' : 'bg-ba-blue-100 text-ba-blue-700'
                      }`}>
                        {t.dayNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-ba-blue-500 text-xs mb-0.5">יום {t.dayNumber}</div>
                        <div className="font-bold text-ba-blue-800 text-sm leading-tight">{t.title}</div>
                        <div className="text-gray-400 text-xs mt-0.5 truncate">{t.source}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Catch-up section */}
            {missedDays.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-black text-ba-blue-800 mb-2">📚 השלמת ימים קודמים</h2>
                {!todayCompleted ? (
                  <div className="card bg-gray-50 border-2 border-gray-200 text-center py-6">
                    <div className="text-3xl mb-2">🔒</div>
                    <div className="font-bold text-gray-600">השלם את הלימוד של היום כדי לפתוח ימים קודמים</div>
                    <div className="text-gray-400 text-sm mt-1">{missedDays.length} ימים ממתינים להשלמה</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {missedDays.map(d => {
                      const t = getTopicByDay(d)
                      return (
                        <button key={d} onClick={() => startDay(d)}
                          className="w-full card border-2 border-orange-200 bg-orange-50 hover:border-orange-400 hover:shadow-md transition-all text-right flex items-center gap-3 p-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center font-black text-orange-700 flex-shrink-0 text-sm">{d}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-orange-500 text-xs mb-0.5">יום {d}</div>
                            <div className="font-bold text-ba-blue-800 text-sm leading-tight">{t?.title}</div>
                          </div>
                          <span className="bg-orange-200 text-orange-700 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">לא הושלם</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reading phase */}
        {phase === 'reading' && topic && (
          <div className="animate-slide-up">
            <button onClick={() => setPhase('topic-list')} className="flex items-center gap-2 text-ba-blue-600 hover:text-ba-blue-800 mb-6 font-medium">
              ← חזרה לרשימה
            </button>
            <div className="card mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-ba-blue-700 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                  {topic.dayNumber}
                </div>
                <div>
                  <div className="text-ba-blue-500 text-sm">יום {topic.dayNumber} מתוך 20</div>
                  <h1 className="text-2xl font-black text-ba-blue-800">{topic.title}</h1>
                </div>
              </div>
              <div className="bg-ba-blue-50 rounded-2xl p-1 mb-4">
                <div className="flex items-center gap-2 px-3 py-2 text-ba-blue-600 text-sm font-medium">
                  <span>📖</span> {topic.source}
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{topic.content}</p>
              </div>
            </div>

            {completedDays.has(selectedDay) ? (
              <div className="card bg-green-50 border-green-200 text-center">
                <div className="text-4xl mb-2">✅</div>
                <div className="font-bold text-green-700 text-lg">כבר ענית על שאלות יום זה!</div>
                {getChallengeTopicByDay(selectedDay) && !completedChallenges.has(selectedDay) && (
                  <button onClick={startChallenge} className="mt-4 w-full bg-ba-gold text-yellow-900 py-4 rounded-2xl font-black text-lg hover:opacity-90 active:scale-95 transition-all shadow-md">
                    ⚡ גש לאתגר היום
                  </button>
                )}
                {completedChallenges.has(selectedDay) && (
                  <div className="mt-3 text-green-600 font-bold">⭐ השלמת את אתגר היום!</div>
                )}
                <button onClick={() => setPhase('topic-list')} className="mt-4 text-ba-blue-600 font-medium hover:underline">
                  חזרה לרשימת הנושאים
                </button>
              </div>
            ) : (
              <button onClick={startQuiz} className="w-full bg-ba-blue-700 text-white py-5 rounded-2xl font-black text-xl hover:bg-ba-blue-800 active:scale-95 transition-all shadow-xl">
                🚀 התחל שאלון (10 שאלות)
              </button>
            )}
          </div>
        )}

        {/* Quiz phase */}
        {phase === 'quiz' && questions.length > 0 && (
          <div className="animate-slide-up">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-ba-blue-600 font-bold text-sm">שאלה {currentQ + 1} מתוך {questions.length}</span>
                <span className="text-ba-blue-500 text-sm">{answers.reduce((s, a) => s + a.points, 0)} נקודות</span>
              </div>
              <div className="h-2 bg-ba-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ba-blue-700 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQ) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="card mb-4">
              <div className="text-ba-blue-500 text-sm font-medium mb-3">
                יום {selectedDay} – {topic?.title}
              </div>
              <h2 className="text-xl font-bold text-ba-blue-800 leading-relaxed mb-6">
                {questions[currentQ].question}
              </h2>

              <div className="space-y-3">
                {(['a', 'b', 'c', 'd'] as const).map(opt => {
                  const text = questions[currentQ][`option${opt.toUpperCase() as 'A' | 'B' | 'C' | 'D'}`]
                  const isCorrect = opt === questions[currentQ].correctAnswer
                  const isSelected = opt === selected
                  let style = 'border-2 border-ba-blue-200 hover:border-ba-blue-500 hover:bg-ba-blue-50 cursor-pointer'
                  if (selected) {
                    if (isCorrect) style = 'border-2 border-green-500 bg-green-50'
                    else if (isSelected) style = 'border-2 border-red-400 bg-red-50'
                    else style = 'border-2 border-gray-200 opacity-60'
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(opt)}
                      disabled={!!selected}
                      className={`w-full text-right p-4 rounded-xl flex items-center gap-3 transition-all ${style}`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        selected && isCorrect ? 'bg-green-500 text-white' :
                        selected && isSelected ? 'bg-red-400 text-white' :
                        'bg-ba-blue-100 text-ba-blue-700'
                      }`}>
                        {selected && isCorrect ? '✓' : selected && isSelected ? '✗' : opt.toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-700">{text}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className={`card mb-4 border-r-4 animate-slide-up ${
                selected === questions[currentQ].correctAnswer ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{selected === questions[currentQ].correctAnswer ? '🎉' : '💡'}</span>
                  <span className="font-bold text-lg">
                    {selected === questions[currentQ].correctAnswer ? `נכון! +${questions[currentQ].points} נקודות` : 'לא נכון'}
                  </span>
                </div>
                <p className="text-gray-700">{questions[currentQ].explanation}</p>
                <button onClick={nextQuestion} className="mt-4 w-full bg-ba-blue-700 text-white py-3 rounded-xl font-bold hover:bg-ba-blue-800 active:scale-95 transition-all">
                  {currentQ + 1 < questions.length ? 'שאלה הבאה ←' : 'סיום וצפייה בתוצאות'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Challenge reading phase */}
        {phase === 'challenge-reading' && (() => {
          const ct = getChallengeTopicByDay(selectedDay)
          if (!ct) return null
          return (
            <div className="animate-slide-up">
              <button onClick={() => setPhase('result')} className="flex items-center gap-2 text-ba-blue-600 hover:text-ba-blue-800 mb-6 font-medium">
                ← חזרה לתוצאות
              </button>
              <div className="card mb-6 border-2 border-ba-gold">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-ba-gold rounded-2xl flex items-center justify-center text-yellow-900 font-black text-xl">
                    ⚡
                  </div>
                  <div>
                    <div className="text-ba-gold text-sm font-bold">אתגר יום {ct.dayNumber}</div>
                    <h1 className="text-2xl font-black text-ba-blue-800">{ct.title}</h1>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-2xl p-1 mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-yellow-700 text-sm font-medium">
                    <span>📖</span> {ct.source}
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{ct.content}</p>
                </div>
              </div>
              <button onClick={startChallengeQuiz} className="w-full bg-ba-gold text-yellow-900 py-5 rounded-2xl font-black text-xl hover:opacity-90 active:scale-95 transition-all shadow-xl">
                ⚡ התחל אתגר ({getChallengeQuestionsByDay(selectedDay).length} שאלות)
              </button>
            </div>
          )
        })()}

        {/* Challenge quiz phase */}
        {phase === 'challenge-quiz' && questions.length > 0 && (() => {
          const ct = getChallengeTopicByDay(selectedDay)
          return (
            <div className="animate-slide-up">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ba-blue-600 font-bold text-sm">שאלה {currentQ + 1} מתוך {questions.length}</span>
                  <span className="text-ba-blue-500 text-sm">{answers.reduce((s, a) => s + a.points, 0)} נקודות</span>
                </div>
                <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ba-gold rounded-full transition-all duration-500"
                    style={{ width: `${((currentQ) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="card mb-4 border-2 border-ba-gold">
                <div className="text-yellow-700 text-sm font-medium mb-3">
                  ⚡ אתגר יום {selectedDay} – {ct?.title}
                </div>
                <h2 className="text-xl font-bold text-ba-blue-800 leading-relaxed mb-6">
                  {questions[currentQ].question}
                </h2>
                <div className="space-y-3">
                  {(['a', 'b', 'c', 'd'] as const).map(opt => {
                    const text = questions[currentQ][`option${opt.toUpperCase() as 'A' | 'B' | 'C' | 'D'}`]
                    const isCorrect = opt === questions[currentQ].correctAnswer
                    const isSelected = opt === selected
                    let style = 'border-2 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer'
                    if (selected) {
                      if (isCorrect) style = 'border-2 border-green-500 bg-green-50'
                      else if (isSelected) style = 'border-2 border-red-400 bg-red-50'
                      else style = 'border-2 border-gray-200 opacity-60'
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => { if (selected) return; setSelected(opt); setShowExplanation(true) }}
                        disabled={!!selected}
                        className={`w-full text-right p-4 rounded-xl flex items-center gap-3 transition-all ${style}`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                          selected && isCorrect ? 'bg-green-500 text-white' :
                          selected && isSelected ? 'bg-red-400 text-white' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {selected && isCorrect ? '✓' : selected && isSelected ? '✗' : opt.toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-700">{text}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {showExplanation && (
                <div className={`card mb-4 border-r-4 animate-slide-up ${
                  selected === questions[currentQ].correctAnswer ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{selected === questions[currentQ].correctAnswer ? '🎉' : '💡'}</span>
                    <span className="font-bold text-lg">
                      {selected === questions[currentQ].correctAnswer ? `נכון! +${questions[currentQ].points} נקודות` : 'לא נכון'}
                    </span>
                  </div>
                  <p className="text-gray-700">{questions[currentQ].explanation}</p>
                  <button
                    onClick={() => {
                      const q = questions[currentQ]
                      const isCorrect = selected === q.correctAnswer
                      const newAnswers = [...answers, { questionIndex: currentQ, selected: selected || '', isCorrect, points: isCorrect ? q.points : 0 }]
                      setAnswers(newAnswers)
                      if (currentQ + 1 < questions.length) {
                        setCurrentQ(currentQ + 1)
                        setSelected(null)
                        setShowExplanation(false)
                      } else {
                        finishChallengeQuiz(newAnswers)
                      }
                    }}
                    className="mt-4 w-full bg-ba-gold text-yellow-900 py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    {currentQ + 1 < questions.length ? 'שאלה הבאה ←' : 'סיום וצפייה בתוצאות'}
                  </button>
                </div>
              )}
            </div>
          )
        })()}

        {/* Challenge result phase */}
        {phase === 'challenge-result' && (
          <div className="animate-bounce-in text-center">
            <div className="card mb-6 border-2 border-ba-gold">
              <div className="text-7xl mb-4">
                {correctCount >= Math.ceil(questions.length * 0.8) ? '🏆' : correctCount >= Math.ceil(questions.length * 0.6) ? '⭐' : '📚'}
              </div>
              <div className="text-ba-gold font-bold text-sm mb-1">⚡ אתגר הושלם!</div>
              <h2 className="text-3xl font-black text-ba-blue-800 mb-2">
                {correctCount >= Math.ceil(questions.length * 0.8) ? 'מדהים!' : correctCount >= Math.ceil(questions.length * 0.6) ? 'יפה מאוד!' : 'כל הכבוד על הניסיון!'}
              </h2>
              <div className="text-5xl font-black text-ba-gold my-4">{totalScore}</div>
              <div className="text-gray-500 text-lg">נקודות אתגר הוספו לחשבונך</div>

              <div className="flex justify-center gap-8 mt-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-600">{correctCount}</div>
                  <div className="text-gray-500 text-sm">נכונות</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-red-400">{questions.length - correctCount}</div>
                  <div className="text-gray-500 text-sm">שגויות</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-ba-gold">{Math.round(correctCount / questions.length * 100)}%</div>
                  <div className="text-gray-500 text-sm">ציון</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => { setPhase('topic-list'); setAnswers([]) }} className="flex-1 btn-primary">
                  📚 חזרה לנושאים
                </button>
                <button onClick={() => router.push('/leaderboard')} className="flex-1 btn-secondary">
                  🏆 לוח מובילים
                </button>
              </div>
            </div>

            <div className="card text-right">
              <h3 className="text-xl font-black text-ba-blue-800 mb-4">סיכום תשובות</h3>
              {answers.map((ans, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${ans.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className={`text-xl ${ans.isCorrect ? 'text-green-500' : 'text-red-400'}`}>
                    {ans.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700 flex-1 text-sm">{questions[i]?.question}</span>
                  <span className={`font-bold text-sm ${ans.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                    {ans.isCorrect ? `+${ans.points}` : '0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && (
          <div className="animate-bounce-in text-center">
            <div className="card mb-6">
              <div className="text-7xl mb-4">
                {correctCount >= 8 ? '🏆' : correctCount >= 6 ? '⭐' : '📚'}
              </div>
              <h2 className="text-3xl font-black text-ba-blue-800 mb-2">
                {correctCount >= 8 ? 'מדהים!' : correctCount >= 6 ? 'יפה מאוד!' : 'כל הכבוד על הניסיון!'}
              </h2>
              <div className="text-5xl font-black text-ba-blue-700 my-4">{totalScore}</div>
              <div className="text-gray-500 text-lg">נקודות הוספו לחשבונך</div>

              <div className="flex justify-center gap-8 mt-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-600">{correctCount}</div>
                  <div className="text-gray-500 text-sm">נכונות</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-red-400">{questions.length - correctCount}</div>
                  <div className="text-gray-500 text-sm">שגויות</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-ba-blue-700">{Math.round(correctCount / questions.length * 100)}%</div>
                  <div className="text-gray-500 text-sm">ציון</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => { setPhase('topic-list'); setAnswers([]) }} className="flex-1 btn-primary">
                  📚 חזרה לנושאים
                </button>
                <button onClick={() => router.push('/leaderboard')} className="flex-1 btn-secondary">
                  🏆 לוח מובילים
                </button>
              </div>
              {getChallengeTopicByDay(selectedDay) && !completedChallenges.has(selectedDay) && (
                <button onClick={startChallenge} className="mt-4 w-full bg-ba-gold text-yellow-900 py-4 rounded-2xl font-black text-lg hover:opacity-90 active:scale-95 transition-all shadow-md">
                  ⚡ גש לאתגר היום
                </button>
              )}
              {completedChallenges.has(selectedDay) && (
                <div className="mt-4 text-center text-green-600 font-bold">⭐ השלמת את אתגר היום!</div>
              )}
            </div>

            {/* Review answers */}
            <div className="card text-right">
              <h3 className="text-xl font-black text-ba-blue-800 mb-4">סיכום תשובות</h3>
              {answers.map((ans, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${ans.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className={`text-xl ${ans.isCorrect ? 'text-green-500' : 'text-red-400'}`}>
                    {ans.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700 flex-1 text-sm">{questions[i]?.question}</span>
                  <span className={`font-bold text-sm ${ans.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                    {ans.isCorrect ? `+${ans.points}` : '0'}
                  </span>
                </div>
              ))}
            </div>

            {/* Catch-up section — shown after today's quiz or after a catch-up day */}
            {(selectedDay === currentDay || todayCompleted) && missedDays.length > 0 && (
              <div className="card mt-6 text-right border-2 border-orange-200 bg-orange-50">
                <h3 className="text-xl font-black text-ba-blue-800 mb-1">📚 השלמת ימים קודמים</h3>
                <p className="text-orange-600 text-sm mb-4">{missedDays.length} ימים שלא הושלמו — צבור נקודות מלאות על כל יום</p>
                <div className="space-y-3">
                  {missedDays.map(d => {
                    const t = getTopicByDay(d)
                    return (
                      <button key={d} onClick={() => startDay(d)}
                        className="w-full bg-white border-2 border-orange-200 hover:border-orange-400 hover:shadow-md transition-all rounded-2xl text-right flex items-center gap-3 p-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center font-black text-orange-700 flex-shrink-0 text-sm">{d}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-orange-500 text-xs mb-0.5">יום {d}</div>
                          <div className="font-bold text-ba-blue-800 text-sm leading-tight">{t?.title}</div>
                        </div>
                        <span className="bg-orange-200 text-orange-700 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap">לא הושלם</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
