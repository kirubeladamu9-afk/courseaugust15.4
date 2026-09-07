import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { useEffect, useState } from 'react'
import { createAdminPracticeExam, createAdminPracticeQuestion, getAdminPracticeExams, getAdminPracticeQuestions } from '@/services/api'
import { toast } from '@/components/toast'
import { type PracticeExam, type PracticeQuestion } from '@/components/practice/practice-data'

const emptyQuestion = (): Omit<PracticeQuestion, 'id' | 'exam_id'> => ({ question_text: '', topic: '', options: ['', '', '', ''], correct_answer: '', explanation: '' })
const emptyExam = (): Omit<PracticeExam, 'id'> => ({ title: '', subject: '', grade: '', price: 0, published: false })

const PracticeExamManagement: React.FC = () => {
  const [exams, setExams] = useState<PracticeExam[]>([])
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [questionDraft, setQuestionDraft] = useState(emptyQuestion)
  const [examDraft, setExamDraft] = useState(emptyExam)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminPracticeExams().then((records) => { setExams(records); setSelectedExamId(records[0]?.id ?? null) }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load practice exams.')).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (selectedExamId === null) { setQuestions([]); return }
    getAdminPracticeQuestions(selectedExamId).then(setQuestions).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load practice questions.'))
  }, [selectedExamId])

  const saveExam = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const created = await createAdminPracticeExam(examDraft)
      setExams((current) => [created, ...current])
      setSelectedExamId(created.id)
      setExamDraft(emptyExam())
      toast.add({ title: 'Practice exam saved', description: 'The exam package was added to the database.', type: 'success' })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save practice exam.') } finally { setIsSaving(false) }
  }

  const saveQuestion = async (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedExamId === null) return
    setIsSaving(true)
    try {
      const created = await createAdminPracticeQuestion(selectedExamId, questionDraft)
      setQuestions((current) => [...current, created])
      setQuestionDraft(emptyQuestion())
      toast.add({ title: 'Question saved', description: 'The practice question was added to the database.', type: 'success' })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save practice question.') } finally { setIsSaving(false) }
  }

  return <Stack spacing={3}><Box><Typography variant="h4" sx={{ mb: 0.5 }}>Practice Exams</Typography><Typography color="text.secondary">Create relaxed, self-paced practice sets with immediate explanations. These are separate from timed course quizzes.</Typography></Box>{error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}{isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading practice exams" /></Box> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 2.5 }}><Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Typography variant="h6" sx={{ mb: 0.5 }}>Practice exam packages</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Packages currently stored in the database.</Typography>{exams.length === 0 ? <Alert severity="info" sx={{ mb: 3 }}>No practice exams have been created yet.</Alert> : <Stack spacing={1.25} sx={{ mb: 3 }}>{exams.map((exam) => <Box key={exam.id} component="button" type="button" onClick={() => setSelectedExamId(exam.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', p: 1.25, textAlign: 'left', border: 1, borderColor: selectedExamId === exam.id ? 'primary.main' : 'divider', borderRadius: 1.5, backgroundColor: 'transparent', cursor: 'pointer', font: 'inherit' }}><Box sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{exam.title}</Typography><Typography variant="caption" color="text.secondary">{exam.subject} · {exam.grade} · ${exam.price}</Typography></Box><Chip label={exam.published ? 'Published' : 'Draft'} size="small" color={exam.published ? 'success' : 'warning'} /></Box>)}</Stack>}<Box component="form" onSubmit={(event) => void saveExam(event)} sx={{ display: 'grid', gap: 1.5 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Add package</Typography><TextField required label="Title" value={examDraft.title} onChange={(event) => setExamDraft({ ...examDraft, title: event.target.value })} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField required fullWidth label="Subject" value={examDraft.subject} onChange={(event) => setExamDraft({ ...examDraft, subject: event.target.value })} /><TextField required fullWidth label="Grade" value={examDraft.grade} onChange={(event) => setExamDraft({ ...examDraft, grade: event.target.value })} /></Stack><TextField required type="number" label="Price" inputProps={{ min: 0, step: 0.01 }} value={examDraft.price} onChange={(event) => setExamDraft({ ...examDraft, price: Number(event.target.value) })} /><FormControlLabel control={<Switch checked={examDraft.published} onChange={(event) => setExamDraft({ ...examDraft, published: event.target.checked })} />} label="Publish in public catalog" /><Button type="submit" variant="outlined" disabled={isSaving} startIcon={<AddIcon />}>Add practice exam</Button></Box></CardContent></Card><Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}><Box><Typography variant="h6">Questions</Typography><Typography color="text.secondary" variant="body2">{exams.find((exam) => exam.id === selectedExamId)?.title ?? 'Create or select an exam'} · {questions.length} saved</Typography></Box><Chip label="No timer" color="primary" variant="outlined" /></Stack>{selectedExamId === null ? <Alert severity="info">Create a package before adding questions.</Alert> : <><Stack spacing={1} sx={{ mb: 3 }}>{questions.map((item, index) => <Box key={item.id} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 600 }}>Question {index + 1}: {item.question_text}</Typography><Typography variant="caption" color="text.secondary">Answer: {item.correct_answer}</Typography></Box>)}</Stack><Box component="form" onSubmit={(event) => void saveQuestion(event)} sx={{ display: 'grid', gap: 1.5 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Add question</Typography><TextField required multiline minRows={3} label="Question text" value={questionDraft.question_text} onChange={(event) => setQuestionDraft({ ...questionDraft, question_text: event.target.value })} /><Typography variant="body2" color="text.secondary">Answer options</Typography>{questionDraft.options.map((option, index) => <TextField key={index} required label={`Option ${index + 1}`} value={option} onChange={(event) => setQuestionDraft({ ...questionDraft, options: questionDraft.options.map((current, currentIndex) => currentIndex === index ? event.target.value : current) })} />)}<TextField required label="Correct answer" helperText="Enter the exact option text." value={questionDraft.correct_answer} onChange={(event) => setQuestionDraft({ ...questionDraft, correct_answer: event.target.value })} /><TextField required multiline minRows={3} label="Explanation" helperText="Shown immediately after the learner answers." value={questionDraft.explanation} onChange={(event) => setQuestionDraft({ ...questionDraft, explanation: event.target.value })} /><Alert severity="info">Practice mode gives feedback immediately and does not track timer, tab switches, or anti-cheat events.</Alert><Button type="submit" variant="contained" disabled={isSaving} startIcon={<SaveOutlinedIcon />}>Save question</Button></Box></>}</CardContent></Card></Box>}</Stack>
}

export default PracticeExamManagement
