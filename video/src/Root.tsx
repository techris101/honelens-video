import React from 'react';
import { Audio, Composition, Series, staticFile } from 'remotion';
import timeline from './timeline.json';
import { SCENES } from './scenes/registry';
import { loadBrandFonts } from './brand/fonts';

loadBrandFonts();

type Kind = 'short' | 'long';
type Props = { audio: 'full' | 'sfx' | 'none' };

const total = (k: Kind) => timeline[k].scenes.reduce((n, s) => n + s.frames, 0);

const Film: React.FC<Props & { kind: Kind }> = ({ kind, audio }) => (
  <>
    <Series>
      {timeline[kind].scenes.map(s => {
        const Scene = SCENES[s.id];
        return (
          <Series.Sequence key={s.id} durationInFrames={s.frames} name={s.id}>
            <Scene />
          </Series.Sequence>
        );
      })}
    </Series>
    {audio !== 'none' ? <Audio src={staticFile(`audio/${kind}-${audio}.wav`)} /> : null}
  </>
);

const ShortFilm: React.FC<Props> = p => <Film kind="short" {...p} />;
const LongFilm: React.FC<Props> = p => <Film kind="long" {...p} />;

export const Root: React.FC = () => (
  <>
    <Composition id="Short" component={ShortFilm} durationInFrames={total('short')} fps={timeline.fps}
      width={timeline.short.width} height={timeline.short.height} defaultProps={{ audio: 'none' } as Props} />
    <Composition id="Long" component={LongFilm} durationInFrames={total('long')} fps={timeline.fps}
      width={timeline.long.width} height={timeline.long.height} defaultProps={{ audio: 'none' } as Props} />
    {/* One composition per scene, for previews and contact sheets (frame 0 = scene start). */}
    {(['short', 'long'] as Kind[]).flatMap(kind => timeline[kind].scenes.map(s => (
      <Composition key={s.id} id={s.id} component={SCENES[s.id]} durationInFrames={s.frames} fps={timeline.fps}
        width={timeline[kind].width} height={timeline[kind].height} />
    )))}
  </>
);
