/**
 * Market-research metrics shown above the footer.
 *
 * PLACEHOLDERS: these figures are not from real research yet. Replace each
 * `value` and `label` with numbers from the published report, add its `source`,
 * then set IMPACT_IS_PLACEHOLDER to false to remove the on-page notice.
 */
export const IMPACT_IS_PLACEHOLDER = true;

export interface ImpactMetric {
  id: 'adherence' | 'response' | 'voice' | 'reassurance';
  /** Shown before the number, e.g. "<". */
  prefix?: string;
  value: number;
  /** Shown after the number, e.g. "%", "×", "s". */
  suffix?: string;
  label: string;
  /** Citation for the figure, shown once real data is in. */
  source?: string;
}

export const IMPACT_METRICS: readonly ImpactMetric[] = [
  { id: 'adherence', value: 3, suffix: '×', label: 'Better medicine routines with spoken reminders' },
  { id: 'response', prefix: '<', value: 60, suffix: 's', label: 'To alert family after a fall or SOS' },
  { id: 'voice', value: 92, suffix: '%', label: 'Of older adults prefer voice over apps' },
  { id: 'reassurance', value: 40, suffix: '%', label: 'Less daily worry for family caregivers' },
];
