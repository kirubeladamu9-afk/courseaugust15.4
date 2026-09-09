export type StemSubject = 'Math' | 'Physics' | 'Chemistry' | 'Biology'

export type StemTool =
  | 'diagram'
  | 'calculator'
  | 'graph'
  | 'equation-solver'
  | 'geometry'
  | 'builder'
  | 'simulation'
  | 'game'
  | 'experiment'
  | 'circuit-builder'
  | 'virtual-lab'
  | 'periodic-table'
  | 'molecule-builder'
  | 'chemical-equation'
  | 'three-d-explorer'
  | 'genetics-punnett-square'
  | 'classification-builder'

export type StemVariable = {
  id: number
  name: string
  label: string
  min: number
  max: number
  step: number
  initial: number
}

export type StemConfig = {
  version: 1
  instructions: string
  topic: string
  formula: string
  outputLabel: string
  variables: StemVariable[]
}

export type StemActivityResult = {
  tool: StemTool
  values: Record<string, number>
}

export type StemToolDefinition = {
  type: StemTool
  label: string
  subject: StemSubject
  available: boolean
}

export const STEM_SUBJECTS: StemSubject[] = ['Math', 'Physics', 'Chemistry', 'Biology']

export const STEM_TOOLS: StemToolDefinition[] = [
  { type: 'diagram', label: 'Diagram', subject: 'Math', available: true },
  { type: 'calculator', label: 'Calculator', subject: 'Math', available: true },
  { type: 'graph', label: 'Graph', subject: 'Math', available: true },
  { type: 'equation-solver', label: 'Equation Solver', subject: 'Math', available: false },
  { type: 'geometry', label: 'Geometry', subject: 'Math', available: false },
  { type: 'builder', label: 'Builder', subject: 'Math', available: false },

  { type: 'diagram', label: 'Diagram', subject: 'Physics', available: true },
  { type: 'calculator', label: 'Calculator', subject: 'Physics', available: true },
  { type: 'graph', label: 'Graph', subject: 'Physics', available: true },
  { type: 'simulation', label: 'Simulation', subject: 'Physics', available: false },
  { type: 'game', label: 'Game', subject: 'Physics', available: false },
  { type: 'experiment', label: 'Experiment', subject: 'Physics', available: false },
  { type: 'circuit-builder', label: 'Circuit Builder', subject: 'Physics', available: false },

  { type: 'diagram', label: 'Diagram', subject: 'Chemistry', available: true },
  { type: 'calculator', label: 'Calculator', subject: 'Chemistry', available: true },
  { type: 'graph', label: 'Graph', subject: 'Chemistry', available: true },
  { type: 'virtual-lab', label: 'Virtual Lab', subject: 'Chemistry', available: false },
  { type: 'periodic-table', label: 'Periodic Table', subject: 'Chemistry', available: false },
  { type: 'molecule-builder', label: 'Molecule Builder', subject: 'Chemistry', available: false },
  { type: 'chemical-equation', label: 'Chemical Equation', subject: 'Chemistry', available: false },

  { type: 'diagram', label: 'Diagram', subject: 'Biology', available: true },
  { type: 'calculator', label: 'Calculator', subject: 'Biology', available: true },
  { type: 'graph', label: 'Graph', subject: 'Biology', available: true },
  { type: 'three-d-explorer', label: '3D Explorer', subject: 'Biology', available: false },
  { type: 'genetics-punnett-square', label: 'Genetics/Punnett Square', subject: 'Biology', available: false },
  { type: 'classification-builder', label: 'Classification Builder', subject: 'Biology', available: false },
]

export const getStemToolsForSubject = (subject: StemSubject) => STEM_TOOLS.filter((tool) => tool.subject === subject)

export const getStemTool = (subject: StemSubject | undefined, type: StemTool | undefined) => STEM_TOOLS.find((tool) => tool.subject === subject && tool.type === type)

export const STEM_ACTIVITY_TOOLS: StemTool[] = ['diagram', 'calculator', 'graph']
