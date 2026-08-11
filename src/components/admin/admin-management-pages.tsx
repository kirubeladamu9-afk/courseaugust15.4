import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddRounded from '@mui/icons-material/AddRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import LockResetRounded from '@mui/icons-material/LockResetRounded'
import PowerSettingsNewOutlined from '@mui/icons-material/PowerSettingsNewOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import InsightsOutlined from '@mui/icons-material/InsightsOutlined'
import axios from 'axios'
import { useEffect, useMemo, useState, type FC, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import { AdminPanelLayout } from './admin-dashboard'

type SectionConfig = {
  title: string
  description: string
  action: string
  columns: string[]
  rows: string[][]
  metrics: [string, string, string][]
  analytics?: boolean
  createFields?: { name: string; label: string; type?: string; required?: boolean; options?: string[]; multiple?: boolean }[]
}

const sections: Record<string, SectionConfig> = {
  'student-progress': { title: 'Student Progress', description: 'Monitor learning progress and engagement across all students.', action: 'Export Progress', columns: ['Student', 'Grade', 'Courses', 'Completion', 'Status'], rows: [['Ava Johnson', 'Grade 8', '6 courses', '86%', 'On track'], ['Noah Williams', 'Grade 7', '5 courses', '72%', 'On track'], ['Sophia Brown', 'Grade 9', '7 courses', '64%', 'Needs support'], ['Liam Davis', 'Grade 8', '6 courses', '91%', 'Excellent']], metrics: [['Students tracked', '2,480', '+12.5%'], ['Avg. completion', '78%', '+6.8%'], ['At risk', '124', '-8.4%']], analytics: true },
  'parent-student-link': { title: 'Parent-Student Link', description: 'Connect parents with students and manage family access.', action: 'Link Parent', columns: ['Parent', 'Student', 'Relationship', 'Linked on', 'Status'], rows: [['Olivia Johnson', 'Ava Johnson', 'Mother', 'Jul 12, 2024', 'Active'], ['James Williams', 'Noah Williams', 'Father', 'Jul 10, 2024', 'Active'], ['Emma Brown', 'Sophia Brown', 'Mother', 'Jul 08, 2024', 'Pending'], ['William Davis', 'Liam Davis', 'Father', 'Jul 05, 2024', 'Active']], metrics: [['Linked families', '1,920', '+6.4%'], ['Pending links', '18', '-3.2%'], ['Unlinked students', '42', '-10.1%']] },
  'teacher-assignments': { title: 'Teacher Assignments', description: 'Assign teachers to courses, grades, and classrooms.', action: 'Create Assignment', columns: ['Teacher', 'Subject', 'Grade', 'Students', 'Status'], rows: [['Maria Garcia', 'Mathematics', 'Grade 8', '124', 'Assigned'], ['Daniel Wilson', 'Science', 'Grade 7', '98', 'Assigned'], ['James Miller', 'English', 'Grade 9', '112', 'Assigned'], ['Sarah Lee', 'History', 'Grade 8', '86', 'Review']], metrics: [['Active assignments', '186', '+8.2%'], ['Open classes', '12', '-4.0%'], ['Avg. class size', '28', '+2.1%']] },
  subjects: { title: 'Subjects', description: 'Organize the subjects available in your academic program.', action: 'Add Subject', columns: ['Subject', 'Grade levels', 'Chapters', 'Teachers', 'Status', 'Actions'], rows: [['Mathematics', '6–9', '24', '32', 'Published'], ['Science', '6–9', '18', '28', 'Published'], ['English Language', '6–9', '20', '35', 'Published'], ['World History', '7–9', '12', '18', 'Draft']], metrics: [['Total subjects', '18', '+2.0%'], ['Published', '15', '+7.1%'], ['Drafts', '3', '-14.3%']], createFields: [{ name: 'subject', label: 'Subject', required: true }, { name: 'gradeLevels', label: 'Grade levels', required: true }, { name: 'chapters', label: 'Chapters', required: true }, { name: 'teachers', label: 'Teachers', required: true }, { name: 'status', label: 'Status', options: ['Draft', 'Published'], required: true }] },
  chapters: { title: 'Chapters', description: 'Manage the chapters that structure each subject.', action: 'Add Chapter', columns: ['Chapter', 'Subject', 'Lessons', 'Completion', 'Status'], rows: [['Algebraic Expressions', 'Mathematics', '12', '84%', 'Published'], ['Energy & Matter', 'Science', '9', '76%', 'Published'], ['Grammar Essentials', 'English Language', '14', '91%', 'Published'], ['Industrial Revolution', 'World History', '8', '—', 'Draft']], metrics: [['Total chapters', '74', '+10.4%'], ['Published', '61', '+8.9%'], ['In review', '7', '-5.3%']] },
  lessons: { title: 'Lessons', description: 'Create and manage lessons for every course and chapter.', action: 'Create Lesson', columns: ['Lesson', 'Subject', 'Chapter', 'Views', 'Status'], rows: [['Solving Linear Equations', 'Mathematics', 'Algebraic Expressions', '1,284', 'Published'], ['Forms of Energy', 'Science', 'Energy & Matter', '982', 'Published'], ['Parts of Speech', 'English Language', 'Grammar Essentials', '1,102', 'Published'], ['Factory Systems', 'World History', 'Industrial Revolution', '—', 'Draft']], metrics: [['Total lessons', '864', '+10.8%'], ['Published', '742', '+9.2%'], ['Drafts', '122', '-2.7%']] },
  'learning-materials': { title: 'Learning Materials', description: 'Publish videos, documents, and resources for learners.', action: 'Add Material', columns: ['Material', 'Type', 'Course', 'Downloads', 'Status'], rows: [['Algebra workbook', 'PDF', 'Mathematics', '842', 'Published'], ['Energy lab guide', 'Document', 'Science', '621', 'Published'], ['Grammar video series', 'Video', 'English Language', '1,204', 'Published'], ['History timeline', 'Presentation', 'World History', '—', 'Review']], metrics: [['Total materials', '326', '+14.6%'], ['Published', '284', '+11.2%'], ['Needs review', '9', '-18.0%']] },
  quizzes: { title: 'Quizzes', description: 'Build quizzes and review learner assessment activity.', action: 'Create Quiz', columns: ['Quiz', 'Subject', 'Questions', 'Attempts', 'Status'], rows: [['Linear Equations Check', 'Mathematics', '15', '842', 'Published'], ['Energy Fundamentals', 'Science', '20', '621', 'Published'], ['Grammar Review', 'English Language', '12', '1,204', 'Published'], ['History Unit Quiz', 'World History', '18', '—', 'Draft']], metrics: [['Active quizzes', '48', '+12.0%'], ['Attempts this month', '8,642', '+19.4%'], ['Avg. score', '76%', '+3.8%']] },
  exams: { title: 'Exams', description: 'Schedule exams and manage formal assessments.', action: 'Create Exam', columns: ['Exam', 'Term', 'Subjects', 'Submissions', 'Status'], rows: [['Midterm Assessment', 'Fall 2024', '6', '2,104', 'Scheduled'], ['Mathematics Final', 'Spring 2024', '1', '2,312', 'Completed'], ['Science Practical', 'Fall 2024', '1', '—', 'Draft'], ['Annual Review', 'Spring 2024', '8', '2,480', 'Completed']], metrics: [['Scheduled exams', '6', '+20.0%'], ['Submissions', '6,842', '+15.1%'], ['Avg. score', '81%', '+5.6%']] },
  assignments: { title: 'Assignments', description: 'Track coursework, due dates, and submissions.', action: 'Create Assignment', columns: ['Assignment', 'Course', 'Due date', 'Submissions', 'Status'], rows: [['Algebra practice set', 'Mathematics', 'Jul 19, 2024', '114/124', 'Active'], ['Energy lab report', 'Science', 'Jul 21, 2024', '82/98', 'Active'], ['Grammar essay', 'English Language', 'Jul 24, 2024', '96/112', 'Active'], ['History project', 'World History', 'Jul 28, 2024', '—', 'Draft']], metrics: [['Active assignments', '126', '+9.6%'], ['Due this week', '18', '-4.8%'], ['Submission rate', '87%', '+7.3%']] },
  'teacher-reports': { title: 'Teacher Reports', description: 'Review teaching activity, outcomes, and classroom engagement.', action: 'Export Report', columns: ['Teacher', 'Classes', 'Students', 'Completion', 'Rating'], rows: [['Maria Garcia', '4', '124', '92%', '4.9'], ['Daniel Wilson', '3', '98', '88%', '4.7'], ['James Miller', '4', '112', '86%', '4.8'], ['Sarah Lee', '3', '86', '81%', '4.5']], metrics: [['Teachers reporting', '178', '+8.2%'], ['Avg. completion', '87%', '+4.5%'], ['Avg. rating', '4.7', '+2.1%']], analytics: true },
  'course-reports': { title: 'Course Reports', description: 'Compare course performance and learner outcomes.', action: 'Export Report', columns: ['Course', 'Students', 'Completion', 'Avg. score', 'Engagement'], rows: [['Mathematics', '624', '84%', '82%', 'High'], ['Science', '498', '78%', '76%', 'High'], ['English Language', '572', '81%', '79%', 'Medium'], ['World History', '386', '69%', '73%', 'Medium']], metrics: [['Active courses', '42', '+5.0%'], ['Avg. completion', '78%', '+6.8%'], ['Total enrollments', '2,480', '+12.5%']], analytics: true },
  'performance-analytics': { title: 'Performance Analytics', description: 'Understand the trends shaping student and course performance.', action: 'Export Analytics', columns: ['Metric', 'Current period', 'Previous period', 'Change'], rows: [['Course completion', '78%', '73%', '+6.8%'], ['Average assessment score', '79%', '75%', '+5.3%'], ['Weekly active learners', '1,842', '1,604', '+14.8%'], ['Assignment submission rate', '87%', '81%', '+7.3%']], metrics: [['Active learners', '1,842', '+14.8%'], ['Avg. score', '79%', '+5.3%'], ['Completion rate', '78%', '+6.8%']], analytics: true },
}

const makeSection = (title: string, description: string, action: string, columns: string[], firstRecord: string): SectionConfig => ({ title, description, action, columns, rows: [[firstRecord, ...Array(Math.max(columns.length - 2, 0)).fill('—'), 'Draft']], metrics: [['Total records', '0', '—'], ['Active', '0', '—'], ['Pending review', '0', '—']] })

const additionalSections: Record<string, SectionConfig> = {
  students: makeSection('Student List', 'Search students, review profiles, and manage required guardian links.', 'Add Student', ['Student', 'Photo', 'Grade', 'Guardians', 'Status', 'Actions'], 'No students yet'),
  'admissions-enrollment': makeSection('Admissions / Enrollment', 'Move new student applications from intake through approval to enrollment.', 'New Application', ['Applicant', 'Applied on', 'Stage', 'Status'], 'No applications yet'),
  promotions: makeSection('Promotions', 'Move students to their next grade level in bulk at year-end.', 'Start Promotion', ['Academic year', 'From grade', 'To grade', 'Status'], 'No promotion batches yet'),
  teachers: { ...makeSection('Teacher List', 'Search and manage teacher profiles and staff registrations.', 'Add Teacher', ['Full Name', 'Gender', 'Photo', 'Phone Number', 'Address', 'National ID / Passport Number', 'Assigned Subjects', 'Assigned Classes', 'Status', 'Actions'], 'No teachers yet'), createFields: [{ name: 'fullName', label: 'Full Name', required: true }, { name: 'gender', label: 'Gender', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], required: true }, { name: 'photoName', label: 'Photo', type: 'file' }, { name: 'phoneNumber', label: 'Phone Number' }, { name: 'address', label: 'Address' }, { name: 'nationalId', label: 'National ID / Passport Number' }, { name: 'assignedSubjects', label: 'Assigned Subjects', multiple: true }, { name: 'assignedClasses', label: 'Assigned Classes', multiple: true }, { name: 'status', label: 'Status', options: ['Active', 'Inactive', 'On Leave'], required: true }] },
  guardians: makeSection('Guardian List', 'Manage guardians and their linked students. Students require at least one guardian.', '', ['Guardian', 'Linked students', 'Relationship', 'Status', 'Actions'], 'No guardians yet'),
  'grade-levels': { ...makeSection('Grade Levels', 'Define the grades offered by the school.', 'Add Grade Level', ['Grade', 'Classes', 'Students', 'Status', 'Actions'], 'Grade 1'), createFields: [{ name: 'grade', label: 'Grade', required: true }, { name: 'classes', label: 'Classes', required: true }, { name: 'students', label: 'Students', required: true }, { name: 'status', label: 'Status', options: ['Draft', 'Active'], required: true }] },
  'classes-sections': { ...makeSection('Classes & Sections', 'Create sections such as Grade 5 - A and assign students to them.', 'Add Section', ['Class / Section', 'Grade Level', 'Students', 'Status', 'Actions'], 'Grade 5 - A'), createFields: [{ name: 'classSection', label: 'Class / Section', required: true }, { name: 'gradeLevelId', label: 'Grade Level', required: true }, { name: 'students', label: 'Students', required: true }, { name: 'status', label: 'Status', options: ['Draft', 'Active'], required: true }] },
  timetable: makeSection('Timetable', 'Build weekly periods for each class and section.', 'Add Period', ['Class', 'Subject', 'Teacher', 'Schedule'], 'Grade 5 - A'),
  'grading-scale': makeSection('Grading Scale', 'Define score-to-letter-grade rules for result calculation.', 'Add Grade Rule', ['Grade', 'Minimum score', 'Maximum score', 'Status'], 'A'),
  'assessment-policy': makeSection('Assessment Policy', 'Set grading rules and weights for each assessment type.', 'Add Policy Rule', ['Assessment type', 'Weight', 'Term', 'Status'], 'Quiz'),
  'all-assessments': makeSection('All Assessments', 'Overview of assessments created by teachers.', 'Export Assessments', ['Assessment', 'Assessment Type', 'Teacher', 'Class', 'Status', 'Actions'], 'No assessments yet'),
  'result-approval': makeSection('Result Approval', 'Review and approve results before they are finalized.', 'Review Results', ['Assessment', 'Submissions', 'Submitted on', 'Status'], 'No pending results'),
  'report-cards': makeSection('Report Cards', 'Generate and publish final report cards for students and guardians.', 'Generate Report Cards', ['Term', 'Students', 'Published', 'Status'], 'No report cards yet'),
  announcements: makeSection('Announcements', 'Publish school-wide notices to the community.', 'Create Announcement', ['Announcement', 'Audience', 'Published on', 'Status'], 'No announcements yet'),
  'messages-notices': makeSection('Messages / Notices', 'Send targeted messages to guardians, classes, or teachers.', 'New Message', ['Subject', 'Audience', 'Sent on', 'Status'], 'No messages yet'),
  'enrollment-reports': makeSection('Enrollment Reports', 'Review admissions and enrollment trends over time.', 'Export Report', ['Period', 'Applications', 'Enrolled', 'Status'], 'No enrollment data'),
  'performance-trends': makeSection('Performance Trends', 'Analyze academic performance patterns across classes and terms.', 'Export Trends', ['Term', 'Class', 'Average score', 'Status'], 'No trend data'),
  'custom-export-reports': makeSection('Custom / Export Reports', 'Build and export custom data reports for school leadership.', 'Create Report', ['Report', 'Filters', 'Created by', 'Status'], 'No custom reports'),
  'user-accounts': { ...makeSection('User Accounts', 'Create and manage login accounts for teachers, admins, students, and parents.', 'Create Account', ['User', 'Role', 'Email', 'Last login', 'Status', 'Actions'], 'No accounts yet'), createFields: [{ name: 'name', label: 'Full name', required: true }, { name: 'username', label: 'Username', required: true }, { name: 'email', label: 'Email', type: 'email', required: true }, { name: 'password', label: 'Temporary password', type: 'password', required: true }, { name: 'role', label: 'Role', options: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], required: true }, { name: 'status', label: 'Status', options: ['ACTIVE', 'INACTIVE'], required: true }] },
  'general-settings': makeSection('General Settings', 'Manage school name, logo, and contact information.', 'Save Settings', ['Setting', 'Value', 'Updated by', 'Status'], 'School information'),
  'academic-settings': makeSection('Academic Settings', 'Configure default rules for the academic structure.', 'Save Settings', ['Setting', 'Value', 'Updated by', 'Status'], 'Default academic year'),
  'system-settings': makeSection('System Settings', 'Manage backups, notifications, and technical configuration.', 'Save Settings', ['Setting', 'Value', 'Updated by', 'Status'], 'Backup schedule'),
}

const statusColor = (status: string): 'success' | 'warning' | 'info' => status === 'Published' || status === 'Active' || status === 'Assigned' || status === 'Completed' ? 'success' : status === 'Draft' || status === 'Pending' || status === 'Review' ? 'warning' : 'info'

type AdminQuestion = { type: string; prompt: string; options?: string[]; correctAnswer?: string | string[]; points?: number }
type AdminRecord = { id: string; title: string; data: Record<string, string>; status: string; questions?: AdminQuestion[]; sourceType?: 'teacher' | 'student' | 'guardian' | 'user'; sourceId?: string; userId?: string }

const AdminManagementPage: FC = () => {
  const navigate = useNavigate()
  const { section = 'student-progress' } = useParams()
  const config = sections[section] ?? additionalSections[section] ?? sections['student-progress']
  const isBackendSection = Boolean(sections[section]) || ['students', 'guardians', 'grade-levels', 'classes-sections', 'teachers', 'user-accounts', 'all-assessments'].includes(section)
  const [records, setRecords] = useState<AdminRecord[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [createValues, setCreateValues] = useState<Record<string, string>>({})
  const [createOptions, setCreateOptions] = useState<{ id: string; name: string }[]>([])
  const [teacherOptions, setTeacherOptions] = useState({ subjects: [] as { id: string; name: string }[], classes: [] as { id: string; name: string }[] })
  const [editingRecordId, setEditingRecordId] = useState('')
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [editSaving, setEditSaving] = useState(false)
  const [viewingRecord, setViewingRecord] = useState<AdminRecord | null>(null)
  const [questionPage, setQuestionPage] = useState(0)
  const [listPage, setListPage] = useState(0)
  const [listRowsPerPage, setListRowsPerPage] = useState(10)
  const questionRowsPerPage = 5

  useEffect(() => {
    if (section !== 'teachers') {
      setTeacherOptions({ subjects: [], classes: [] })
      return
    }
    Promise.all([
      api.get<{ records: { id: string; title: string }[] }>('/api/admin/subjects', { withCredentials: true }),
      api.get<{ records: { id: string; title: string }[] }>('/api/admin/classes-sections', { withCredentials: true }),
    ])
      .then(([subjectsResponse, classesResponse]) => setTeacherOptions({
        subjects: subjectsResponse.data.records.map(({ id, title }) => ({ id, name: title })),
        classes: classesResponse.data.records.map(({ id, title }) => ({ id, name: title })),
      }))
      .catch(() => setError('Unable to load subjects and classes. Please try again.'))
  }, [section])

  useEffect(() => {
    if (section !== 'classes-sections') {
      setCreateOptions([])
      return
    }
    api.get<{ records: { id: string; title: string }[] }>('/api/admin/grade-levels', { withCredentials: true })
      .then(({ data }) => setCreateOptions(data.records.map(({ id, title }) => ({ id, name: title }))))
      .catch(() => setError('Unable to load grade levels. Please try again.'))
  }, [section])

  useEffect(() => {
    setIsLoading(true)
    setError('')
    setNotice('')
    setIsCreateFormOpen(false)
    setCreateValues({})
    setEditingRecordId('')
    setEditValues({})
    setListPage(0)
    if (!isBackendSection) {
      setRecords(config.rows.map((row, index) => ({ id: `${section}-${index}`, title: row[0], data: Object.fromEntries(config.columns.slice(0, -1).map((column, columnIndex) => [column, row[columnIndex]])), status: row[row.length - 1] })))
      setIsLoading(false)
      return
    }
    if (section === 'students') {
      api.get<{ students: { id: string; fullName: string; photoName?: string | null; gradeLevel: string; status: string; guardianLinks: { guardian: { name: string } }[] }[] }>('/api/admin/students', { withCredentials: true })
        .then(({ data }) => setRecords(data.students.map((student) => ({ id: student.id, title: student.fullName, data: { Student: student.fullName, Photo: student.photoName || '', Grade: student.gradeLevel, Guardians: student.guardianLinks.map(({ guardian }) => guardian.name).join(', ') || '—' }, status: student.status }))))
        .catch((error) => { if (axios.isAxiosError<{ message?: string }>(error) && error.response?.status === 401) { navigate('/login', { replace: true }); return } setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || `Unable to load records (${error.response?.status || 'network error'}).` : 'Unable to load records. Please refresh and try again.') })
        .finally(() => setIsLoading(false))
      return
    }
    if (section === 'guardians') {
      api.get<{ guardians: { id: string; name: string; status?: string; studentLinks: { relationshipType: string; student: { fullName: string } }[] }[] }>('/api/admin/guardians', { withCredentials: true })
        .then(({ data }) => setRecords(data.guardians.map((guardian) => ({ id: guardian.id, title: guardian.name, data: { Guardian: guardian.name, 'Linked students': guardian.studentLinks.map(({ student }) => student.fullName).join(', ') || '—', Relationship: guardian.studentLinks.map(({ relationshipType }) => relationshipType).join(', ') || '—' }, status: guardian.status || 'Active' }))))
        .catch((error) => { if (axios.isAxiosError<{ message?: string }>(error) && error.response?.status === 401) { navigate('/login', { replace: true }); return } setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || `Unable to load records (${error.response?.status || 'network error'}).` : 'Unable to load records. Please refresh and try again.') })
        .finally(() => setIsLoading(false))
      return
    }
    api.get<{ records: AdminRecord[] }>(`/api/admin/${section}`, { withCredentials: true })
      .then(({ data }) => setRecords(data.records))
      .catch(() => setError('Unable to load records. Please refresh and try again.'))
      .finally(() => setIsLoading(false))
  }, [section, config, isBackendSection, navigate])

  const filteredRecords = useMemo(() => records.filter((record) => config.columns.some((column) => column !== 'Actions' && (record.data[column] ?? record.title).toLowerCase().includes(query.toLowerCase()))), [records, config.columns, query])
  const isPaginatedSection = section === 'students' || section === 'teachers' || section === 'guardians' || section === 'user-accounts'
  const visibleRecords = isPaginatedSection ? filteredRecords.slice(listPage * listRowsPerPage, listPage * listRowsPerPage + listRowsPerPage) : filteredRecords

  useEffect(() => {
    if (!isPaginatedSection) return
    const lastPage = Math.max(0, Math.ceil(filteredRecords.length / listRowsPerPage) - 1)
    setListPage((current) => Math.min(current, lastPage))
  }, [filteredRecords.length, isPaginatedSection, listRowsPerPage])
  const handleToggleAccountStatus = async (record: AdminRecord) => {
    if (section !== 'user-accounts' || record.sourceType !== 'user') return
    const nextStatus = record.status === 'Active' ? 'INACTIVE' : 'ACTIVE'
    try {
      const { data: response } = await api.patch<{ record: AdminRecord }>(`/api/admin/user-accounts/${record.id}`, { status: nextStatus }, { withCredentials: true })
      setRecords((current) => current.map((currentRecord) => currentRecord.id === record.id ? response.record : currentRecord))
      setNotice(`${record.title} is now ${response.record.status}.`)
      setError('')
    } catch (error) {
      setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Unable to update account status.' : 'Unable to update account status.')
      setNotice('')
    }
  }

  const handleResetPassword = async (record: AdminRecord) => {
    if (!record.sourceType || !record.sourceId) return
    try {
      const { data: response } = await api.post<{ record: AdminRecord; temporaryPassword: string; created: boolean }>(`/api/admin/user-accounts/${record.sourceType}/${record.sourceId}/reset-password`, {}, { withCredentials: true })
      setRecords((current) => current.map((currentRecord) => currentRecord.id === record.id || currentRecord.userId === response.record.userId ? response.record : currentRecord))
      const username = response.record.data.Username || response.record.data.Email || response.record.title
      const credentials = `CourseSpace login credentials\n\nName: ${response.record.title}\nUsername: ${username}\nRole: ${response.record.data.Role}\nTemporary password: ${response.temporaryPassword}\n\nPlease change this password after signing in.`
      const downloadUrl = URL.createObjectURL(new Blob([credentials], { type: 'text/plain;charset=utf-8' }))
      const downloadLink = document.createElement('a')
      downloadLink.href = downloadUrl
      downloadLink.download = `${username.replace(/[^a-z0-9_.-]/gi, '-')}-login-credentials.txt`
      downloadLink.click()
      URL.revokeObjectURL(downloadUrl)
      setNotice(`${response.created ? 'Account created' : 'Password reset'} for ${response.record.title}. Credentials downloaded.`)
      setError('')
    } catch (error) {
      setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Unable to reset the password.' : 'Unable to reset the password.')
      setNotice('')
    }
  }
  const editableSections = section === 'students' || section === 'teachers' || section === 'guardians' || section === 'grade-levels' || section === 'classes-sections' || section === 'subjects' || section === 'all-assessments'
  const editFields: { name: string; label: string; type?: string; options?: string[] }[] = section === 'all-assessments'
    ? [{ name: 'title', label: 'Assessment' }, { name: 'assessmentType', label: 'Assessment type', options: ['Quiz', 'Assignment', 'Midterm Exam', 'Final Exam', 'Project'] }, { name: 'className', label: 'Class' }, { name: 'status', label: 'Status', options: ['Draft', 'Published', 'Archived'] }]
    : section === 'students'
    ? [{ name: 'fullName', label: 'Full name' }, { name: 'gradeLevel', label: 'Grade' }, { name: 'status', label: 'Status', options: ['Active', 'Inactive', 'Pending'] }]
    : section === 'teachers'
      ? [{ name: 'fullName', label: 'Full name' }, { name: 'gender', label: 'Gender' }, { name: 'phoneNumber', label: 'Phone number' }, { name: 'address', label: 'Address' }, { name: 'nationalId', label: 'National ID / Passport Number' }, { name: 'assignedSubjects', label: 'Assigned subjects' }, { name: 'assignedClasses', label: 'Assigned classes' }, { name: 'status', label: 'Status', options: ['Active', 'Inactive', 'On Leave'] }]
      : section === 'grade-levels'
        ? [{ name: 'grade', label: 'Grade' }, { name: 'classes', label: 'Classes' }, { name: 'students', label: 'Students' }, { name: 'status', label: 'Status', options: ['Draft', 'Active'] }]
        : section === 'classes-sections'
          ? [{ name: 'classSection', label: 'Class / Section' }, { name: 'gradeLevelId', label: 'Grade Level' }, { name: 'students', label: 'Students' }, { name: 'status', label: 'Status', options: ['Draft', 'Active'] }]
          : section === 'subjects'
            ? [{ name: 'title', label: 'Subject' }, { name: 'gradeLevels', label: 'Grade levels' }, { name: 'chapters', label: 'Chapters' }, { name: 'teachers', label: 'Teachers' }, { name: 'status', label: 'Status', options: ['Draft', 'Published'] }]
            : [{ name: 'name', label: 'Name' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'phone', label: 'Phone' }, { name: 'address', label: 'Address' }, { name: 'occupation', label: 'Occupation' }, { name: 'nationalId', label: 'National ID / Passport Number' }]

  const startEditing = (record: AdminRecord) => {
    if (!editableSections) return
    if (['students', 'teachers', 'guardians'].includes(section)) {
      navigate(`/admin/${section}/${record.id}/edit`)
      return
    }
    setEditingRecordId(record.id)
    setEditValues(section === 'all-assessments'
      ? { title: record.title, assessmentType: record.data['Assessment Type'] || 'Quiz', className: record.data.Class || '', status: record.status }
      : section === 'students'
      ? { fullName: record.data.Student || record.title, gradeLevel: record.data.Grade || '', status: record.status }
      : section === 'teachers'
        ? { fullName: record.data['Full Name'] || record.title, gender: record.data.Gender === '—' ? '' : record.data.Gender || '', phoneNumber: record.data['Phone Number'] === '—' ? '' : record.data['Phone Number'] || '', address: record.data.Address === '—' ? '' : record.data.Address || '', nationalId: record.data['National ID / Passport Number'] === '—' ? '' : record.data['National ID / Passport Number'] || '', assignedSubjects: record.data['Assigned Subjects'] === '—' ? '' : record.data['Assigned Subjects'] || '', assignedClasses: record.data['Assigned Classes'] === '—' ? '' : record.data['Assigned Classes'] || '', status: record.status }
        : section === 'grade-levels'
          ? { grade: record.data.Grade || record.title, classes: record.data.Classes || '0', students: record.data.Students || '0', status: record.status }
          : section === 'classes-sections'
            ? { classSection: record.data['Class / Section'] || record.title, gradeLevelId: record.data.gradeLevelId || '', students: record.data.Students || '0', status: record.status }
            : section === 'subjects'
              ? { title: record.title, gradeLevels: record.data['Grade levels'] || '', chapters: record.data.Chapters || '', teachers: record.data.Teachers || '', status: record.status }
              : { name: record.data.Guardian || record.title, email: '', phone: '', address: '', occupation: '', nationalId: '' })
    setError('')
    setNotice('')
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRecordId || !editableSections) return
    setEditSaving(true)
    setError('')
    try {
      const payload = section === 'subjects'
        ? { title: editValues.title, data: { 'Grade levels': editValues.gradeLevels || '—', Chapters: editValues.chapters || '—', Teachers: editValues.teachers || '—' }, status: editValues.status }
        : editValues
      const { data: response } = await api.patch<{ record: AdminRecord }>(`/api/admin/${section}/${editingRecordId}`, payload, { withCredentials: true })
      setRecords((current) => current.map((record) => record.id === editingRecordId ? response.record : record))
      setEditingRecordId('')
      setEditValues({})
      setNotice(`${config.title.slice(0, -5)} updated successfully.`)
    } catch (error) {
      setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Unable to update the record.' : 'Unable to update the record.')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (record: AdminRecord) => {
    if (!editableSections || !window.confirm(`Delete ${record.title}? This action cannot be undone.`)) return
    try {
      await api.delete(`/api/admin/${section}/${record.id}`, { withCredentials: true })
      setRecords((current) => current.filter((currentRecord) => currentRecord.id !== record.id))
      if (editingRecordId === record.id) setEditingRecordId('')
      setNotice(`${record.title} deleted successfully.`)
      setError('')
    } catch (error) {
      setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Unable to delete the record.' : 'Unable to delete the record.')
    }
  }

  const handleCreateFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = config.createFields
    if (!fields) return
    const title = createValues[fields[0].name]?.trim()
    if (!title) return
    const status = createValues.status || 'Draft'
    try {
      const payload = section === 'subjects'
        ? { title, data: Object.fromEntries(config.columns.slice(0, -1).map((column, index) => [column, createValues[fields[index].name] || '—'])), status }
        : Object.fromEntries(fields.map((field) => [field.name, createValues[field.name] || '']))
      const { data: response } = await api.post<{ record: AdminRecord }>(`/api/admin/${section}`, payload, { withCredentials: true })
      setRecords((current) => [...current, response.record])
      setCreateValues({})
      setIsCreateFormOpen(false)
    } catch (error) {
      setError(axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message || 'Unable to create the record.' : 'Unable to create the record.')
    }
  }

  const handleCreate = async () => {
    if (section === 'students' || section === 'guardians') {
      navigate('/admin/students/new')
      return
    }
    if (section === 'teachers') {
      navigate('/admin/teachers/new')
      return
    }
    if (config.action.includes('Export')) return
    const data = Object.fromEntries(config.columns.slice(0, -1).map((column, index) => [column, index === 0 ? `New ${config.title} record` : '—']))
    if (!isBackendSection) {
      setRecords((current) => [...current, { id: `${section}-${Date.now()}`, title: `New ${config.title} record`, data, status: 'Draft' }])
      return
    }
    try {
      const { data: response } = await api.post<{ record: AdminRecord }>(`/api/admin/${section}`, { title: `New ${config.title} record`, data, status: 'Draft' }, { withCredentials: true })
      setRecords((current) => [...current, response.record])
    } catch {
      setError('Unable to create the record. Please try again.')
    }
  }

  if (viewingRecord && section !== 'all-assessments') {
    return <AdminPanelLayout title={viewingRecord.title}><Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}><Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Admin</Typography><Typography variant="subtitle2" color="text.secondary">{config.title}</Typography><Typography variant="subtitle2" color="primary.main">{viewingRecord.title}</Typography></Breadcrumbs><Button onClick={() => setViewingRecord(null)} sx={{ mb: 3, px: 0 }}>Back to {config.title}</Button><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, md: 38 }, mb: 3 }}>{viewingRecord.title}</Typography><Grid container spacing={2}>{Object.entries({ ...viewingRecord.data, Status: viewingRecord.status }).map(([label, value]) => <Grid item xs={12} sm={6} md={4} key={label}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography fontWeight={600}>{value || '—'}</Typography></Grid>)}</Grid></Paper></Container></AdminPanelLayout>
  }

  if (viewingRecord && section === 'all-assessments') {
    const questions = viewingRecord.questions || []
    const visibleQuestions = questions.slice(questionPage * questionRowsPerPage, questionPage * questionRowsPerPage + questionRowsPerPage)
    return <AdminPanelLayout title={viewingRecord.title}><Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}><Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Admin</Typography><Typography variant="subtitle2" color="text.secondary">All Assessments</Typography><Typography variant="subtitle2" color="primary.main">{viewingRecord.title}</Typography></Breadcrumbs><Button onClick={() => setViewingRecord(null)} sx={{ mb: 3, px: 0 }}>Back to All Assessments</Button><Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}><Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, md: 38 }, mb: 2 }}>{viewingRecord.title}</Typography><Grid container spacing={2} sx={{ mb: 3 }}>{Object.entries({ ...viewingRecord.data, Status: viewingRecord.status }).map(([label, value]) => <Grid item xs={12} sm={4} key={label}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography fontWeight={600}>{value}</Typography></Grid>)}</Grid><Typography variant="h5" sx={{ mb: 1 }}>Questions ({questions.length})</Typography>{questions.length ? <><Stack spacing={1.5}>{visibleQuestions.map((question, index) => <Paper key={`${viewingRecord.id}-question-${questionPage * questionRowsPerPage + index}`} variant="outlined" sx={{ p: 2 }}><Typography fontWeight={700}>Question {questionPage * questionRowsPerPage + index + 1}</Typography><Typography sx={{ mt: 0.5 }}>{question.prompt}</Typography>{question.options?.length ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>Options: {question.options.join(' · ')}</Typography> : null}<Typography variant="body2" color="text.secondary">Correct answer: {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer || '—'} · {question.points || 0} points</Typography></Paper>)}</Stack><TablePagination component="div" count={questions.length} page={questionPage} onPageChange={(_, page) => setQuestionPage(page)} rowsPerPage={questionRowsPerPage} rowsPerPageOptions={[]} /></> : <Typography color="text.secondary">No questions found for this assessment.</Typography>}</Paper></Container></AdminPanelLayout>
  }

  return (
    <AdminPanelLayout title={config.title}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}><Typography variant="subtitle2" color="text.secondary">Admin</Typography><Typography variant="subtitle2" color="primary.main">{config.title}</Typography></Breadcrumbs>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
          <Box><Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, md: 38 }, mb: 0.5 }}>{config.title}</Typography><Typography color="text.secondary">{config.description}</Typography></Box>
          <Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<DownloadRounded />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Export</Button>{section !== 'user-accounts' && section !== 'guardians' && <Button variant="contained" onClick={() => section === 'teachers' ? handleCreate() : config.createFields ? setIsCreateFormOpen((current) => !current) : handleCreate()} startIcon={config.action.includes('Export') ? <DownloadRounded /> : <AddRounded />}>{config.action}</Button>}</Stack>
        </Stack>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {config.metrics.map(([label, value, change]) => <Grid item xs={12} sm={4} key={label}><Paper elevation={0} sx={{ p: 2.5, borderRadius: 3 }}><Typography variant="subtitle1" color="text.secondary">{label}</Typography><Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 1 }}><Typography variant="h3" sx={{ fontSize: { xs: 26, md: 30 } }}>{value}</Typography><Typography variant="caption" color="primary.main">{change}</Typography></Stack></Paper></Grid>)}
        </Grid>
        {config.analytics && <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 2 }}><Stack direction="row" spacing={1} alignItems="center"><InsightsOutlined color="primary" /><Box><Typography variant="h5">Performance trends</Typography><Typography variant="subtitle2" color="text.secondary">Key indicators over the current reporting period</Typography></Box></Stack><Stack spacing={1.5} sx={{ mt: 3 }}>{[['Engagement', 82], ['Completion', 78], ['Assessment scores', 79]].map(([label, value]) => <Box key={label as string}><Stack direction="row" justifyContent="space-between"><Typography variant="body2">{label}</Typography><Typography variant="body2" color="text.secondary">{value}%</Typography></Stack><LinearProgress variant="determinate" value={value as number} sx={{ mt: 0.75, height: 8, borderRadius: 4 }} /></Box>)}</Stack></Paper>}
        <Paper elevation={0} sx={{ p: { xs: 1, md: 2 }, borderRadius: 3 }}>
          {isCreateFormOpen && config.createFields && <Box component="form" onSubmit={handleCreateFormSubmit} sx={{ p: 1, mb: 1 }}>
            <Grid container spacing={1.5}>
              {config.createFields.map((field) => (
                <Grid item xs={12} sm={field.multiple ? 12 : 6} key={field.name}>
                  {field.multiple ? <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{field.label}</Typography>
                    <FormGroup row>
                      {(field.name === 'assignedSubjects' ? teacherOptions.subjects : teacherOptions.classes).map((option) => {
                        const selected = (createValues[field.name] || '').split(', ').filter(Boolean).includes(option.name)
                        return <FormControlLabel key={option.id} control={<Checkbox checked={selected} onChange={(event) => setCreateValues((current) => ({ ...current, [field.name]: event.target.checked ? [...(current[field.name] || '').split(', ').filter(Boolean), option.name].join(', ') : (current[field.name] || '').split(', ').filter((value) => value !== option.name).join(', ') }))} />} label={option.name} />
                      })}
                    </FormGroup>
                  </Box> : <TextField fullWidth size="small" label={field.label} type={field.options || field.name === 'gradeLevelId' ? undefined : field.type || 'text'} select={Boolean(field.options || field.name === 'gradeLevelId')} required={field.required} value={field.type === 'file' ? undefined : createValues[field.name] || ''} onChange={(event) => setCreateValues((current) => ({ ...current, [field.name]: field.type === 'file' ? (event.target as HTMLInputElement).files?.[0]?.name || '' : event.target.value }))}>{(field.name === 'gradeLevelId' ? createOptions : field.options)?.map((option) => <MenuItem key={typeof option === 'string' ? option : option.id} value={typeof option === 'string' ? option : option.id}>{typeof option === 'string' ? option : option.name}</MenuItem>)}</TextField>}
                </Grid>
              ))}
              <Grid item xs={12}><Button type="submit" variant="contained">Save</Button></Grid>
            </Grid>
          </Box>}
          {editingRecordId && editableSections && <Box component="form" onSubmit={handleEditSubmit} sx={{ p: 1, mb: 1 }}><Typography variant="subtitle1" sx={{ mb: 1 }}>Edit {config.title.slice(0, -5)}</Typography><Grid container spacing={1.5}>{editFields.map((field) => <Grid item xs={12} sm={field.name === 'address' || field.name === 'assignedSubjects' || field.name === 'assignedClasses' ? 12 : 6} key={field.name}><TextField fullWidth size="small" label={field.label} type={field.type || 'text'} select={Boolean(field.options)} value={editValues[field.name] || ''} onChange={(event) => setEditValues((current) => ({ ...current, [field.name]: event.target.value }))}>{field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField></Grid>)}<Grid item xs={12}><Stack direction="row" spacing={1}><Button type="submit" variant="contained" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save changes'}</Button><Button type="button" onClick={() => { setEditingRecordId(''); setEditValues({}) }}>Cancel</Button></Stack></Grid></Grid></Box>}
          {error && <Typography color="error" sx={{ px: 1, pt: 1 }}>{error}</Typography>}
          {notice && <Typography color="success.main" sx={{ px: 1, pt: 1 }}>{notice}</Typography>}
          {isLoading && <LinearProgress sx={{ mx: 1, mb: 1 }} />}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ p: 1 }}><Typography variant="h5">{config.title} records</Typography><TextField size="small" placeholder="Search records" value={query} onChange={(event) => { setQuery(event.target.value); setListPage(0) }} /></Stack>
          <TableContainer><Table><TableHead><TableRow>{config.columns.map((column) => <TableCell key={column} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{column}</TableCell>)}</TableRow></TableHead><TableBody>{visibleRecords.map((record) => <TableRow hover key={record.id}>{config.columns.map((column) => { const cell = column === 'Status' ? record.status : record.data[column] ?? (column === 'User' ? record.title : '—'); const photoSource = record.data.Photo; return <TableCell key={`${record.id}-${column}`} sx={{ whiteSpace: 'nowrap' }}>{column === 'Photo' ? (photoSource ? <Box component="img" src={photoSource} alt={`${record.title} profile`} sx={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', display: 'block' }} /> : <Typography variant="caption" color="text.secondary">No photo</Typography>) : column === 'Actions' && editableSections ? <Stack direction="row" spacing={0.5}><Tooltip title="View"><IconButton size="small" aria-label={`View ${record.title}`} onClick={() => { setViewingRecord(record); setQuestionPage(0) }}><VisibilityOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Edit"><IconButton size="small" aria-label={`Edit ${record.title}`} onClick={() => startEditing(record)}><EditOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" aria-label={`Delete ${record.title}`} onClick={() => handleDelete(record)}><DeleteOutlineRounded fontSize="small" /></IconButton></Tooltip></Stack> : column === 'Actions' && section === 'user-accounts' && record.sourceType === 'user' ? <Stack direction="row" spacing={0.5}><Tooltip title="Reset password"><IconButton size="small" aria-label={`Reset password for ${record.title}`} onClick={() => handleResetPassword(record)}><LockResetRounded fontSize="small" /></IconButton></Tooltip><Tooltip title={record.status === 'Active' ? 'Deactivate' : 'Activate'}><IconButton size="small" color={record.status === 'Active' ? 'warning' : 'success'} aria-label={`${record.status === 'Active' ? 'Deactivate' : 'Activate'} ${record.title}`} onClick={() => handleToggleAccountStatus(record)}><PowerSettingsNewOutlined fontSize="small" /></IconButton></Tooltip></Stack> : column === 'Actions' && record.sourceType ? <Tooltip title="Reset password"><IconButton size="small" aria-label={`Reset password for ${record.title}`} onClick={() => handleResetPassword(record)}><LockResetRounded fontSize="small" /></IconButton></Tooltip> : column === 'Status' && ['Active', 'Published', 'Assigned', 'Completed', 'Scheduled', 'Draft', 'Review', 'Pending'].includes(cell) ? <Chip size="small" label={cell} color={statusColor(cell)} /> : column !== 'Actions' ? cell : '—'}</TableCell> })}</TableRow>)}</TableBody></Table></TableContainer>
          {isPaginatedSection && <TablePagination component="div" count={filteredRecords.length} page={listPage} onPageChange={(_, nextPage) => setListPage(nextPage)} rowsPerPage={listRowsPerPage} onRowsPerPageChange={(event) => { setListRowsPerPage(Number(event.target.value)); setListPage(0) }} rowsPerPageOptions={[5, 10, 25]} />}
          {!filteredRecords.length && <Typography color="text.secondary" sx={{ p: 3 }}>No records match your search.</Typography>}
        </Paper>
      </Container>
    </AdminPanelLayout>
  )
}

export default AdminManagementPage
