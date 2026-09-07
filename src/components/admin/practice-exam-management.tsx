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
import { createAdminPracticeExam, createAdminPracticeQuestion, getAdminPracticeExams, getAdminPracticeQuestions, updateAdminPracticeQuestion } from '@/services/api'
import { toast } from '@/components/toast'
import { type PracticeExam, type PracticeQuestion } from '@/components/practice/practice-data'

const emptyQuestion = (): Omit<PracticeQuestion, 'id' | 'exam_id'> => ({ question_text: '', topic: '', options: ['', '', '', ''], correct_answer: '', explanation: '' })
const emptyExam = (): Omit<PracticeExam, 'id'> => ({ title: '', subject: '', grade: '', price: 0, published: false })

const PracticeExamManagement: React.FC = () => {
  const [exams, setExams] = useState<PracticeExam[]>([])
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [questionDraft, setQuestionDraft] = useState(emptyQuestion)
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [examDraft, setExamDraft] = useState(emptyExam)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminPracticeExams().then((records) => { setExams(records); setSelectedExamId(records[0]?.id ?? null) }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load practice exams.')).finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    setQuestionDraft(emptyQuestion())
    setEditingQuestionId(null)
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
      const saved = editingQuestionId === null
        ? await createAdminPracticeQuestion(selectedExamId, questionDraft)
        : await updateAdminPracticeQuestion(selectedExamId, editingQuestionId, questionDraft)
      setQuestions((current) => editingQuestionId === null ? [...current, saved] : current.map((question) => question.id === saved.id ? saved : question))
      setQuestionDraft(emptyQuestion())
      setEditingQuestionId(null)
      toast.add({ title: editingQuestionId === null ? 'Question saved' : 'Question updated', description: 'The question and topic are ready for practice.', type: 'success' })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save practice question.') } finally { setIsSaving(false) }
  }

  const updateOption = (index: number, value: string) => setQuestionDraft((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }))
  const selectQuestion = (question: PracticeQuestion) => {
    setEditingQuestionId(question.id)
    setQuestionDraft({ question_text: question.question_text, topic: question.topic, options: question.options, correct_answer: question.correct_answer, explanation: question.explanation })
  }

  return <Stack spacing={3}>
    <Box><Typography variant="h4" sx={{ mb: 0.5 }}>Practice Exams</Typography><Typography color="text.secondary">Create and maintain self-paced practice sets with topic-based feedback.</Typography></Box>
    {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
    {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading practice exams" /></Box> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 2.5 }}>
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Typography variant="h6" sx={{ mb: 2 }}>Practice exam packages</Typography><Stack spacing={1.25} sx={{ mb: 3 }}>{exams.map((exam) => <Box key={exam.id} component="button" type="button" onClick={() => setSelectedExamId(exam.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', p: 1.25, textAlign: 'left', border: 1, borderColor: selectedExamId === exam.id ? 'primary.main' : 'divider', borderRadius: 1.5, backgroundColor: 'transparent', cursor: 'pointer', font: 'inherit' }}><Box sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{exam.title}</Typography><Typography variant="caption" color="text.secondary">{exam.subject} · {exam.grade}</Typography></Box><Chip size="small" label={exam.published ? 'Published' : 'Draft'} color={exam.published ? 'success' : 'default'} /></Box>)}</Stack><Box component="form" onSubmit={saveExam}><Stack spacing={1.25}><Typography variant="subtitle2">New practice exam</Typography><TextField required size="small" label="Title" value={examDraft.title} onChange={(event) => setExamDraft((current) => ({ ...current, title: event.target.value }))} /><Stack direction="row" spacing={1}><TextField required fullWidth size="small" label="Subject" value={examDraft.subject} onChange={(event) => setExamDraft((current) => ({ ...current, subject: event.target.value }))} /><TextField required fullWidth size="small" label="Grade" value={examDraft.grade} onChange={(event) => setExamDraft((current) => ({ ...current, grade: event.target.value }))} /></Stack><TextField required size="small" type="number" inputProps={{ min: 0, step: '0.01' }} label="Price" value={examDraft.price} onChange={(event) => setExamDraft((current) => ({ ...current, price: Number(event.target.value) }))} /><FormControlLabel control={<Switch checked={examDraft.published} onChange={(event) => setExamDraft((current) => ({ ...current, published: event.target.checked }))} />} label="Publish now" /><Button type="submit" variant="outlined" disabled={isSaving} startIcon={<AddIcon />}>Create exam</Button></Stack></Box></CardContent></Card>
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent><Typography variant="h6" sx={{ mb: 0.5 }}>{editingQuestionId === null ? 'Add question' : 'Edit question'}</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>A topic is required for every practice question.</Typography>{selectedExamId === null ? <Alert severity="info">Create a practice exam package before adding questions.</Alert> : <><Box component="form" onSubmit={saveQuestion}><Stack spacing={1.25}><TextField required multiline minRows={2} label="Question" value={questionDraft.question_text} onChange={(event) => setQuestionDraft((current) => ({ ...current, question_text: event.target.value }))} /><TextField required label="Topic" placeholder="e.g. Fractions" value={questionDraft.topic} onChange={(event) => setQuestionDraft((current) => ({ ...current, topic: event.target.value }))} />{questionDraft.options.map((option, index) => <TextField key={index} required label={`Option ${index + 1}`} value={option} onChange={(event) => updateOption(index, event.target.value)} />)}<TextField required label="Correct answer" value={questionDraft.correct_answer} onChange={(event) => setQuestionDraft((current) => ({ ...current, correct_answer: event.target.value }))} helperText="Must exactly match one option." /><TextField required multiline minRows={2} label="Explanation" value={questionDraft.explanation} onChange={(event) => setQuestionDraft((current) => ({ ...current, explanation: event.target.value }))} /><Stack direction="row" spacing={1}><Button type="submit" variant="contained" disabled={isSaving} startIcon={<SaveOutlinedIcon />}>{editingQuestionId === null ? 'Save question' : 'Update question'}</Button>{editingQuestionId !== null && <Button onClick={() => { setEditingQuestionId(null); setQuestionDraft(emptyQuestion()) }}>Cancel</Button>}</Stack></Stack></Box><Stack spacing={1} sx={{ mt: 3 }}>{questions.map((question) => <Box key={question.id} component="button" type="button" onClick={() => selectQuestion(question)} sx={{ width: '100%', p: 1.25, textAlign: 'left', border: 1, borderColor: editingQuestionId === question.id ? 'primary.main' : 'divider', borderRadius: 1.5, backgroundColor: 'background.default', color: 'text.primary', cursor: 'pointer', font: 'inherit' }}><Stack direction="row" justifyContent="space-between" spacing={1}><Typography variant="body2" sx={{ fontWeight: 600 }}>{question.question_text}</Typography><Chip size="small" label={question.topic} color="primary" variant="outlined" /></Stack></Box>)}</Stack></>}</CardContent></Card>
    </Box>}
  </Stack>
}

export default PracticeExamManagement
