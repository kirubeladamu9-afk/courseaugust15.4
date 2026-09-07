import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { useState } from 'react'
import { practice_exams, practice_questions, type PracticeExam, type PracticeQuestion } from '@/components/practice/practice-data'
import { toast } from '@/components/toast'

const PracticeExamManagement: React.FC = () => {
  const [exams, setExams] = useState(practice_exams)
  const [questions, setQuestions] = useState(practice_questions)
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id ?? 1)
  const [question, setQuestion] = useState<PracticeQuestion>({ id: 100, exam_id: selectedExamId, question_text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' })
  const [examDraft, setExamDraft] = useState<PracticeExam>({ id: 100, title: '', subject: '', grade: '', price: 0, published: false })

  const updateQuestion = (changes: Partial<PracticeQuestion>) => setQuestion((current) => ({ ...current, ...changes }))
  const saveQuestion = (event: React.FormEvent) => {
    event.preventDefault()
    if (!question.question_text || question.options.some((option) => !option) || !question.correct_answer || !question.explanation) return
    setQuestions((current) => [...current, { ...question, exam_id: selectedExamId, id: Math.max(0, ...current.map((item) => item.id)) + 1 }])
    setQuestion({ id: question.id + 1, exam_id: selectedExamId, question_text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' })
    toast.add({ title: 'Question saved', description: 'The practice question is ready for this exam.', type: 'success' })
  }
  const saveExam = (event: React.FormEvent) => {
    event.preventDefault()
    if (!examDraft.title || !examDraft.subject || !examDraft.grade) return
    setExams((current) => [...current, { ...examDraft, id: Math.max(0, ...current.map((item) => item.id)) + 1 }])
    setExamDraft({ id: examDraft.id + 1, title: '', subject: '', grade: '', price: 0, published: false })
    toast.add({ title: 'Practice exam saved', description: 'The exam package was added to your catalog.', type: 'success' })
  }
  const examQuestions = questions.filter((item) => item.exam_id === selectedExamId)

  return <Stack spacing={3}>
    <Box><Typography variant="h4" sx={{ mb: 0.5 }}>Practice Exams</Typography><Typography color="text.secondary">Create relaxed, self-paced practice sets with immediate explanations. These are separate from timed course quizzes.</Typography></Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 2.5 }}>
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Practice exam packages</Typography><Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Package questions into a purchasable catalog item.</Typography>
        <Stack spacing={1.25} sx={{ mb: 3 }}>{exams.map((exam) => <Box key={exam.id} component="button" type="button" onClick={() => setSelectedExamId(exam.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', p: 1.25, textAlign: 'left', border: 1, borderColor: selectedExamId === exam.id ? 'primary.main' : 'divider', borderRadius: 1.5, backgroundColor: 'transparent', cursor: 'pointer', font: 'inherit' }}><Box sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{exam.title}</Typography><Typography variant="caption" color="text.secondary">{exam.subject} · {exam.grade} · ${exam.price}</Typography></Box><Chip label={exam.published ? 'Published' : 'Draft'} size="small" color={exam.published ? 'success' : 'warning'} /></Box>)}</Stack>
        <Box component="form" onSubmit={saveExam} sx={{ display: 'grid', gap: 1.5 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Add package</Typography><TextField required label="Title" value={examDraft.title} onChange={(event) => setExamDraft({ ...examDraft, title: event.target.value })} /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField required fullWidth label="Subject" value={examDraft.subject} onChange={(event) => setExamDraft({ ...examDraft, subject: event.target.value })} /><TextField required fullWidth label="Grade" value={examDraft.grade} onChange={(event) => setExamDraft({ ...examDraft, grade: event.target.value })} /></Stack><TextField required type="number" label="Price" inputProps={{ min: 0, step: 0.01 }} value={examDraft.price} onChange={(event) => setExamDraft({ ...examDraft, price: Number(event.target.value) })} /><FormControlLabel control={<Switch checked={examDraft.published} onChange={(event) => setExamDraft({ ...examDraft, published: event.target.checked })} />} label="Publish in public catalog" /><Button type="submit" variant="outlined" startIcon={<AddIcon />}>Add practice exam</Button></Box>
      </CardContent></Card>
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}><CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}><Box><Typography variant="h6">Questions</Typography><Typography color="text.secondary" variant="body2">{exams.find((exam) => exam.id === selectedExamId)?.title ?? 'Select an exam'} · {examQuestions.length} saved</Typography></Box><Chip label="No timer" color="primary" variant="outlined" /></Stack>
        {examQuestions.length > 0 && <Stack spacing={1} sx={{ mb: 3 }}>{examQuestions.map((item, index) => <Box key={item.id} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 600 }}>Question {index + 1}: {item.question_text}</Typography><Typography variant="caption" color="text.secondary">Answer: {item.correct_answer}</Typography></Box>)}</Stack>}
        <Box component="form" onSubmit={saveQuestion} sx={{ display: 'grid', gap: 1.5 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Add question</Typography><TextField required multiline minRows={3} label="Question text" value={question.question_text} onChange={(event) => updateQuestion({ question_text: event.target.value })} /><Typography variant="body2" color="text.secondary">Answer options</Typography>{question.options.map((option, index) => <TextField key={index} required label={`Option ${index + 1}`} value={option} onChange={(event) => updateQuestion({ options: question.options.map((current, currentIndex) => currentIndex === index ? event.target.value : current) })} />)}<TextField required label="Correct answer" helperText="Enter the exact option text." value={question.correct_answer} onChange={(event) => updateQuestion({ correct_answer: event.target.value })} /><TextField required multiline minRows={3} label="Explanation" helperText="Shown immediately after the learner answers." value={question.explanation} onChange={(event) => updateQuestion({ explanation: event.target.value })} /><Alert severity="info">Practice mode gives feedback immediately and does not track timer, tab switches, or anti-cheat events.</Alert><Button type="submit" variant="contained" startIcon={<SaveOutlinedIcon />}>Save question</Button></Box>
      </CardContent></Card>
    </Box>
  </Stack>
}

export default PracticeExamManagement
