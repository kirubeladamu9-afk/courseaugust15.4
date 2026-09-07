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
