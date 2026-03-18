export interface Participant {
  id: string
  name: string
  class: string
  email: string
  total_points: number
  streak: number
  last_quiz_day: number
  created_at: string
  avatar?: string
}

export interface Topic {
  dayNumber: number
  title: string
  content: string
  source: string
}

export interface Question {
  dayNumber: number
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'a' | 'b' | 'c' | 'd'
  explanation: string
  points: number
  orderNum: number
}

export interface QuizAnswer {
  questionIndex: number
  selected: string
  isCorrect: boolean
  points: number
}

export interface QuizCompletion {
  id: string
  participant_id: string
  day_number: number
  score: number
  answers: QuizAnswer[]
  completed_at: string
}

export interface ChallengeCompletion {
  id: string
  participant_id: string
  day_number: number
  score: number
  answers: QuizAnswer[]
  completed_at: string
}

export interface Lottery {
  id: string
  type: 'regular' | 'grand'
  winner_id: string
  winner_name: string
  winner_class: string
  description: string
  held_at: string
}

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  class: string
  total_points: number
  streak: number
  quizzes_completed: number
}
