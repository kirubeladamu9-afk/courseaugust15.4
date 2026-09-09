import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined'
import type { ReactNode } from 'react'
import { ChemicalEquationBuilder, ChemicalEquationPlayer, ClassificationBuilder, ClassificationPlayer, DiagramBuilder, DiagramPlayer, EmbedBuilder, EmbedPlayer, FormulaBuilder, FormulaPlayer, LinearEquationBuilder, LinearEquationPlayer, PeriodicTableBuilder, PeriodicTablePlayer, PunnettBuilder, PunnettPlayer, balanceChemicalEquation, solveLinearEquation } from './stem-tool-components'
import type { StemChemicalEquationConfig, StemClassificationConfig, StemDiagramConfig, StemEmbedConfig, StemFormulaConfig, StemLabConfig, StemLinearEquationConfig, StemPeriodicTableConfig, StemPunnettConfig, StemSubject, StemSubtype, StemTool, StemToolDefinition } from './stem-types'

const embed = (provider: string, instructions: string): StemEmbedConfig => ({ version: 1, topic: '', instructions, provider, embedUrl: '', completionMode: 'launch_confirm', completionMessage: 'Complete one meaningful activity run, then record it here.' })
const formula = (topic: string, expression: string): StemFormulaConfig => ({ version: 1, topic, instructions: 'Enter the known values, calculate the result, then record your completed calculation.', formula: expression, solveFor: 'Result' })
const secureUrl = (value: string) => { try { return new URL(value).protocol === 'https:' } catch { return false } }
const validEmbed = (config: StemLabConfig) => { const item = config as StemEmbedConfig; return Boolean(item.instructions.trim() && item.provider.trim() && secureUrl(item.embedUrl)) }
const validFormula = (config: StemLabConfig) => { const item = config as StemFormulaConfig; return Boolean(item.instructions.trim() && item.formula.includes('=') && item.solveFor.trim()) }
const validLinearEquation = (config: StemLabConfig) => { const item = config as StemLinearEquationConfig; return Boolean(item.instructions.trim() && Number.isFinite(solveLinearEquation(item.equation))) }
const validPeriodicTable = (config: StemLabConfig) => { const item = config as StemPeriodicTableConfig; return Boolean(item.instructions.trim() && item.targetAtomicNumbers.length && item.targetAtomicNumbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 118)) }
const validChemicalEquation = (config: StemLabConfig) => { const item = config as StemChemicalEquationConfig; return Boolean(item.instructions.trim() && balanceChemicalEquation(item.equation)) }
const validPunnett = (config: StemLabConfig) => { const item = config as StemPunnettConfig; return Boolean(item.instructions.trim() && /^[A-Za-z]{2}$/.test(item.parentOne) && /^[A-Za-z]{2}$/.test(item.parentTwo) && item.dominantTrait.trim() && item.recessiveTrait.trim()) }
const validClassification = (config: StemLabConfig) => { const item = config as StemClassificationConfig; return Boolean(item.instructions.trim() && item.categories.length >= 2 && item.items.length && item.items.every((entry) => entry.label.trim() && item.categories.includes(entry.category))) }
const validDiagram = (config: StemLabConfig) => { const item = config as StemDiagramConfig; return Boolean(item.instructions.trim() && item.imageUrl && item.hotspots.length) }

const definition = (subject: StemSubject, tool: StemTool, label: string, icon: ReactNode, Builder: StemToolDefinition['Builder'], Player: StemToolDefinition['Player'], mode: StemToolDefinition['mode'], defaultConfig: StemLabConfig, isConfigured: StemToolDefinition['isConfigured']): StemToolDefinition => ({ subject, tool, subtype: `${subject}.${tool}` as StemSubtype, label, icon, Builder, Player, mode, defaultConfig, isConfigured })

export const STEM_LAB_REGISTRY: StemToolDefinition[] = [
  definition('math', 'graph', 'Graph', <ShowChartOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('Desmos or GeoGebra', 'Explore the graph and complete the assigned observation.'), validEmbed),
  definition('math', 'equation_solver', 'Equation Solver', <FunctionsOutlinedIcon />, LinearEquationBuilder, LinearEquationPlayer, 'build', { version: 1, topic: 'Linear equations', instructions: 'Solve the linear equation for x.', equation: '2x + 3 = 11' }, validLinearEquation),
  definition('math', 'calculator', 'Calculator', <CalculateOutlinedIcon />, FormulaBuilder, FormulaPlayer, 'build', formula('Calculation', 'Result = a + b'), validFormula),
  definition('math', 'geometry_builder', 'Geometry Builder', <AccountTreeOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('GeoGebra', 'Construct and explore the assigned geometric figure.'), validEmbed),

  definition('physics', 'graph', 'Graph', <ShowChartOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('Desmos or GeoGebra', 'Explore the graph and complete the assigned observation.'), validEmbed),
  definition('physics', 'simulation', 'Simulation', <ScienceOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET', 'Run the simulation and complete the assigned investigation.'), validEmbed),
  definition('physics', 'formula_solver', 'Calculator / Formula Solver', <CalculateOutlinedIcon />, FormulaBuilder, FormulaPlayer, 'build', formula('Physics calculation', 'F = m * a'), validFormula),
  definition('physics', 'experiment', 'Experiment', <BiotechOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET', 'Follow the experiment instructions, make observations, then record a completed run.'), validEmbed),
  definition('physics', 'virtual_lab', 'Virtual Lab', <BiotechOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET', 'Complete the virtual lab activity.'), validEmbed),
  definition('physics', 'circuit_builder', 'Circuit Builder', <HubOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('CircuitJS', 'Build and test the assigned circuit.'), validEmbed),

  definition('chemistry', 'formula_solver', 'Calculator / Formula Solver', <CalculateOutlinedIcon />, FormulaBuilder, FormulaPlayer, 'build', formula('Chemistry calculation', 'Result = m / V'), validFormula),
  definition('chemistry', 'periodic_table', 'Periodic Table', <TableChartOutlinedIcon />, PeriodicTableBuilder, PeriodicTablePlayer, 'build', { version: 1, topic: 'Element identification', instructions: 'Select every target element from the periodic table.', targetAtomicNumbers: [1, 6, 8] }, validPeriodicTable),
  definition('chemistry', 'molecule_builder', 'Molecule Builder', <ViewInArOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('Ketcher or 3Dmol.js', 'Build or inspect the assigned molecule.'), validEmbed),
  definition('chemistry', 'chemical_equation', 'Chemical Equation', <FunctionsOutlinedIcon />, ChemicalEquationBuilder, ChemicalEquationPlayer, 'build', { version: 1, topic: 'Balancing equations', instructions: 'Balance the equation with the smallest whole-number coefficients.', equation: 'Fe + O2 -> Fe2O3' }, validChemicalEquation),
  definition('chemistry', 'simulation', 'Simulation', <ScienceOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET', 'Run the simulation and complete the assigned investigation.'), validEmbed),
  definition('chemistry', 'virtual_lab', 'Virtual Lab', <BiotechOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET', 'Complete the virtual lab activity.'), validEmbed),
  definition('chemistry', 'experiment', 'Experiment', <BiotechOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET', 'Follow the experiment instructions, make observations, then record a completed run.'), validEmbed),

  definition('biology', 'interactive_diagram', 'Interactive Diagram', <AccountTreeOutlinedIcon />, DiagramBuilder, DiagramPlayer, 'build', { version: 1, topic: 'Biology diagram', instructions: 'Open every labeled hotspot to explore the diagram.', imageUrl: '', hotspots: [] }, validDiagram),
  definition('biology', 'three_d_explorer', '3D Explorer', <ViewInArOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('Mol* or BioDigital', 'Inspect the 3D model and complete the assigned exploration.'), validEmbed),
  definition('biology', 'virtual_lab', 'Virtual Lab', <BiotechOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET or Labster', 'Complete the virtual lab activity.'), validEmbed),
  definition('biology', 'simulation', 'Simulation', <ScienceOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('PhET', 'Run the simulation and complete the assigned investigation.'), validEmbed),
  definition('biology', 'genetics_punnett_square', 'Genetics / Punnett Square', <CategoryOutlinedIcon />, PunnettBuilder, PunnettPlayer, 'build', { version: 1, topic: 'Mendelian genetics', instructions: 'Use the Punnett square, then calculate the dominant phenotype percentage.', parentOne: 'Aa', parentTwo: 'Aa', dominantTrait: 'Dominant trait', recessiveTrait: 'Recessive trait' }, validPunnett),
  definition('biology', 'classification_builder', 'Classification Builder', <CategoryOutlinedIcon />, ClassificationBuilder, ClassificationPlayer, 'build', { version: 1, topic: 'Classification', instructions: 'Drag every item into its correct category.', categories: ['Category A', 'Category B'], items: [{ id: 1, label: 'Item 1', category: 'Category A' }, { id: 2, label: 'Item 2', category: 'Category B' }] }, validClassification),
  definition('biology', 'experiment', 'Experiment', <BiotechOutlinedIcon />, EmbedBuilder, EmbedPlayer, 'embed', embed('Lab activity', 'Follow the experiment instructions, then record a completed run.'), validEmbed),
]

export const getStemToolsForSubject = (subject: StemSubject) => STEM_LAB_REGISTRY.filter((definition) => definition.subject === subject)
export const getStemTool = (subject?: StemSubject, tool?: StemTool) => STEM_LAB_REGISTRY.find((definition) => definition.subject === subject && definition.tool === tool)
export const getStemToolBySubtype = (subtype?: string) => STEM_LAB_REGISTRY.find((definition) => definition.subtype === subtype)
export const defaultStemLabConfig = (subject: StemSubject, tool: StemTool) => structuredClone(getStemTool(subject, tool)?.defaultConfig ?? STEM_LAB_REGISTRY[0].defaultConfig)
