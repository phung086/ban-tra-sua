import type { CSSProperties } from "react";
import type { Phase } from "../game/types";

interface Props {
  phase: Phase;
  season: string;
}

const petals = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  style: {
    "--petal-x": `${(index * 17 + 9) % 96}%`,
    "--petal-delay": `${-(index * 0.73)}s`,
    "--petal-duration": `${8 + (index % 5) * 1.7}s`,
    "--petal-scale": String(0.65 + (index % 4) * 0.16),
  } as CSSProperties,
}));

export function CafeAtmosphere({ phase, season }: Props) {
  return (
    <div className={`cafe-atmosphere atmosphere-${phase} atmosphere-${season}`} aria-hidden="true">
      <div className="atmosphere-vignette" />
      <div className="atmosphere-bokeh">
        {Array.from({ length: 7 }).map((_, index) => <i key={index} />)}
      </div>
      <div className="atmosphere-petals">
        {petals.map((petal) => <i key={petal.id} style={petal.style} />)}
      </div>
      <div className="atmosphere-steam">
        <i /><i /><i />
      </div>
    </div>
  );
}

export function CafeSceneChrome() {
  return (
    <div className="scene-chrome" aria-hidden="true">
      <div className="scene-back-shelf">
        <span>🫙</span>
        <span>🍓</span>
        <span>🍵</span>
        <span>🥛</span>
        <span>🧋</span>
      </div>
      <div className="scene-menu-board">
        <small>TODAY</small>
        <b>tea · milk · love</b>
        <i>♡</i>
      </div>
      <div className="scene-pendant scene-pendant-a">✦</div>
      <div className="scene-pendant scene-pendant-b">✦</div>
      <div className="scene-counter-props">
        <span className="scene-prop-cup">🥤</span>
        <span className="scene-prop-jar">🫙</span>
        <span className="scene-prop-flower">🌷</span>
      </div>
    </div>
  );
}
