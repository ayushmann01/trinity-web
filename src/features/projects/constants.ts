export const PROJECT_SETUP_STEPS = [
  {
    id: 1,
    label: 'Project Profile',
    subtitle: 'Basic details used across the scorecard, reports and documents.',
  },
  {
    id: 2,
    label: 'Certification Details',
    subtitle: 'Rating system, typology alignment and target credits.',
  },
  {
    id: 3,
    label: 'Scorecard',
    subtitle: 'Credits you plan to attempt for this certification.',
  },
  {
    id: 4,
    label: 'Project Timeline',
    subtitle: 'Key dates used in reports and reviews.',
  },
  {
    id: 5,
    label: 'Review',
    subtitle: 'Confirm details before creating the project.',
  },
  {
    id: 6,
    label: 'Project Stakeholders',
    subtitle: 'People who will collaborate on this project.',
  },
] as const

export type WizardStepId = (typeof PROJECT_SETUP_STEPS)[number]['id']

export const AREA_UNITS = [
  { value: 'sq_m', label: 'sq m' },
  { value: 'sq_ft', label: 'sq ft' },
] as const

export type AreaUnit = (typeof AREA_UNITS)[number]['value']

export const CLIMATE_ZONES = [
  { value: 'hot-dry', label: 'Hot-Dry' },
  { value: 'warm-humid', label: 'Warm-Humid' },
  { value: 'temperate', label: 'Temperate' },
  { value: 'composite', label: 'Composite' },
  { value: 'cold', label: 'Cold' },
] as const

export const DEFAULT_TYPOLOGIES = [
  { id: 'new-construction', name: 'New Construction' },
  { id: 'core-and-shell', name: 'Core and Shell' },
  { id: 'interiors', name: 'Interiors' },
  { id: 'existing-building', name: 'Existing Building' },
  { id: 'residential', name: 'Residential' },
  { id: 'institutional', name: 'Institutional' },
  { id: 'industrial', name: 'Industrial' },
  { id: 'mixed-use', name: 'Mixed Use' },
] as const
