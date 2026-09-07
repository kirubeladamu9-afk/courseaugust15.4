export interface PracticeExam {
  id: number
  title: string
  subject: string
  grade: string
  price: number
  published: boolean
}

export interface PracticeQuestion {
  id: number
  exam_id: number
  question_text: string
  options: string[]
  correct_answer: string
  explanation: string
}

export interface PracticePurchase {
  id: number
  user_id: number
  exam_id: number
  purchased_at: string
}

export interface PracticeExamWithQuestions extends PracticeExam {
  questions: PracticeQuestion[]
}

export interface PracticeResult {
  correct: number
  total: number
  completedAt: string
}

const practiceResultsKey = 'coursespace-practice-results'

export const getPracticeResults = (): Record<number, PracticeResult> => {
  try {
    const stored = JSON.parse(localStorage.getItem(practiceResultsKey) ?? '{}')
    return stored && typeof stored === 'object' ? stored as Record<number, PracticeResult> : {}
  } catch {
    return {}
  }
}

export const savePracticeResult = (examId: number, result: PracticeResult) => {
  localStorage.setItem(practiceResultsKey, JSON.stringify({ ...getPracticeResults(), [examId]: result }))
}
