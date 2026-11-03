import React from 'react';
import { ICON_PATHS, IconName } from './icon-paths';

/** HoneLENS line icon (24 grid, 1.75 stroke, square caps, mitre joins, currentColor). */
export const Icon: React.FC<{ name: IconName; size?: number; color?: string; style?: React.CSSProperties; strokeWidth?: number }> =
  ({ name, size = 20, color = 'currentColor', style, strokeWidth = 1.75 }) => (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" className="hl-icon"
      style={{ flex: 'none', display: 'inline-block', ...style }}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  );

/** The lens glyph used on the floating "Analyze with HoneLENS" button (src/content/fab.js). */
export const LensGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="square" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5 5" />
  </svg>
);
