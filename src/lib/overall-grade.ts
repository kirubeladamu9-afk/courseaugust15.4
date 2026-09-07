export interface OverallGrade {
  percentage: number
  letter: 'A' | 'B' | 'C' | 'D' | 'F'
}

type LiveLesson = { id: number; scheduledAt?: string }

const getLetterGrade = (percentage: number): OverallGrade['letter'] => percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'

export const calculateOverallGrade = ({
  quizLessonIds,
  quizScores,
  attendance,
  liveLessons,
  completionPercentage,
  isClass,
  now = new Date(),
}: {
  quizLessonIds: number[]
  quizScores: Record<number, number | undefined>
  attendance: Record<number, 'Present' | 'Absent'>
  liveLessons: LiveLesson[]
  completionPercentage: number
  isClass: boolean
  now?: Date
}): OverallGrade => {
  const quizAverage = quizLessonIds.reduce((total, lessonId) => total + (quizScores[lessonId] ?? 0), 0) / Math.max(1, quizLessonIds.length)
  const heldSessions = liveLessons.filter((lesson) => lesson.scheduledAt && new Date(lesson.scheduledAt).getTime() <= now.getTime())
  const attendanceRate = heldSessions.filter((lesson) => attendance[lesson.id] === 'Present').length / Math.max(1, heldSessions.length) * 100
  const percentage = Math.round(isClass
    ? quizAverage * 0.6 + attendanceRate * 0.25 + completionPercentage * 0.15
    : quizAverage * 0.8 + completionPercentage * 0.2)

  return { percentage, letter: getLetterGrade(percentage) }
}
