import React from 'react';
import { C, SHADOW_WINDOW } from '../brand/colors';
import { Icon } from './Icon';
import './css/honelens.css';

export const SECTIONS = ['Analyze', 'Read', 'Practice', 'Build', 'Audit', 'Library'] as const;
export type Section = (typeof SECTIONS)[number];

/**
 * The HoneLENS side panel, drawn with the product's own CSS (src/styles, synced into ui/css).
 * Laid out at `width` CSS px (360–480 like Chrome's side panel) and enlarged with CSS zoom so text
 * is re-laid-out crisp at video resolution — never a blurry bitmap scale.
 *
 * `scrollY` scrolls the body (px, in panel CSS px) so a scene can glide down long screens.
 * `sub` draws the segmented sub-navigation for multi-screen sections (Read, Practice).
 */
export const PanelFrame: React.FC<{
  section?: Section | null;
  sub?: { items: string[]; value: string };
  width?: number;
  height?: number;      // panel CSS px
  zoom?: number;
  scrollY?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  chrome?: boolean;      // draw a hairline frame + window shadow (default true)
}> = ({ section = 'Analyze', sub, width = 400, height = 760, zoom = 2, scrollY = 0, children, style, chrome = true }) => (
  <div
    className="hl-canvas"
    style={{
      zoom, width, height, background: C.paper, overflow: 'hidden', position: 'relative',
      borderRadius: chrome ? 10 : 0, boxShadow: chrome ? SHADOW_WINDOW : undefined,
      border: chrome ? `1px solid ${C.hair}` : undefined, ...style,
    }}
  >
    <div className="hl-panel hl-app" style={{ minHeight: '100%', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="hl-appbar hl-solid" style={{ position: 'relative', zIndex: 2, background: C.paper, boxShadow: scrollY > 4 ? `inset 0 -1px 0 ${C.hair}, 0 6px 16px rgba(24,50,74,.06)` : `inset 0 -1px 0 ${C.hair}` }}>
        <div className="hl-appbar__row">
          <span className="hl-appbar__name">HoneLENS</span>
          <button type="button" className="hl-btn hl-btn--quiet hl-btn--icon" aria-label="Settings"><Icon name="settings" size={20} /></button>
        </div>
        {section !== null ? (
          <nav className="hl-tabs" role="tablist" style={{ overflow: 'hidden' }}>
            {SECTIONS.map(s => (
              // Video: slightly tighter tab padding so all six sections fit a 400 px panel
              // (the product scrolls the tab row instead; a clipped "Library" looks broken on film).
              <button key={s} type="button" className="hl-tab" role="tab" aria-selected={s === section ? 'true' : 'false'} style={{ padding: '0 7.5px' }}>{s}</button>
            ))}
          </nav>
        ) : null}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <main className="hl-panel__body" style={{ transform: `translateY(${-scrollY}px)` }}>
          {sub ? (
            <nav className="hl-subnav">
              <div className="hl-seg hl-seg--block" role="radiogroup">
                {sub.items.map(it => (
                  <button key={it} type="button" className="hl-seg__item" role="radio" aria-checked={it === sub.value ? 'true' : 'false'}
                    style={{ whiteSpace: 'nowrap', padding: '0 4px', fontSize: 13.5 }}>{it}</button>
                ))}
              </div>
            </nav>
          ) : null}
          <div className="hl-screen">{children}</div>
        </main>
      </div>
    </div>
  </div>
);

/** Kicker + one-sentence title, exactly like kit.js screenHeader(). */
export const ScreenHeader: React.FC<{ kicker: string; title: string; meta?: string }> = ({ kicker, title, meta }) => (
  <header className="hl-head">
    <p className="hl-kicker">{kicker}</p>
    <h1 className="hl-title">{title}</h1>
    {meta ? <p className="hl-head__meta">{meta}</p> : null}
  </header>
);

type ChipState = 'match' | 'nomatch' | 'unknown' | 'confirmed' | 'retracted' | 'danger' | 'offline';
const CHIP_ICON: Record<ChipState, Parameters<typeof Icon>[0]['name']> = {
  match: 'check', nomatch: 'nomatch', unknown: 'unknown', confirmed: 'confirmed', retracted: 'retracted', danger: 'danger', offline: 'offline',
};
/** Status chip with the product's classes (always icon + word). */
export const Chip: React.FC<{ state: ChipState; children: React.ReactNode; style?: React.CSSProperties }> = ({ state, children, style }) => (
  <span className={`hl-chip hl-chip--${state}`} style={style}>
    <Icon name={CHIP_ICON[state]} size={16} />
    <span className="hl-chip__text">{children}</span>
  </span>
);
