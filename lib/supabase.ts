import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get current quiz day (1-indexed, based on start date)
export function getCurrentDay(): number {
  const startDate = new Date(process.env.NEXT_PUBLIC_START_DATE || '2025-04-01')
  startDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = today.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, Math.min(20, diffDays))
}

// Check if a given day is available (not in the future)
export function isDayAvailable(day: number): boolean {
  return day <= getCurrentDay()
}

export async function getParticipantByEmail(email: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()
  if (error) return null
  return data
}

export async function registerParticipant(name: string, className: string, email: string, avatar?: string) {
  const { data, error } = await supabase
    .from('participants')
    .insert({ name, class: className, email: email.toLowerCase(), total_points: 0, streak: 0, last_quiz_day: 0, ...(avatar ? { avatar } : {}) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateParticipantAvatar(id: string, avatar: string) {
  const { error } = await supabase
    .from('participants')
    .update({ avatar })
    .eq('id', id)
  if (error) throw error
}

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .limit(limit)
  if (error) {
    // Fallback: query participants directly
    const { data: fallback } = await supabase
      .from('participants')
      .select('id, name, class, total_points, streak')
      .order('total_points', { ascending: false })
      .limit(limit)
    return fallback || []
  }
  return data || []
}

export async function hasCompletedDay(participantId: string, day: number): Promise<boolean> {
  const { data } = await supabase
    .from('quiz_completions')
    .select('id')
    .eq('participant_id', participantId)
    .eq('day_number', day)
    .single()
  return !!data
}

export async function submitQuizCompletion(
  participantId: string,
  dayNumber: number,
  score: number,
  answers: unknown[],
  isCatchup = false,
) {
  // Save completion
  const { error: completionError } = await supabase
    .from('quiz_completions')
    .insert({ participant_id: participantId, day_number: dayNumber, score, answers, is_catchup: isCatchup })
  if (completionError) throw completionError

  // Update total points and streak
  const { data: participant } = await supabase
    .from('participants')
    .select('total_points, streak, last_quiz_day')
    .eq('id', participantId)
    .single()

  if (participant) {
    const newStreak = participant.last_quiz_day === dayNumber - 1 ? participant.streak + 1 : 1
    await supabase
      .from('participants')
      .update({
        total_points: participant.total_points + score,
        streak: newStreak,
        last_quiz_day: dayNumber,
      })
      .eq('id', participantId)
  }
}

export async function hasCompletedChallenge(participantId: string, day: number): Promise<boolean> {
  const { data } = await supabase
    .from('challenge_completions')
    .select('id')
    .eq('participant_id', participantId)
    .eq('day_number', day)
    .single()
  return !!data
}

export async function submitChallengeCompletion(
  participantId: string,
  dayNumber: number,
  score: number,
  answers: unknown[]
) {
  const { error } = await supabase
    .from('challenge_completions')
    .insert({ participant_id: participantId, day_number: dayNumber, score, answers })
  if (error) throw error

  // Challenge points also count toward total
  const { data: participant } = await supabase
    .from('participants')
    .select('total_points')
    .eq('id', participantId)
    .single()

  if (participant) {
    await supabase
      .from('participants')
      .update({ total_points: participant.total_points + score })
      .eq('id', participantId)
  }
}

export async function getLotteries() {
  const { data } = await supabase
    .from('lotteries')
    .select('*')
    .order('held_at', { ascending: false })
  return data || []
}

export async function getQuestions() {
  const { data } = await supabase
    .from('questions')
    .select('id, day_number, question, options, correct_index')
    .order('day_number')
  return data || []
}

export async function updateQuestion(
  id: string,
  updates: { question?: string; options?: string[]; correct_index?: number },
) {
  const { error } = await supabase.from('questions').update(updates).eq('id', id)
  if (error) throw error
}

export async function getQuizConfig() {
  const { data } = await supabase
    .from('quiz_config')
    .select('*')
    .eq('id', 1)
    .single()
  return data || null
}

export async function saveQuizConfig(config: Record<string, unknown>) {
  const { error } = await supabase
    .from('quiz_config')
    .upsert({ id: 1, ...config, updated_at: new Date().toISOString() })
  if (error) throw error
}
