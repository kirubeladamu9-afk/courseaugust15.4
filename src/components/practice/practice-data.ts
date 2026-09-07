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

export const practice_exams: PracticeExam[] = [
  { id: 1, title: 'Grade 8 Mathematics Foundations', subject: 'Mathematics', grade: 'Grade 8', price: 8, published: true },
  { id: 2, title: 'Biology Essentials Practice', subject: 'Biology', grade: 'Grade 10', price: 10, published: true },
  { id: 3, title: 'Draft: Intro to Physics', subject: 'Physics', grade: 'Grade 10', price: 9, published: false },
]

export const practice_questions: PracticeQuestion[] = [
  { id: 1, exam_id: 1, question_text: 'What is the value of 3² + 4²?', options: ['12', '25', '49', '7'], correct_answer: '25', explanation: '3² is 9 and 4² is 16. Adding them gives 25.' },
  { id: 2, exam_id: 1, question_text: 'Which fraction is equivalent to 3/4?', options: ['6/8', '4/6', '9/16', '12/20'], correct_answer: '6/8', explanation: 'Multiplying both the numerator and denominator of 3/4 by 2 gives 6/8.' },
  { id: 3, exam_id: 1, question_text: 'A line has a slope of 2 and crosses the y-axis at 3. Which equation describes it?', options: ['y = 3x + 2', 'y = 2x + 3', 'y = x + 5', 'y = 2x - 3'], correct_answer: 'y = 2x + 3', explanation: 'Slope-intercept form is y = mx + b. Here m is 2 and b is 3.' },
  { id: 4, exam_id: 2, question_text: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondrion', 'Cell wall'], correct_answer: 'Mitochondrion', explanation: 'Mitochondria produce most of the usable energy for a cell in the form of ATP.' },
  { id: 5, exam_id: 2, question_text: 'What process do plants use to turn light energy into chemical energy?', options: ['Respiration', 'Photosynthesis', 'Diffusion', 'Transpiration'], correct_answer: 'Photosynthesis', explanation: 'Photosynthesis uses light energy, water, and carbon dioxide to make glucose and oxygen.' },
]

export const purchases: PracticePurchase[] = [
  { id: 1, user_id: 1, exam_id: 1, purchased_at: '2025-02-14T10:00:00.000Z' },
]

export const getPracticeExam = (examId: number) => practice_exams.find((exam) => exam.id === examId)
export const getPracticeQuestions = (examId: number) => practice_questions.filter((question) => question.exam_id === examId)
