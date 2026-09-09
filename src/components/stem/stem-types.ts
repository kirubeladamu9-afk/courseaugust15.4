import type { ComponentType, ReactNode } from 'react'
import type { AdminLesson, InteractiveHotspot } from '@/components/admin/admin-data'

export const STEM_SUBJECTS = ['math', 'physics', 'chemistry', 'biology'] as const

export type StemSubject = typeof STEM_SUBJECTS[number]
export type StemTool =
  | 'graph'
  | 'equation_solver'
  | 'calculator'
  | 'geometry_builder'
  | 'simulation'
  | 'formula_solver'
  | 'experiment'
  | 'virtual_lab'
  | 'circuit_builder'
  | 'periodic_table'
  | 'molecule_builder'
  | 'chemical_equation'
  | 'interactive_diagram'
  | 'three_d_explorer'
  | 'genetics_punnett_square'
  | 'classification_builder'
export type StemSubtype = `${StemSubject}.${StemTool}`

export type StemBaseConfig = {
  version: 1
  topic: string
  instructions: string
}

export type StemEmbedConfig = StemBaseConfig & {
  provider: string
  embedUrl: string
  completionMode: 'postmessage' | 'launch_confirm'
  completionMessage: string
}

export type StemFormulaConfig = StemBaseConfig & {
  formula: string
  solveFor: string
}

export type StemLinearEquationConfig = StemBaseConfig & {
  equation: string
}

export type StemPeriodicTableConfig = StemBaseConfig & {
  targetAtomicNumbers: number[]
}

export type StemChemicalEquationConfig = StemBaseConfig & {
  equation: string
}

export type StemPunnettConfig = StemBaseConfig & {
  parentOne: string
  parentTwo: string
  dominantTrait: string
  recessiveTrait: string
}

export type StemClassificationItem = {
  id: number
  label: string
  category: string
}

export type StemClassificationConfig = StemBaseConfig & {
  categories: string[]
  items: StemClassificationItem[]
}

export type StemDiagramConfig = StemBaseConfig & {
  imageUrl: string
  hotspots: InteractiveHotspot[]
}

export type StemLabConfig =
  | StemEmbedConfig
  | StemFormulaConfig
  | StemLinearEquationConfig
  | StemPeriodicTableConfig
  | StemChemicalEquationConfig
  | StemPunnettConfig
  | StemClassificationConfig
  | StemDiagramConfig

export type StemActivityResult = {
  subtype: StemSubtype
  values: Record<string, unknown>
}

export type StemToolBuilderProps = {
  lesson: AdminLesson
  config: StemLabConfig
  onConfigChange: (config: StemLabConfig) => void
}

export type StemToolPlayerProps = {
  config: StemLabConfig
  onComplete: (values?: Record<string, unknown>) => void
}

export type StemToolDefinition = {
  subject: StemSubject
  tool: StemTool
  subtype: StemSubtype
  label: string
  icon: ReactNode
  Builder: ComponentType<StemToolBuilderProps>
  Player: ComponentType<StemToolPlayerProps>
  mode: 'build' | 'embed'
  defaultConfig: StemLabConfig
  isConfigured: (config: StemLabConfig) => boolean
}

export const STEM_SUBJECT_LABELS: Record<StemSubject, string> = {
  math: 'Math',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
}
