import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { navigateTo } from '@/lib/navigation'
import { getPracticeExam } from '@/services/api'
import { type PracticeExamWithQuestions } from './practice-data'

interface PracticeExamPlayerProps { examId: number; darkMode: boolean; onToggleDarkMode: () => void }

const PracticeExamPlayer: React.FC<PracticeExamPlayerProps> = ({ examId, darkMode, onToggleDarkMode }) => {
  const [exam, setExam] = useState<PracticeExamWithQuestions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  useEffect(() => {
    let active = true
    getPracticeExam(examId).then((record) => { if (active) setExam(record) }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load this practice exam.') })
    return () => { active = false }
  }, [examId])

  if (!exam && !error) return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}><Header darkMode={darkMode} onSignIn={() => navigateTo('/')} onToggleDarkMode={onToggleDarkMode} /><Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress aria-label="Loading practice exam" /></Box></Box>
  if (error || !exam || exam.questions.length === 0) return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}><Header darkMode={darkMode} onSignIn={() => navigateTo('/')} onToggleDarkMode={onToggleDarkMode} /><Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 8 }}><Alert severity="info" sx={{ mb: 3 }}>{error ?? 'This practice exam has no questions yet.'}</Alert><Button variant="contained" onClick={() => navigateTo('/practice-exams')}>Browse practice exams</Button></Box></Box>

  const question = exam.questions[questionIndex]
  const answered = selectedAnswer !== null
  const isCorrect = selectedAnswer === question.correct_answer
  const finished = questionIndex === exam.questions.length - 1 && answered
  const chooseAnswer = (answer: string) => { if (!answered) { setSelectedAnswer(answer); if (answer === question.correct_answer) setCorrectCount((count) => count + 1) } }
  const nextQuestion = () => { if (!finished) { setQuestionIndex((index) => index + 1); setSelectedAnswer(null) } }

  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}><Header darkMode={darkMode} onSignIn={() => navigateTo('/')} onToggleDarkMode={onToggleDarkMode} /><Box component="main" sx={{ maxWidth: 840, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}><Button startIcon={<ArrowBackIcon />} onClick={() => navigateTo('/practice-exams')} sx={{ mb: 3 }}>All practice exams</Button><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}><Box><Stack direction="row" spacing={1} sx={{ mb: 1 }}><Chip label={exam.subject} size="small" color="primary" variant="outlined" /><Chip label={exam.grade} size="small" /></Stack><Typography variant="h4">{exam.title}</Typography></Box><Typography color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{correctCount}/{exam.questions.length} so far</Typography></Stack><LinearProgress variant="determinate" value={((questionIndex + (answered ? 1 : 0)) / exam.questions.length) * 100} sx={{ height: 8, borderRadius: 4, mb: 4 }} /><Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: 1, borderColor: 'divider' }}><Typography color="text.secondary" variant="overline">Question {questionIndex + 1} of {exam.questions.length}</Typography><Typography variant="h5" sx={{ mt: 1, mb: 3, lineHeight: 1.35 }}>{question.question_text}</Typography><Stack spacing={1.5} role="radiogroup" aria-label="Answer options">{question.options.map((option) => { const isSelected = selectedAnswer === option; const isAnswer = option === question.correct_answer; const color = answered && isAnswer ? 'success.main' : answered && isSelected ? 'error.main' : 'divider'; return <Button key={option} variant="outlined" onClick={() => chooseAnswer(option)} disabled={answered} sx={{ justifyContent: 'space-between', textAlign: 'left', textTransform: 'none', p: 1.75, borderColor: color, color: answered && (isAnswer || isSelected) ? color : 'text.primary', '&:hover': { borderColor: color, backgroundColor: 'action.hover' } }}>{option}{answered && isAnswer && <CheckCircleOutlineIcon color="success" />}</Button> })}</Stack>{answered && <Alert severity={isCorrect ? 'success' : 'info'} sx={{ mt: 3 }}><Typography sx={{ fontWeight: 700, mb: 0.5 }}>{isCorrect ? 'Correct!' : `Not quite — the answer is ${question.correct_answer}.`}</Typography>{question.explanation}</Alert>}{answered && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}><Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => { if (finished) navigateTo('/dashboard'); else nextQuestion() }}>{finished ? 'Back to My Purchases' : 'Next Question'}</Button></Box>}</Paper>{finished && <Paper elevation={0} sx={{ mt: 2, p: 2.5, border: 1, borderColor: 'primary.light', backgroundColor: 'action.hover' }}><Typography sx={{ fontWeight: 700 }}>You’ve reached the end of this practice set.</Typography><Typography color="text.secondary" variant="body2">This is a learning tally, not a graded result.</Typography></Paper>}</Box><Footer /></Box>
}

export default PracticeExamPlayer
