import type { ComponentType, ReactNode } from 'react'
import type { AdminLesson, InteractiveHotspot } from '@/components/admin/admin-data'
import type { LabScenario, ThreeDModel } from './stem-engines'

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
  completionMode: 'launch_confirm'
  completionMessage: string
}

export type StemGraphConfig = StemBaseConfig & {
  expression: string
  targetX: number
}

export type StemLinearEquationConfig = StemBaseConfig & {
  equation: string
}

export type StemCalculatorConfig = StemBaseConfig & {
  initialExpression: string
}

export type StemGeometryConfig = StemBaseConfig & {
  requiredVertices: 3 | 4
}

export type StemFormulaConfig = StemBaseConfig & {
  formula: string
  solveFor: string
}

export type StemPhysicsSimulationConfig = StemBaseConfig & {
  scenario: 'projectile_motion' | 'constant_force'
}

export type StemChemistrySimulationConfig = StemBaseConfig & {
  scenario: 'reaction_rate' | 'acid_base'
}

export type StemBiologySimulationConfig = StemBaseConfig & {
  scenario: 'population_growth' | 'cell_division'
}

export type StemLabEnvironmentConfig = StemBaseConfig & {
  scenario: LabScenario
  activity: 'virtual_lab' | 'experiment'
  steps: string[]
}

export type StemCircuitConfig = StemBaseConfig & {
  topology: 'series' | 'parallel'
  voltage: number
  resistors: number[]
}

export type StemPeriodicTableConfig = StemBaseConfig & {
  targetAtomicNumbers: number[]
}

export type StemMoleculeConfig = StemBaseConfig & {
  targetFormula: string
}

export type StemChemicalEquationConfig = StemBaseConfig & {
  equation: string
}

export type StemDiagramConfig = StemBaseConfig & {
  imageUrl: string
  hotspots: InteractiveHotspot[]
}

export type StemThreeDConfig = StemBaseConfig & {
  model: ThreeDModel
  requiredLabels: string[]
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

export type StemLabConfig =
  | StemEmbedConfig
  | StemGraphConfig
  | StemLinearEquationConfig
  | StemCalculatorConfig
  | StemGeometryConfig
  | StemFormulaConfig
  | StemPhysicsSimulationConfig
  | StemChemistrySimulationConfig
  | StemBiologySimulationConfig
  | StemLabEnvironmentConfig
  | StemCircuitConfig
  | StemPeriodicTableConfig
  | StemMoleculeConfig
  | StemChemicalEquationConfig
  | StemDiagramConfig
  | StemThreeDConfig
  | StemPunnettConfig
  | StemClassificationConfig

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
