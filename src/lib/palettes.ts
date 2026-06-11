// Gradient palettes for image-less archival cards / detail placeholders (v4).
export const palettes: [string, string][] = [
  ['#8b6b3a', '#5a3c1a'],
  ['#a08060', '#6b4a30'],
  ['#c4a070', '#8b6840'],
  ['#6b5038', '#3a2010'],
  ['#b8906a', '#785040'],
  ['#d0a878', '#9a7050'],
  ['#7a5a3a', '#4a2e18'],
  ['#c09060', '#856040'],
  ['#a87858', '#6b4530'],
  ['#5a4028', '#301808'],
];

export const paletteFor = (i: number): [string, string] =>
  palettes[((i % palettes.length) + palettes.length) % palettes.length];
