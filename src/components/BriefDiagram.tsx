type DiagramKind = 'upi' | 'fx' | 'sgd' | 'wiki';

const graphNodes = [
  [140, 87], [176, 53], [198, 115], [244, 69], [265, 115], [306, 82], [339, 40],
  [346, 123], [382, 72], [420, 110], [454, 62], [477, 104], [121, 120], [270, 42],
];
const graphEdges = [
  [0, 1], [0, 2], [0, 12], [1, 3], [1, 13], [2, 3], [2, 4], [2, 12], [3, 4], [3, 5],
  [3, 13], [4, 5], [4, 7], [5, 6], [5, 7], [5, 8], [5, 13], [6, 8], [6, 10], [7, 8],
  [7, 9], [8, 9], [8, 10], [9, 11], [10, 11],
];

function TransactionGraph() {
  return (
    <>
      <g stroke="currentColor" opacity=".25">
        {graphEdges.map(([from, to]) => <line key={`${from}-${to}`} x1={graphNodes[from][0]} y1={graphNodes[from][1]} x2={graphNodes[to][0]} y2={graphNodes[to][1]} />)}
      </g>
      <path d="M244 69L306 82 265 115Z" fillOpacity=".09" fill="currentColor" stroke="currentColor" strokeWidth="1.15" />
      <circle cx="275" cy="87" r="52" fill="none" stroke="currentColor" opacity=".32" strokeDasharray="2 6" />
      <circle cx="275" cy="87" r="65" fill="none" stroke="currentColor" opacity=".15" strokeDasharray="2 7" />
      {graphNodes.map(([x, y], i) => (
        <g key={x}>
          <circle cx={x} cy={y} r={[3, 4, 5].includes(i) ? 9 : 5.5} fill="#0b1717" stroke="currentColor" strokeOpacity={i === 5 ? .9 : .38} />
          <circle cx={x} cy={y} r={i === 5 ? 3.8 : 2.2} fill="currentColor" fillOpacity={i === 5 ? 1 : .7} />
        </g>
      ))}
    </>
  );
}

function RouteGraph() {
  return (
    <>
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M133 91C183 90 202 47 250 47S335 130 397 130 448 92 487 91M133 91c64 0 72 42 120 42s90-82 142-82 58 40 92 40" strokeOpacity=".3" />
        <path d="M133 91H487" strokeOpacity=".4" strokeDasharray="3 6" />
        <path d="M133 91C183 90 202 47 250 47s30 44 66 44h171" strokeWidth="1.45" />
        <path d="m221 56 11-7m117 42-6-4m6 4-6 4m69-4-6-4m6 4-6 4" strokeWidth="1.2" />
      </g>
      {[[133, 91], [250, 47], [253, 133], [316, 91], [395, 51], [397, 130], [487, 91]].map(([x, y], i) => (
        <g key={x}>
          <rect x={x - 7} y={y - 7} width="14" height="14" rx="2" fill="#101c22" stroke="currentColor" strokeOpacity={[0, 3, 6].includes(i) ? .9 : .45} />
          <circle cx={x} cy={y} r="2" fill="currentColor" opacity=".78" />
        </g>
      ))}
      <g fill="currentColor" opacity=".72" fontSize="8" textAnchor="middle" className="brief-diagram-mono">
        <text x="133" y="116">USD</text>
        <text x="316" y="116">EUR</text>
        <text x="487" y="116">INR</text>
      </g>
    </>
  );
}

function LearningGraph() {
  return (
    <>
      <path d="M130 123C166 127 194 108 228 107s44 5 69-13 24-32 66-31 58-17 104-27L467 138H130Z" fill="currentColor" opacity=".075" />
      <g fill="none" stroke="currentColor">
        <path d="M130 32v106h337M130 108h337m-337-27h337m-337-27h337" strokeOpacity=".2" />
        <path d="M130 116 151 122 172 104 191 115 214 101 235 110 257 108 275 116 297 89 320 77 341 82 362 60 383 70 403 54 425 57 444 38 467 42" strokeOpacity=".28" strokeDasharray="3 5" />
        <path d="M130 123C166 127 194 108 228 107s44 5 69-13 24-32 66-31 58-17 104-27" strokeWidth="1.65" />
        <path d="M296 31v107" strokeOpacity=".5" strokeDasharray="3 5" />
      </g>
      {[[130, 123], [228, 107], [297, 94], [363, 63], [467, 36]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.8" fill="#191815" stroke="currentColor" />)}
      <text x="303" y="39" fill="currentColor" opacity=".75" fontSize="8" className="brief-diagram-mono">INPUT SHIFT</text>
    </>
  );
}

function StreamGraph() {
  const samples = [16, 21, 15, 35, 22, 47, 26, 37, 69, 51, 31, 19, 26, 51, 39, 80, 64, 41, 31, 22, 34, 44, 28, 24, 37];
  return (
    <>
      <path d="M125 127h378M125 103h378M125 79h378M125 55h378" stroke="currentColor" strokeOpacity=".16" />
      {samples.map((sample, i) => (
        <rect key={i} x={130 + i * 15} y={126 - sample} width="7" height={sample} rx="1" fill="currentColor" opacity={sample > 50 ? .62 : .22 + i / 125} />
      ))}
      <path d="M130 105h20l10-13 11 13h18l13-18 10 18h20l20-32 13 22h23l15 10 22-17h17l12-26 13 15h10l17 23h20l10-8 9 8h20l9 5h12l10-15h13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="497" cy="90" r="8" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <circle cx="497" cy="90" r="3.5" fill="currentColor" />
    </>
  );
}

export default function BriefDiagram({ kind }: { kind: DiagramKind }) {
  const Graphic = { upi: TransactionGraph, fx: RouteGraph, sgd: LearningGraph, wiki: StreamGraph }[kind];
  return (
    <svg viewBox="0 0 620 170" aria-hidden="true" focusable="false">
      <g stroke="currentColor" opacity=".32" fill="none">
        <path d="M59 52V28h24m454 0h24v24M59 118v24h24m454 0h24v-24" />
        <path d="M58 84h21m-10-10v20m473-10h21m-11-10v20" />
      </g>
      <Graphic />
    </svg>
  );
}
