export type StemSubject = 'Math' | 'Physics' | 'Biology' | 'Chemistry'

export type StemTool = 'graph' | 'simulation' | 'virtual-lab' | 'diagram' | 'calculator' | 'builder' | 'experiment' | 'game'

export type StemVariable = {
  id: number
  name: string
  label: string
  min: number
  max: number
  step: number
  initial: number
}

export type StemItem = {
  id: number
  label: string
  detail: string
}

export type StemQuestion = {
  id: number
  prompt: string
  options: string[]
  correctAnswer: string
}

export type StemConfig = {
  version: 1
  instructions: string
  topic: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  completionScore: number
  maxAttempts: number
  timeLimitSeconds: number
  formula: string
  outputLabel: string
  targetValue: number
  variables: StemVariable[]
  items: StemItem[]
  procedure: StemItem[]
  questions: StemQuestion[]
}

export type StemActivityResult = {
  score: number
  passed: boolean
  attempt: number
  values: Record<string, number>
  answers: Record<number, string>
}

export const STEM_TOOLS: Array<{ type: StemTool; label: string }> = [
  { type: 'graph', label: 'Graphing' },
  { type: 'simulation', label: 'Simulation' },
  { type: 'virtual-lab', label: 'Virtual Lab' },
  { type: 'diagram', label: 'Diagram' },
  { type: 'calculator', label: 'Calculator' },
  { type: 'builder', label: 'Builder' },
  { type: 'experiment', label: 'Experiment' },
  { type: 'game', label: 'Game' },
]
