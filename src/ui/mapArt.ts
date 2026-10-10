/** Stylised Lagos on a 340×236 grid: mainland, lagoon with Banana Island, the island, the Atlantic. */
export const MAP_BASE = `<rect width="340" height="236" fill="var(--land)"/>
  <path d="M0 0H340V58C280 68 220 56 160 62C110 66 70 58 0 68Z" fill="var(--land-2)"/>
  <path d="M60 96C100 86 150 92 200 82C250 72 300 80 340 74V112C300 110 262 108 236 112C200 116 170 110 150 116C120 120 92 114 60 112C40 110 20 106 0 108V98C20 98 40 100 60 96Z" fill="var(--sea)"/>
  <ellipse cx="232" cy="94" rx="17" ry="8" fill="var(--land)"/>
  <path d="M0 214C70 204 150 222 220 212C270 205 310 210 340 206V236H0Z" fill="var(--sea)"/>
  <path d="M20 40H330M86 0V96M150 0V64M40 150H330M140 120V206M210 118V200M250 150V206" stroke="var(--road)" stroke-width="3" fill="none" opacity=".8"/>
  <path d="M108 64L116 120" stroke="var(--road)" stroke-width="4"/>`;
