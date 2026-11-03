// HoneNurse / HoneLENS light-theme tokens (design/project/tokens.json). The video is always light,
// except the navy "night" moments (chapter cards, logo finale).
export const C = {
  navy: '#18324A',
  teal: '#1F6F78',
  tealTint: '#E3F0F1',
  tealLight: '#7CC4CB',
  paper: '#F8F8F5',
  white: '#FFFFFF',
  panel: '#EFEFEA',
  slate: '#5E6A72',
  hair: '#D3D1C7',
  field: '#7A858C',
  amber: '#7A4A0A',
  amberTint: '#FAEEDA',
  red: '#A32D2D',
  redTint: '#FCEBEB',
  night: '#0F1B27',
  nightRaised: '#162636',
  nightHair: '#26384A',
  nightText: '#E8ECEF',
  nightSlate: '#9AA8B2',
} as const;

export const FONT = {
  sans: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
  serif: '"IBM Plex Serif", Georgia, serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
} as const;

// One float shadow, as in the design system (hl-shadow-float), scaled for video.
export const SHADOW_FLOAT = '0 1px 2px rgba(24,50,74,.08), 0 12px 32px rgba(24,50,74,.14)';
export const SHADOW_WINDOW = '0 2px 6px rgba(24,50,74,.06), 0 30px 80px rgba(24,50,74,.16)';
