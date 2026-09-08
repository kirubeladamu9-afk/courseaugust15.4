import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
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
import { type FC, type ReactNode } from 'react'
import { type GamificationData, type GamificationBadge, type GamificationAchievement, type GamificationChallenge, type GamificationLeaderboardEntry, type GamificationStats } from '@/services/api'

type StudentStats = GamificationStats
type Badge = GamificationBadge
type Achievement = GamificationAchievement
type Challenge = GamificationChallenge
type LeaderboardEntry = GamificationLeaderboardEntry

const getBadgeIcon = (icon: string) => {
  if (icon === 'quiz') return <QuizOutlinedIcon />
  if (icon === 'streak') return <LocalFireDepartmentOutlinedIcon />
  if (icon === 'attendance') return <EventAvailableOutlinedIcon />
  if (icon === 'course') return <MenuBookOutlinedIcon />
  return <BoltOutlinedIcon />
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
  const xpToNext = Math.max(0, stats.next_level_xp - stats.xp)

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
    <LinearProgress variant="determinate" value={stats.level_progress} aria-label={`Level ${stats.level} progress`} sx={{ height: 9, borderRadius: 5, mb: 0.75 }} />
    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
      <Typography color="text.secondary" variant="caption">Level {stats.level}</Typography>
      <Typography color="text.secondary" variant="caption">{stats.next_level_xp} XP</Typography>
    </Stack>
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip size="small" icon={<MenuBookOutlinedIcon />} label={`${lessonCount} lessons`} variant="outlined" />
      <Chip size="small" icon={<QuizOutlinedIcon />} label={`${quizCount} quizzes`} variant="outlined" />
      <Chip size="small" icon={<EventAvailableOutlinedIcon />} label={`${liveCount} live sessions`} variant="outlined" />
    </Stack>
  </GamificationCard>
}

const StreakCard: FC<{ stats: StudentStats }> = ({ stats }) => (
  <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: 1, borderColor: 'divider', background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.20 : 0.12)}, ${alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.08 : 0.03)})` }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
      <Box>
        <Typography color="warning.dark" variant="overline" sx={{ fontWeight: 800, letterSpacing: 1 }}>Learning streak</Typography>
        <Typography variant="h3" sx={{ lineHeight: 1, fontWeight: 800 }}>{stats.current_streak}</Typography>
        <Typography color="text.secondary">days in a row</Typography>
      </Box>
      <Box sx={{ display: 'flex', p: 1.25, borderRadius: '50%', color: 'warning.dark', backgroundColor: (theme) => alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.24 : 0.16) }}><LocalFireDepartmentOutlinedIcon sx={{ fontSize: 34 }} /></Box>
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
          <Box sx={{ display: 'flex', p: 1, borderRadius: 2, color: 'warning.dark', backgroundColor: (theme) => alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.22 : 0.13) }}>{getBadgeIcon(badge.icon)}</Box>
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
  const rankedEntries = [...entries].sort((first, second) => first.rank - second.rank)
  return <GamificationCard title="Class leaderboard" description={`XP ranking for ${classTitle}`} icon={<GroupOutlinedIcon />}>
    <Stack spacing={0.5}>
      {rankedEntries.map((entry) => <Stack key={entry.id} direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 1.5, backgroundColor: entry.isCurrentStudent ? 'action.hover' : 'transparent' }}>
        <Typography color="text.secondary" variant="body2" sx={{ width: 20, fontWeight: 700 }}>{entry.rank}</Typography>
        <Avatar sx={{ width: 30, height: 30, fontSize: 12, backgroundColor: entry.isCurrentStudent ? 'primary.main' : 'secondary.main' }}>{entry.avatar}</Avatar>
        <Typography variant="body2" sx={{ flex: 1, fontWeight: entry.isCurrentStudent ? 700 : 500 }}>{entry.name}{entry.isCurrentStudent ? ' (You)' : ''}</Typography>
        <Typography color="primary.main" variant="body2" sx={{ fontWeight: 700 }}>{entry.xp} XP</Typography>
      </Stack>)}
    </Stack>
    <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 1.5 }}>Only classmates in your cohort are included.</Typography>
  </GamificationCard>
}

const ChallengesPanel: FC<{ challenges: Challenge[] }> = ({ challenges }) => (
  <GamificationCard title="Challenges" description="Small goals that add bonus XP and Points" icon={<StarBorderOutlinedIcon />}>
    <Stack spacing={1.25}>
      {challenges.map((challenge) => <Card key={challenge.id} elevation={0} sx={{ border: 1, borderColor: challenge.completed ? 'success.light' : 'divider', backgroundColor: challenge.completed ? (theme) => alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.16 : 0.06) : 'background.default' }}>
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
            <Chip size="small" label={challenge.completed ? 'Completed' : 'In progress'} color={challenge.completed ? 'success' : 'default'} variant={challenge.completed ? 'outlined' : 'filled'} />
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>
    <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 1.5 }}>Challenge status and rewards are based on your recorded learning activity.</Typography>
  </GamificationCard>
)

export const GamificationWidgets: FC<{ data: GamificationData }> = ({ data }) => {
  const { stats, badges, achievements, challenges, leaderboard, classTitle } = data
  const lessonCount = stats.lesson_count
  const quizCount = stats.quiz_count
  const liveCount = stats.live_count

  return <Box sx={{ mb: 3 }}>
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <Box sx={{ flex: 1 }}><XPLevelCard stats={stats} lessonCount={lessonCount} quizCount={quizCount} liveCount={liveCount} /></Box>
      <Box sx={{ width: { xs: '100%', lg: 330 } }}><StreakCard stats={stats} /></Box>
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)' }, gap: 2 }}>
      <BadgesPanel badges={badges} achievements={achievements} />
      <Stack spacing={2}>
        <LeaderboardPanel entries={leaderboard} classTitle={classTitle ?? 'your class cohort'} />
        <ChallengesPanel challenges={challenges} />
      </Stack>
    </Box>
  </Box>
}

export default GamificationWidgets
