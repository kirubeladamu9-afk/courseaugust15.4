import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import { type FC, type ReactNode, useMemo, useState } from 'react'

export interface GamificationActivity {
  studentId: number | string
  studentName: string
  completedLessonIds: number[]
  passedQuizIds: number[]
  attendedLiveLessonIds: number[]
  liveLessonIds: number[]
  completedCourseCount: number
  activityDates: string[]
  asOf: string
  classTitle?: string
}

export interface StudentStats {
  student_id: number | string
  xp: number
  level: number
  points: number
  current_streak: number
  longest_streak: number
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  criteria: string
}

export interface Achievement {
  id: string
  student_id: number | string
  badge_id: string
  unlocked_at: string
}

export interface Challenge {
  id: string
  title: string
  type: 'daily' | 'weekly'
  xp_reward: number
  points_reward: number
  completed: boolean
}

interface LeaderboardEntry {
  id: string
  name: string
  avatar: string
  xp: number
  isCurrentStudent?: boolean
}

const XP_REWARDS = {
  lesson: 25,
  quiz: 50,
  live: 40,
}

const POINT_REWARDS = {
  lesson: 10,
  quiz: 20,
  live: 15,
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3400]

const BADGES: Badge[] = [
  {
    id: 'first-quiz-passed',
    name: 'First Quiz Passed',
    icon: 'quiz',
    description: 'Passed your first quiz and started building assessment momentum.',
    criteria: 'Pass 1 quiz',
  },
  {
    id: 'seven-day-streak',
    name: '7-Day Streak',
    icon: 'streak',
    description: 'Kept your learning habit going for seven days.',
    criteria: 'Reach a 7-day streak',
  },
  {
    id: 'perfect-attendance',
    name: 'Perfect Attendance',
    icon: 'attendance',
    description: 'Attended every live session currently tracked for your cohort.',
    criteria: 'Attend every live session',
  },
  {
    id: 'course-completed',
    name: 'Course Completed',
    icon: 'course',
    description: 'Completed every lesson in a course.',
    criteria: 'Complete 1 course',
  },
  {
    id: 'lesson-momentum',
    name: 'Lesson Momentum',
    icon: 'momentum',
    description: 'Completed ten lessons across your learning plan.',
    criteria: 'Complete 10 lessons',
  },
]

const challengeCatalog: Omit<Challenge, 'completed'>[] = [
  { id: 'daily-lesson', title: 'Complete 1 lesson today', type: 'daily', xp_reward: 30, points_reward: 10 },
  { id: 'daily-quiz', title: 'Pass a quiz today', type: 'daily', xp_reward: 45, points_reward: 15 },
  { id: 'daily-live', title: 'Attend a live session today', type: 'daily', xp_reward: 50, points_reward: 18 },
  { id: 'weekly-live', title: 'Attend both live sessions this week', type: 'weekly', xp_reward: 80, points_reward: 30 },
  { id: 'weekly-lessons', title: 'Complete 3 lessons this week', type: 'weekly', xp_reward: 90, points_reward: 35 },
]

const createChallenges = (): Challenge[] => {
  const dayIndex = Math.floor(Date.now() / 86400000)
  const weekIndex = Math.floor(dayIndex / 7)
  const dailyChallenges = challengeCatalog.filter((challenge) => challenge.type === 'daily')
  const weeklyChallenges = challengeCatalog.filter((challenge) => challenge.type === 'weekly')
  return [
    dailyChallenges[dayIndex % dailyChallenges.length],
    dailyChallenges[(dayIndex + 1) % dailyChallenges.length],
    weeklyChallenges[weekIndex % weeklyChallenges.length],
  ].map((challenge) => ({ ...challenge, completed: false }))
}

const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

const getLevelInfo = (xp: number) => {
  let levelIndex = 0
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (xp >= threshold) levelIndex = index
  })
  const currentThreshold = LEVEL_THRESHOLDS[levelIndex]
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? currentThreshold + (levelIndex + 2) * 600
  return {
    level: levelIndex + 1,
    currentThreshold,
    nextThreshold,
    progress: Math.min(100, ((xp - currentThreshold) / Math.max(1, nextThreshold - currentThreshold)) * 100),
  }
}

const getBadgeIcon = (icon: string) => {
  if (icon === 'quiz') return <QuizOutlinedIcon />
  if (icon === 'streak') return <LocalFireDepartmentOutlinedIcon />
  if (icon === 'attendance') return <EventAvailableOutlinedIcon />
  if (icon === 'course') return <MenuBookOutlinedIcon />
  return <BoltOutlinedIcon />
}

const getDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

const getStreakInfo = (activityDates: string[], asOf: string) => {
  const activeDays = new Set(activityDates.map(getDateKey).filter((date): date is string => Boolean(date)))
  const today = new Date(asOf)
  const todayKey = getDateKey(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = getDateKey(yesterday)
  let current = 0
  if (todayKey && (activeDays.has(todayKey) || (yesterdayKey && activeDays.has(yesterdayKey)))) {
    const cursor = new Date(activeDays.has(todayKey) ? today : yesterday)
    while (true) {
      const key = getDateKey(cursor)
      if (!key || !activeDays.has(key)) break
      current += 1
      cursor.setDate(cursor.getDate() - 1)
    }
  }

  const sortedDays = [...activeDays].map((key) => {
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year, month, day)
  }).sort((first, second) => first.getTime() - second.getTime())
  let longest = 0
  let run = 0
  sortedDays.forEach((date, index) => {
    const previous = sortedDays[index - 1]
    const isConsecutive = previous && (date.getTime() - previous.getTime()) / 86400000 === 1
    run = isConsecutive ? run + 1 : 1
    longest = Math.max(longest, run)
  })

  return { current, longest }
}

const GamificationCard: FC<{ title: string; description: string; icon: ReactNode; children: ReactNode }> = ({ title, description, icon, children }) => (
  <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider' }}>
    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', p: 1, borderRadius: 2, color: 'primary.main', backgroundColor: 'action.hover' }}>{icon}</Box>
      <Box>
        <Typography component="h2" variant="h6">{title}</Typography>
        <Typography color="text.secondary" variant="body2">{description}</Typography>
      </Box>
    </Stack>
    {children}
  </Paper>
)

const XPLevelCard: FC<{ stats: StudentStats; lessonCount: number; quizCount: number; liveCount: number }> = ({ stats, lessonCount, quizCount, liveCount }) => {
  const levelInfo = getLevelInfo(stats.xp)
  const xpToNext = Math.max(0, levelInfo.nextThreshold - stats.xp)

  return <GamificationCard title={`Level ${stats.level} learner`} description={`${xpToNext} XP to Level ${stats.level + 1}`} icon={<TrendingUpOutlinedIcon />}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2 }}>
      <Box>
        <Typography variant="h3" sx={{ lineHeight: 1, fontWeight: 800 }}>{stats.xp}</Typography>
        <Typography color="text.secondary" variant="body2">total XP</Typography>
      </Box>
      <Box sx={{ minWidth: { sm: 150 } }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{stats.points.toLocaleString()} Points</Typography>
        <Typography color="text.secondary" variant="caption">Spendable balance</Typography>
      </Box>
    </Stack>
    <LinearProgress variant="determinate" value={levelInfo.progress} aria-label={`Level ${stats.level} progress`} sx={{ height: 9, borderRadius: 5, mb: 0.75 }} />
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
      <Typography color="text.secondary" variant="caption">Level {stats.level}</Typography>
      <Typography color="text.secondary" variant="caption">{levelInfo.nextThreshold} XP</Typography>
    </Stack>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip size="small" icon={<MenuBookOutlinedIcon />} label={`${lessonCount} lessons`} variant="outlined" />
      <Chip size="small" icon={<QuizOutlinedIcon />} label={`${quizCount} quizzes`} variant="outlined" />
      <Chip size="small" icon={<EventAvailableOutlinedIcon />} label={`${liveCount} live sessions`} variant="outlined" />
    </Stack>
  </GamificationCard>
}

const StreakCard: FC<{ stats: StudentStats }> = ({ stats }) => (
  <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider', background: 'linear-gradient(135deg, rgba(237, 108, 2, 0.12), rgba(237, 108, 2, 0.03))' }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
      <Box>
        <Typography color="warning.dark" variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>Learning streak</Typography>
        <Typography variant="h3" sx={{ lineHeight: 1, fontWeight: 800 }}>{stats.current_streak}</Typography>
        <Typography color="text.secondary">days in a row</Typography>
      </Box>
      <Box sx={{ display: 'flex', p: 1.25, borderRadius: '50%', color: 'warning.dark', backgroundColor: 'rgba(237, 108, 2, 0.16)' }}><LocalFireDepartmentOutlinedIcon sx={{ fontSize: 34 }} /></Box>
    </Stack>
    <Divider sx={{ my: 2 }} />
    <Stack direction="row" justifyContent="space-between" spacing={1}>
      <Box><Typography variant="body2" sx={{ fontWeight: 700 }}>Longest streak</Typography><Typography color="text.secondary" variant="body2">{stats.longest_streak} days</Typography></Box>
      <Chip color="warning" size="small" label={stats.current_streak >= 7 ? 'Badge unlocked' : `${7 - stats.current_streak} days to badge`} />
    </Stack>
  </Paper>
)

const BadgesPanel: FC<{ badges: Badge[]; achievements: Achievement[] }> = ({ badges, achievements }) => {
  const unlockedIds = new Set(achievements.map((achievement) => achievement.badge_id))
  const unlockedBadges = badges.filter((badge) => unlockedIds.has(badge.id))
  const nextBadges = badges.filter((badge) => !unlockedIds.has(badge.id)).slice(0, 2)

  return <GamificationCard title="Badges" description={`${unlockedBadges.length} of ${badges.length} milestones unlocked`} icon={<EmojiEventsOutlinedIcon />}>
    {unlockedBadges.length > 0 ? <Stack spacing={1.25}>
      {unlockedBadges.map((badge) => {
        const achievement = achievements.find((item) => item.badge_id === badge.id)
        return <Stack key={badge.id} direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.25, borderRadius: 2, backgroundColor: 'background.default' }}>
          <Box sx={{ display: 'flex', p: 1, borderRadius: 2, color: 'warning.dark', backgroundColor: 'rgba(237, 108, 2, 0.13)' }}>{getBadgeIcon(badge.icon)}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{badge.name}</Typography>
            <Typography color="text.secondary" variant="body2">{badge.description}</Typography>
          </Box>
          {achievement && <Typography color="text.secondary" variant="caption" sx={{ whiteSpace: 'nowrap' }}>{new Date(achievement.unlocked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Typography>}
        </Stack>
      })}
    </Stack> : <Typography color="text.secondary" variant="body2">Complete a lesson, pass a quiz, or attend a live session to unlock your first badge.</Typography>}
    {nextBadges.length > 0 && <><Divider sx={{ my: 2 }} /><Typography variant="subtitle2" sx={{ mb: 1 }}>Next milestones</Typography><Stack spacing={0.75}>{nextBadges.map((badge) => <Stack key={badge.id} direction="row" spacing={1} alignItems="center"><LockOutlinedIcon fontSize="small" color="disabled" /><Typography color="text.secondary" variant="body2">{badge.name} · {badge.criteria}</Typography></Stack>)}</Stack></>}
  </GamificationCard>
}

const LeaderboardPanel: FC<{ entries: LeaderboardEntry[]; classTitle: string }> = ({ entries, classTitle }) => {
  const rankedEntries = [...entries].sort((first, second) => second.xp - first.xp)
  return <GamificationCard title="Class leaderboard" description={`XP ranking for ${classTitle}`} icon={<GroupOutlinedIcon />}>
    <Stack spacing={0.5}>
      {rankedEntries.map((entry, index) => <Stack key={entry.id} direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 1.5, backgroundColor: entry.isCurrentStudent ? 'action.hover' : 'transparent' }}>
        <Typography color="text.secondary" variant="body2" sx={{ width: 20, fontWeight: 700 }}>{index + 1}</Typography>
        <Avatar sx={{ width: 30, height: 30, fontSize: 12, backgroundColor: entry.isCurrentStudent ? 'primary.main' : 'secondary.main' }}>{entry.avatar}</Avatar>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: entry.isCurrentStudent ? 700 : 500 }}>{entry.name}{entry.isCurrentStudent ? ' (You)' : ''}</Typography>
        <Typography color="primary.main" variant="body2" sx={{ fontWeight: 700 }}>{entry.xp} XP</Typography>
      </Stack>)}
    </Stack>
    <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 1.5 }}>Only classmates in your cohort are included.</Typography>
  </GamificationCard>
}

const ChallengesPanel: FC<{ challenges: Challenge[]; onComplete: (id: string) => void }> = ({ challenges, onComplete }) => (
  <GamificationCard title="Challenges" description="Small goals that add bonus XP and Points" icon={<StarBorderOutlinedIcon />}>
    <Stack spacing={1.25}>
      {challenges.map((challenge) => <Card key={challenge.id} elevation={0} sx={{ border: 1, borderColor: challenge.completed ? 'success.light' : 'divider', backgroundColor: challenge.completed ? 'rgba(46, 125, 50, 0.06)' : 'background.default' }}>
        <CardContent sx={{ p: '12px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip size="small" label={challenge.type} color={challenge.type === 'daily' ? 'primary' : 'secondary'} variant="outlined" />
                {challenge.completed && <CheckCircleOutlineIcon color="success" fontSize="small" />}
              </Stack>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{challenge.title}</Typography>
              <Typography color="text.secondary" variant="caption">+{challenge.xp_reward} XP · +{challenge.points_reward} Points</Typography>
            </Box>
            <Button size="small" variant={challenge.completed ? 'outlined' : 'contained'} color={challenge.completed ? 'success' : 'primary'} disabled={challenge.completed} onClick={() => onComplete(challenge.id)}>{challenge.completed ? 'Completed' : 'Mark complete'}</Button>
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>
    <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 1.5 }}>Challenge progress is local for now; activity rewards remain based on your existing records.</Typography>
  </GamificationCard>
)

export const GamificationWidgets: FC<{ activity: GamificationActivity }> = ({ activity }) => {
  const [challenges, setChallenges] = useState<Challenge[]>(createChallenges)
  const challengeBonus = useMemo(() => challenges.filter((challenge) => challenge.completed).reduce((totals, challenge) => ({ xp: totals.xp + challenge.xp_reward, points: totals.points + challenge.points_reward }), { xp: 0, points: 0 }), [challenges])
  const stats = useMemo<StudentStats>(() => {
    const xp = activity.completedLessonIds.length * XP_REWARDS.lesson + activity.passedQuizIds.length * XP_REWARDS.quiz + activity.attendedLiveLessonIds.length * XP_REWARDS.live + challengeBonus.xp
    const levelInfo = getLevelInfo(xp)
    const streak = getStreakInfo(activity.activityDates, activity.asOf)
    return {
      student_id: activity.studentId,
      xp,
      level: levelInfo.level,
      points: activity.completedLessonIds.length * POINT_REWARDS.lesson + activity.passedQuizIds.length * POINT_REWARDS.quiz + activity.attendedLiveLessonIds.length * POINT_REWARDS.live + challengeBonus.points,
      current_streak: streak.current,
      longest_streak: streak.longest,
    }
  }, [activity, challengeBonus])
  const achievements = useMemo<Achievement[]>(() => {
    const unlockedAt = new Date().toISOString()
    const unlockedBadgeIds = [
      activity.passedQuizIds.length > 0 && 'first-quiz-passed',
      stats.longest_streak >= 7 && 'seven-day-streak',
      activity.liveLessonIds.length > 0 && activity.attendedLiveLessonIds.length >= activity.liveLessonIds.length && 'perfect-attendance',
      activity.completedCourseCount > 0 && 'course-completed',
      activity.completedLessonIds.length >= 10 && 'lesson-momentum',
    ].filter((badgeId): badgeId is string => Boolean(badgeId))
    return unlockedBadgeIds.map((badgeId, index) => ({ id: `${activity.studentId}-${badgeId}`, student_id: activity.studentId, badge_id: badgeId, unlocked_at: new Date(new Date(unlockedAt).getTime() - index * 86400000).toISOString() }))
  }, [activity, stats.longest_streak])
  const leaderboard = useMemo<LeaderboardEntry[]>(() => [
    { id: 'classmate-1', name: 'Maya', avatar: 'M', xp: 740 },
    { id: 'classmate-2', name: 'Noah', avatar: 'N', xp: 625 },
    { id: 'classmate-3', name: 'Sara', avatar: 'S', xp: 510 },
    { id: String(activity.studentId), name: activity.studentName.trim().split(/\s+/)[0] || 'You', avatar: initials(activity.studentName), xp: stats.xp, isCurrentStudent: true },
  ], [activity.studentId, activity.studentName, stats.xp])
  const completeChallenge = (challengeId: string) => setChallenges((current) => current.map((challenge) => challenge.id === challengeId ? { ...challenge, completed: true } : challenge))

  return <Box sx={{ mb: 3 }}>
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <Box sx={{ flex: 1 }}><XPLevelCard stats={stats} lessonCount={activity.completedLessonIds.length} quizCount={activity.passedQuizIds.length} liveCount={activity.attendedLiveLessonIds.length} /></Box>
      <Box sx={{ width: { xs: '100%', lg: 330 } }}><StreakCard stats={stats} /></Box>
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)' }, gap: 2 }}>
      <BadgesPanel badges={BADGES} achievements={achievements} />
      <Stack spacing={2}>
        <LeaderboardPanel entries={leaderboard} classTitle={activity.classTitle ?? 'your class cohort'} />
        <ChallengesPanel challenges={challenges} onComplete={completeChallenge} />
      </Stack>
    </Box>
  </Box>
}

export default GamificationWidgets
