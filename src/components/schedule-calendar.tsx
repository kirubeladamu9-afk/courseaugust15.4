import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import VideoCallOutlinedIcon from '@mui/icons-material/VideoCallOutlined'
import { type FC, useMemo, useState } from 'react'

export interface ScheduleSession {
  id: string
  classTitle: string
  lessonTitle: string
  scheduledAt: string
  endsAt?: string
  meetingUrl?: string
  classSchedule?: string
  enrollmentId?: number
  lessonId?: number
}

interface ScheduleCalendarProps {
  title: string
  description: string
  sessions: ScheduleSession[]
  now: Date
  emptyTitle: string
  emptyDescription: string
  onJoin?: (session: ScheduleSession) => void
}

const startOfDay = (date: Date) => {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

const startOfWeek = (date: Date) => {
  const weekStart = startOfDay(date)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return weekStart
}

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
const isSameDay = (first: Date, second: Date) => dayKey(first) === dayKey(second)
const formatTime = (date: Date) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
const formatDay = (date: Date) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
const formatDate = (date: Date) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
const formatDateTime = (date: Date) => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)

const getEndTime = (session: ScheduleSession, start: Date) => {
  if (!session.endsAt) return start.getTime() + 60 * 60 * 1000
  const end = new Date(session.endsAt)
  return Number.isNaN(end.getTime()) ? start.getTime() + 60 * 60 * 1000 : end.getTime()
}

const getReminderLabel = (start: Date, now: Date, isActive: boolean) => {
  if (isActive) return 'Live now'
  const minutesUntilStart = (start.getTime() - now.getTime()) / 60000
  if (minutesUntilStart >= 0 && minutesUntilStart <= 60) return 'Starting soon'
  if (isSameDay(start, now)) return 'Today'
  if (isSameDay(start, addDays(now, 1))) return 'Tomorrow'
  return null
}

const ScheduleCalendar: FC<ScheduleCalendarProps> = ({ title, description, sessions, now, emptyTitle, emptyDescription, onJoin }) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(now))
  const parsedSessions = useMemo(() => sessions
    .map((session) => ({ session, start: new Date(session.scheduledAt) }))
    .filter(({ start }) => !Number.isNaN(start.getTime()))
    .sort((first, second) => first.start.getTime() - second.start.getTime()), [sessions])
  const upcomingSessions = parsedSessions.filter(({ session, start }) => getEndTime(session, start) > now.getTime())
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const sessionsByDay = new Map(weekDays.map((day) => [dayKey(day), upcomingSessions.filter(({ start }) => isSameDay(start, day))]))
  const weekEnd = weekDays[weekDays.length - 1]

  return <>
    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
      <Box>
        <Typography component="h1" variant="h4" sx={{ mb: 0.5 }}>{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      <Chip icon={<CalendarTodayOutlinedIcon />} label={`${upcomingSessions.length} upcoming session${upcomingSessions.length === 1 ? '' : 's'}`} color="primary" variant="outlined" />
    </Box>
    {upcomingSessions.length === 0 ? <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: 1, borderColor: 'divider', textAlign: 'center' }}>
      <ScheduleOutlinedIcon color="disabled" sx={{ fontSize: 42, mb: 1 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>{emptyTitle}</Typography>
      <Typography color="text.secondary">{emptyDescription}</Typography>
    </Paper> : <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: { xs: 1.5, md: 2 }, border: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, minWidth: 720 }}>
          <Box>
            <Typography variant="h6">Week at a glance</Typography>
            <Typography variant="body2" color="text.secondary">{formatDate(weekStart)} – {formatDate(weekEnd)}</Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => setWeekStart((current) => addDays(current, -7))} aria-label="Previous week"><ChevronLeftIcon /></IconButton>
            <Button size="small" onClick={() => setWeekStart(startOfWeek(now))}>This week</Button>
            <IconButton size="small" onClick={() => setWeekStart((current) => addDays(current, 7))} aria-label="Next week"><ChevronRightIcon /></IconButton>
          </Stack>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))', minWidth: 720 }}>
          {weekDays.map((day) => {
            const daySessions = sessionsByDay.get(dayKey(day)) ?? []
            const isToday = isSameDay(day, now)
            return <Box key={dayKey(day)} sx={{ minHeight: 156, p: 1, borderLeft: 1, borderColor: 'divider', backgroundColor: isToday ? 'action.hover' : 'transparent' }}>
              <Typography variant="caption" color={isToday ? 'primary.main' : 'text.secondary'} sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>{formatDay(day)}</Typography>
              <Typography variant="h6" sx={{ mb: 1, color: isToday ? 'primary.main' : 'text.primary' }}>{day.getDate()}</Typography>
              <Stack spacing={0.75}>
                {daySessions.map(({ session, start }) => <Box key={session.id} sx={{ p: 0.75, borderRadius: 1, backgroundColor: 'background.paper', border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>{formatTime(start)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={session.classTitle}>{session.classTitle}</Typography>
                </Box>)}
                {daySessions.length === 0 && <Typography variant="caption" color="text.disabled">No sessions</Typography>}
              </Stack>
            </Box>
          })}
        </Box>
      </Paper>
      <Box>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Upcoming live sessions</Typography>
        <Stack spacing={1.5}>
          {upcomingSessions.map(({ session, start }) => {
            const isActive = now.getTime() >= start.getTime() && now.getTime() < getEndTime(session, start)
            const reminder = getReminderLabel(start, now, isActive)
            return <Paper key={session.id} elevation={0} sx={{ p: { xs: 1.75, md: 2 }, border: 1, borderColor: isActive ? 'success.main' : 'divider', backgroundColor: isActive ? 'rgba(46, 125, 50, 0.04)' : 'background.paper' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <Box sx={{ minWidth: { md: 150 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{formatDateTime(start)}</Typography>
                  <Typography variant="caption" color="text.secondary">{session.classSchedule || 'Live lesson'}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="h6" sx={{ fontSize: '1rem' }}>{session.classTitle}</Typography>
                    {reminder && <Chip size="small" label={reminder} color={isActive ? 'success' : 'warning'} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{session.lessonTitle}{session.endsAt ? ` · Until ${formatTime(new Date(session.endsAt))}` : ''}</Typography>
                </Box>
                {onJoin && (isActive && session.meetingUrl ? <Button variant="contained" size="small" onClick={() => onJoin(session)} startIcon={<VideoCallOutlinedIcon />} sx={{ flexShrink: 0 }}>Join Class</Button> : <Chip size="small" label={isActive ? 'Meeting link unavailable' : 'Scheduled'} variant="outlined" sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }} />)}
              </Stack>
            </Paper>
          })}
        </Stack>
      </Box>
    </Stack>}
  </>
}

export default ScheduleCalendar
