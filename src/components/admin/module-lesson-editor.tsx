import { useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import type { AdminCourse } from './admin-data'

interface ModuleLessonEditorProps {
  course: AdminCourse
  onChange: (course: AdminCourse) => void
  showAddModule?: boolean
}

const ModuleLessonEditor: FC<ModuleLessonEditorProps> = ({ course, onChange, showAddModule = false }) => {
  const [draggedModule, setDraggedModule] = useState<number | null>(null)
  const [draggedLesson, setDraggedLesson] = useState<{ moduleId: number; index: number } | null>(null)

  const moveModule = (targetId: number) => {
    if (draggedModule === null || draggedModule === targetId) return

    const from = course.modules.findIndex((module) => module.id === draggedModule)
    const to = course.modules.findIndex((module) => module.id === targetId)
    const next = [...course.modules]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange({ ...course, modules: next })
    setDraggedModule(null)
  }

  const moveLesson = (moduleId: number, targetIndex: number) => {
    if (!draggedLesson || draggedLesson.moduleId !== moduleId || draggedLesson.index === targetIndex) return

    const nextModules = course.modules.map((module) => {
      if (module.id !== moduleId) return module

      const lessons = [...module.lessons]
      const [moved] = lessons.splice(draggedLesson.index, 1)
      lessons.splice(targetIndex, 0, moved)
      return { ...module, lessons }
    })

    onChange({ ...course, modules: nextModules })
    setDraggedLesson(null)
  }

  return (
    <Paper elevation={0} sx={{ mt: 3, p: 2.5, border: 1, borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Modules & lessons editor</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>Drag modules or lessons to reorder the course structure.</Typography>
      <Stack spacing={1.5}>
        {course.modules.map((module) => (
          <Paper
            key={module.id}
            elevation={0}
            draggable
            onDragStart={() => setDraggedModule(module.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => moveModule(module.id)}
            sx={{ p: 1.5, backgroundColor: 'background.default', border: 1, borderColor: 'divider' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DragIndicatorIcon color="disabled" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{module.title}</Typography>
            </Box>
            <Stack spacing={0.5} sx={{ mt: 1, ml: 4 }}>
              {module.lessons.map((lesson, index) => (
                <Box
                  key={`${module.id}-${lesson}`}
                  draggable
                  onDragStart={(event) => {
                    event.stopPropagation()
                    setDraggedLesson({ moduleId: module.id, index })
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation()
                    moveLesson(module.id, index)
                  }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, px: 1, backgroundColor: 'background.paper', borderRadius: 1 }}
                >
                  <DragIndicatorIcon color="disabled" fontSize="small" />
                  <Typography variant="body2">{lesson}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        ))}
        {showAddModule && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Typography color="primary.main" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
              <AddIcon fontSize="small" /> Add module
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  )
}

export default ModuleLessonEditor
