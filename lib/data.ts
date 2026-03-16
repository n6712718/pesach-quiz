import { topicsPart1, questionsPart1 } from './data-part1'
import { topicsPart2, questionsPart2 } from './data-part2'
import { topicsPart3, questionsPart3 } from './data-part3'
import { topicsPart4, questionsPart4 } from './data-part4'
import { topicsPart5, questionsPart5 } from './data-part5'
import type { Topic, Question } from './types'

export const ALL_TOPICS: Topic[] = [
  ...topicsPart1,
  ...topicsPart2,
  ...topicsPart3,
  ...topicsPart4,
  ...topicsPart5,
].sort((a, b) => a.dayNumber - b.dayNumber)

export const ALL_QUESTIONS: Question[] = [
  ...questionsPart1,
  ...questionsPart2,
  ...questionsPart3,
  ...questionsPart4,
  ...questionsPart5,
].sort((a, b) => a.dayNumber - b.dayNumber || a.orderNum - b.orderNum)

export function getTopicByDay(day: number): Topic | undefined {
  return ALL_TOPICS.find(t => t.dayNumber === day)
}

export function getQuestionsByDay(day: number): Question[] {
  return ALL_QUESTIONS.filter(q => q.dayNumber === day)
}

export const CLASSES = [
  'ז1',
  'ז2',
  'ז3',
  'ח1',
  'ח2',
  'ח3',
  'ח4',
]
