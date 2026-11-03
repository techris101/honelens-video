import React from 'react';
import { C, FONT, SHADOW_WINDOW } from '../brand/colors';
import { ARTICLE } from '../data/demo';
import { Icon, LensGlyph } from './Icon';

/**
 * A quiet, generic browser window (no real browser branding): neutral dots, one tab, an address
 * bar. `panel` docks the HoneLENS side panel on the right like Chrome's side panel; `panelWidth`
 * (px, in this window's coordinate space) can be animated from 0 to slide it open.
 */
export const BrowserFrame: React.FC<{
  width: number;
  height: number;
  url: string;
  tabTitle?: string;
  children: React.ReactNode;
  panel?: React.ReactNode;
  panelWidth?: number;
  scale?: number;          // UI scale of the chrome itself (1 = 1x desktop)
  style?: React.CSSProperties;
}> = ({ width, height, url, tabTitle = 'Article', children, panel, panelWidth = 0, scale = 1.6, style }) => {
  const bar = 44 * scale, addr = 46 * scale;
  return (
    <div style={{ width, height, borderRadius: 14 * scale * 0.7, overflow: 'hidden', background: C.white, boxShadow: SHADOW_WINDOW, border: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ height: bar, background: '#EEEEE9', display: 'flex', alignItems: 'flex-end', padding: `0 ${12 * scale}px`, gap: 10 * scale, flex: 'none' }}>
        <div style={{ display: 'flex', gap: 7 * scale, alignSelf: 'center', marginRight: 6 * scale }}>
          {[0, 1, 2].map(i => <span key={i} style={{ width: 11 * scale, height: 11 * scale, borderRadius: '50%', background: '#D3D1C7' }} />)}
        </div>
        <div style={{ height: bar * 0.78, minWidth: 220 * scale, maxWidth: 300 * scale, background: C.white, borderRadius: `${8 * scale}px ${8 * scale}px 0 0`, display: 'flex', alignItems: 'center', gap: 8 * scale, padding: `0 ${12 * scale}px`, fontFamily: FONT.sans, fontWeight: 600, fontSize: 12.5 * scale, color: C.navy }}>
          <span style={{ width: 14 * scale, height: 14 * scale, borderRadius: 3 * scale, background: C.navy, flex: 'none' }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tabTitle}</span>
        </div>
      </div>
      <div style={{ height: addr, display: 'flex', alignItems: 'center', gap: 10 * scale, padding: `0 ${14 * scale}px`, borderBottom: `1px solid ${C.hair}`, background: C.white, flex: 'none' }}>
        <div style={{ flex: 1, height: addr * 0.66, borderRadius: 999, background: '#F1F1EC', display: 'flex', alignItems: 'center', gap: 8 * scale, padding: `0 ${14 * scale}px`, fontFamily: FONT.sans, fontWeight: 600, fontSize: 13 * scale, color: C.slate, overflow: 'hidden' }}>
          <Icon name="lock" size={14 * scale} color={C.slate} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
        </div>
        <span style={{ width: 26 * scale, height: 26 * scale, borderRadius: 6 * scale, background: C.navy, display: 'grid', placeItems: 'center', flex: 'none' }}>
          <HMark size={14 * scale} light />
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>{children}</div>
        {panel ? (
          <div style={{ width: panelWidth, flex: 'none', overflow: 'hidden', borderLeft: panelWidth > 0 ? `1px solid ${C.hair}` : 'none', position: 'relative', background: C.paper }}>
            {panel}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** The standalone HoneNurse mark (geometry from design/project/assets/Logos/honenurse-mark.svg). */
export const HMark: React.FC<{ size?: number; light?: boolean; style?: React.CSSProperties }> = ({ size = 24, light = false, style }) => (
  <svg viewBox="0 0 74 100" width={size * 0.74} height={size} style={style} aria-hidden="true">
    <rect x="9" y="44.5" width="56" height="11" fill={light ? C.tealLight : C.teal} />
    <polygon points="0,100 0,18 18,0 18,100" fill={light ? C.paper : C.navy} />
    <polygon points="56,0 74,0 74,82 56,100" fill={light ? C.paper : C.navy} />
  </svg>
);

/**
 * The fictional journal article page. `hl` (0..1) paints the product's in-page highlight on the
 * quoted sentence (teal tint + 2px teal underline, as in src/modules/article/page.js). `hlKey`
 * picks which passage: 'assessors' | 'funding' | 'adherence'. `scrollY` scrolls the page (px).
 */
export const ArticlePage: React.FC<{ scale?: number; scrollY?: number; hl?: number; hlKey?: 'assessors' | 'funding' | 'adherence' }> = ({ scale = 1.6, scrollY = 0, hl = 0, hlKey = 'assessors' }) => {
  const s = scale;
  const para: React.CSSProperties = { fontFamily: FONT.serif, fontSize: 15.5 * s, lineHeight: 1.62, color: '#22313F', margin: `0 0 ${12 * s}px` };
  const h2: React.CSSProperties = { fontFamily: FONT.sans, fontWeight: 600, fontSize: 15 * s, color: C.navy, margin: `${22 * s}px 0 ${8 * s}px` };
  const mark = (text: string, key: string) => {
    const targets: Record<string, string> = {
      assessors: 'Outcome assessors were aware of group allocation',
      funding: 'This trial was funded by CardioHome Inc., which makes home monitoring devices.',
      adherence: 'adherence to the teaching plan was self-reported at the 30-day call',
    };
    const t = targets[key];
    const i = text.indexOf(t);
    if (i < 0 || key !== hlKey || hl <= 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <span style={{ backgroundColor: `rgba(227,240,241,${hl})`, textDecoration: hl > 0.05 ? `underline ${2 * s}px rgba(31,111,120,${hl})` : 'none', textUnderlineOffset: 3 * s, color: C.navy, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>{t}</span>
        {text.slice(i + t.length)}
      </>
    );
  };
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.white, overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${-scrollY}px)` }}>
        <div style={{ borderBottom: `1px solid ${C.hair}`, padding: `${14 * s}px ${36 * s}px`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 17 * s, color: C.navy }}>{ARTICLE.journal}</span>
          <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 12 * s, color: C.slate }}>Illustrative example</span>
        </div>
        <article style={{ padding: `${26 * s}px ${36 * s}px`, maxWidth: 760 * s }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 12.5 * s, color: C.slate, marginBottom: 10 * s }}>{ARTICLE.kind} · {ARTICLE.published}</div>
          <h1 style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 27 * s, lineHeight: 1.25, color: C.navy, margin: `0 0 ${12 * s}px` }}>{ARTICLE.title}</h1>
          <div style={{ fontFamily: FONT.serif, fontSize: 15 * s, color: '#22313F', marginBottom: 6 * s }}>{ARTICLE.authors}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 12.5 * s, color: C.slate, marginBottom: 18 * s }}>{ARTICLE.journalShort}. {ARTICLE.year};{ARTICLE.volume} · doi:{ARTICLE.doi}</div>
          <div style={{ borderTop: `1px solid ${C.hair}`, paddingTop: 6 * s }}>
            <div style={h2}>Abstract</div>
            {ARTICLE.abstract.map(([k, v]) => (
              <p key={k} style={para}><strong style={{ fontFamily: FONT.sans, fontWeight: 600, color: C.navy }}>{k}. </strong>{v}</p>
            ))}
          </div>
          {ARTICLE.body.map(([k, v]) => (
            <div key={k}>
              <div style={h2}>{k}</div>
              <p style={para}>{mark(v, k === 'Funding' ? 'funding' : (hlKey === 'adherence' ? 'adherence' : 'assessors'))}</p>
            </div>
          ))}
        </article>
      </div>
    </div>
  );
};

/** The floating teal "Analyze with HoneLENS" button, as drawn by src/content/fab.js (x 1 scale). */
export const Fab: React.FC<{ scale?: number; pressed?: number; style?: React.CSSProperties }> = ({ scale = 1.6, pressed = 0, style }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 * scale, ...style }}>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8 * scale, minHeight: 40 * scale, padding: `0 ${16 * scale}px 0 ${12 * scale}px`,
      borderRadius: 6 * scale, background: pressed > 0 ? '#1B626A' : C.teal, color: '#fff', fontFamily: FONT.sans, fontWeight: 600, fontSize: 14 * scale,
      boxShadow: '0 1px 2px rgba(24,50,74,.12), 0 4px 12px rgba(24,50,74,.18)', transform: `scale(${1 - pressed * 0.02})`, whiteSpace: 'nowrap',
    }}>
      <LensGlyph size={18 * scale} color="#fff" />
      Analyze with HoneLENS
    </div>
    <div style={{ width: 28 * scale, height: 28 * scale, borderRadius: 6 * scale, border: `1px solid ${C.field}`, background: '#fff', color: C.navy, display: 'grid', placeItems: 'center' }}>
      <Icon name="close" size={14 * scale} strokeWidth={2} />
    </div>
  </div>
);
