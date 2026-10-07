import type { ReactNode } from "react";

export type RoomKind = "prep" | "stock" | "upgrades" | "reviews" | "goals";

interface Props {
  kind: RoomKind;
  children?: ReactNode;
}

const palettes: Record<RoomKind, { wall: string; wall2: string; floor: string; trim: string; accent: string }> = {
  prep: { wall: "#ffe7ef", wall2: "#fff4f3", floor: "#efd0cc", trim: "#d7a3ac", accent: "#cf648c" },
  stock: { wall: "#fce8ed", wall2: "#fff6ee", floor: "#e8c7c0", trim: "#ce9ba7", accent: "#699980" },
  upgrades: { wall: "#f4e5ef", wall2: "#fff1f3", floor: "#e7c9ce", trim: "#ce9caa", accent: "#b77b98" },
  reviews: { wall: "#f3e3f1", wall2: "#fff0f5", floor: "#e6c5d1", trim: "#c69aaa", accent: "#cc648d" },
  goals: { wall: "#ffe8ec", wall2: "#fff5ee", floor: "#ebc9c7", trim: "#d5a2ad", accent: "#c47b92" },
};

export function RoomBackdrop({ kind, children }: Props) {
  const palette = palettes[kind];

  return (
    <div className={`room-backdrop room-backdrop-${kind}`}>
      <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={`wall-${kind}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.wall} />
            <stop offset="100%" stopColor={palette.wall2} />
          </linearGradient>
          <linearGradient id={`floor-${kind}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.floor} />
            <stop offset="100%" stopColor={palette.trim} />
          </linearGradient>
          <filter id={`soft-${kind}`}>
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#5a3b46" floodOpacity=".16" />
          </filter>
        </defs>

        <rect width="1200" height="720" fill={`url(#wall-${kind})`} />
        <circle cx="1020" cy="90" r="170" fill="#fff7d9" opacity=".24" />
        <circle cx="150" cy="120" r="120" fill="#ffffff" opacity=".16" />

        <rect y="515" width="1200" height="205" fill={`url(#floor-${kind})`} />
        <g opacity=".13">
          {Array.from({ length: 14 }).map((_, index) => (
            <line key={index} x1={index * 95} y1="515" x2={index * 82 - 60} y2="720" stroke="#4b3039" strokeWidth="2" />
          ))}
        </g>

        <rect x="0" y="492" width="1200" height="28" fill={palette.trim} opacity=".8" />
        <rect x="0" y="488" width="1200" height="7" fill="#fff7e8" opacity=".65" />

        <g filter={`url(#soft-${kind})`}>
          <rect x="68" y="74" width="224" height="196" rx="18" fill="#f8fcfb" stroke="#ffffff" strokeWidth="10" />
          <rect x="88" y="94" width="184" height="156" rx="8" fill="#f3dce9" />
          <line x1="180" y1="94" x2="180" y2="250" stroke="#fff" strokeWidth="7" opacity=".55" />
          <line x1="88" y1="172" x2="272" y2="172" stroke="#fff" strokeWidth="7" opacity=".55" />
          <circle cx="245" cy="116" r="27" fill="#fff5b4" opacity=".8" />
        </g>

        {kind === "stock" && (
          <g filter={`url(#soft-${kind})`}>
            <rect x="350" y="88" width="690" height="350" rx="24" fill="#c895a8" />
            {[0, 1, 2].map((row) => (
              <g key={row}>
                <rect x="375" y={118 + row * 104} width="640" height="83" rx="15" fill="#fff3f7" />
                <rect x="375" y={190 + row * 104} width="640" height="11" fill="#a56e85" opacity=".55" />
              </g>
            ))}
            <rect x="1056" y="116" width="82" height="322" rx="18" fill="#b9d9d6" />
            <rect x="1075" y="145" width="44" height="225" rx="8" fill="#dff2ef" />
            <circle cx="1097" cy="394" r="9" fill="#7e9c99" />
          </g>
        )}

        {kind === "upgrades" && (
          <g filter={`url(#soft-${kind})`}>
            <rect x="350" y="100" width="340" height="315" rx="22" fill="#c08ba2" />
            <rect x="372" y="122" width="296" height="255" rx="14" fill="#f4dae6" />
            <rect x="740" y="98" width="305" height="280" rx="24" fill="#b59faf" />
            <rect x="768" y="128" width="248" height="118" rx="16" fill="#e6eeec" />
            <rect x="768" y="268" width="108" height="84" rx="14" fill="#e7c0cf" />
            <rect x="890" y="268" width="126" height="84" rx="14" fill="#efd0da" />
            <rect x="412" y="405" width="565" height="80" rx="18" fill="#c796ad" />
            <circle cx="420" cy="180" r="24" fill={palette.accent} opacity=".8" />
            <circle cx="498" cy="180" r="18" fill="#6f8fa2" />
            <circle cx="562" cy="180" r="28" fill="#ddb77b" />
          </g>
        )}

        {kind === "reviews" && (
          <g filter={`url(#soft-${kind})`}>
            <ellipse cx="662" cy="475" rx="340" ry="85" fill="#765149" opacity=".26" />
            <rect x="300" y="355" width="730" height="145" rx="26" fill="#dbafbf" />
            <rect x="340" y="388" width="270" height="78" rx="14" fill="#fbe6ee" />
            <circle cx="900" cy="408" r="34" fill="#efc9d8" />
            <rect x="772" y="138" width="228" height="338" rx="38" fill="#3d3540" />
            <rect x="790" y="158" width="192" height="296" rx="28" fill="#fff7fb" />
            <rect x="858" y="168" width="56" height="7" rx="4" fill="#75586b" opacity=".4" />
          </g>
        )}

        {kind === "goals" && (
          <g filter={`url(#soft-${kind})`}>
            <rect x="320" y="82" width="725" height="394" rx="24" fill="#c58caa" />
            <rect x="344" y="106" width="677" height="346" rx="14" fill="#f0cadb" />
            <path d="M360 140 C520 95 720 160 995 120" stroke="#fff3f7" strokeWidth="8" opacity=".36" fill="none" />
            <rect x="85" y="360" width="190" height="128" rx="18" fill="#f1e4c9" />
            <rect x="100" y="379" width="160" height="16" rx="8" fill={palette.accent} opacity=".45" />
            <circle cx="181" cy="442" r="34" fill="#fff7db" />
          </g>
        )}

        {kind === "prep" && (
          <g filter={`url(#soft-${kind})`}>
            <rect x="330" y="92" width="700" height="395" rx="28" fill="#fff6ef" />
            <rect x="360" y="128" width="294" height="268" rx="18" fill="#f2dbe8" />
            <rect x="687" y="128" width="312" height="268" rx="18" fill="#f8e4eb" />
            <rect x="730" y="177" width="216" height="174" rx="14" fill="#d7a9bb" />
            <rect x="765" y="205" width="146" height="146" rx="11" fill="#ad7e95" />
            <rect x="515" y="60" width="338" height="78" rx="18" fill="#fff2da" stroke="#f1a9c0" strokeWidth="8" />
            <text x="684" y="109" textAnchor="middle" fontSize="30" fontWeight="700" fill="#ad567a">TIỆM TRÀ CHIBI</text>
          </g>
        )}

        <g opacity=".52">
          <circle cx="1110" cy="78" r="7" fill={palette.accent} />
          <circle cx="1140" cy="105" r="4" fill={palette.accent} />
          <circle cx="1090" cy="128" r="5" fill={palette.accent} />
        </g>
      </svg>
      {children}
    </div>
  );
}
