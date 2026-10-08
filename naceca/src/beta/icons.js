/* =========================================================================
   NACECA · beta/icons.js — line icons for the paper UI (replaces emoji)
   24×24, stroke only, drawn in currentColor. Loaded early in the bundle so
   every module can call icon('name') when it renders markup.
     icon('close')            → '<svg class="ico" …>…</svg>'
     icon('check', 'ok')      → extra class on the <svg>
   ========================================================================= */
const ICONS = {
  close:    '<path d="M6 6l12 12M18 6L6 18"/>',
  back:     '<path d="M15 5l-7 7 7 7"/>',
  next:     '<path d="M9 5l7 7-7 7"/>',
  down:     '<path d="M5 9l7 7 7-7"/>',
  up:       '<path d="M5 15l7-7 7 7"/>',
  pointer:  '<path d="M5 5l14 7-14 7 3.5-7z"/>',
  play:     '<path d="M7 4.5v15l12-7.5z"/>',
  check:    '<path d="M5 12.5l4.5 4.5L19 7"/>',
  cross:    '<path d="M6 6l12 12M18 6L6 18"/>',
  warning:  '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
  shield:   '<path d="M12 3l7 3v5.5c0 4.4-3 7.9-7 9.5-4-1.6-7-5.1-7-9.5V6z"/>',
  people:   '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.6 13.7c2.2.3 3.9 2 4.4 4.3"/>',
  star:     '<path d="M12 3.5l2.6 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.8l-5.4 2.9 1.2-5.9-4.4-4.1 6-.7z"/>',
  flag:     '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
  medal:    '<circle cx="12" cy="15" r="5"/><path d="M9 3l3 7 3-7"/>',
  id:       '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.6 1.7-2.4 3-2.4s2.5.8 3 2.4M14 10h4M14 13.5h4"/>',
  envelope: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
  scales:   '<path d="M12 4v16M7.5 20h9M5 7h14M5 7l-2.5 6h5zM19 7l-2.5 6h5z"/>',
  bank:     '<path d="M3 9.5L12 4l9 5.5M4 9.5h16M6 10v7M10 10v7M14 10v7M18 10v7M3 20h18"/>',
  phone:    '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  coins:    '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6"/>',
  lock:     '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/>',
  unlock:   '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 017.6-1.7"/>',
  folder:   '<path d="M3 6.5h6l2 2.5h10v10.5H3z"/>',
  doc:      '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 15.5h6"/>',
  scan:     '<circle cx="12" cy="12" r="6.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  search:   '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  cuff:     '<circle cx="7.5" cy="15" r="4"/><circle cx="16.5" cy="15" r="4"/><path d="M9.5 11.5l1.5-4h2l1.5 4"/>',
  pin:      '<path d="M12 21s-6-5.5-6-11a6 6 0 0112 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  route:    '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 000-6h-4a3 3 0 010-6h6"/>',
  eye:      '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  target:   '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
  stamp:    '<path d="M9 4h6l-1.2 6.5h-3.6zM5 13h14v3H5zM4 20h16"/>',
  link:     '<path d="M10 14l4-4M8.5 10.5l-2 2a3 3 0 004.2 4.2l2-2M15.5 13.5l2-2a3 3 0 00-4.2-4.2l-2 2"/>',
  clock:    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  menu:     '<path d="M4 7h16M4 12h16M4 17h16"/>',
  bag:      '<path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 016 0v2"/>',
  car:      '<path d="M3.5 16v-4l2-5h13l2 5v4zM3.5 12h17"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  alert:    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16v.5"/>',
  share:    '<circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 11l8-4M8 13l8 4"/>',
  dot:      '<circle cx="12" cy="12" r="3.5"/>',
  // visual stream: side-quest diamond, and the evidence-sort mini-game items (were emoji)
  diamond:  '<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/>',
  cash:     '<rect x="2.5" y="6.5" width="19" height="11" rx="1.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  card:     '<rect x="2.5" y="5.5" width="19" height="13" rx="1.5"/><path d="M2.5 9.5h19M6 15h4"/>',
  sim:      '<path d="M7 3h7.5L19 7.5V21H7z"/><rect x="9.5" y="11" width="7" height="7" rx="1"/><path d="M13 11v7M9.5 14.5h7"/>',
  box:      '<path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9"/>',
  glove:    '<path d="M7.5 21v-5l-2.6-3.4a1.5 1.5 0 012.3-1.9L9 12.5V5.5a1.5 1.5 0 013 0V11V4.5a1.5 1.5 0 013 0V11V6a1.5 1.5 0 013 0v9c0 2.5-1.2 4.5-2.5 6"/>',
  chip:     '<rect x="7" y="9" width="10" height="12" rx="1.5"/><path d="M9 9V4h6v5M10.5 6.5h0M13.5 6.5h0"/>',
  photo:    '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.8"/><path d="M3.5 17l5-4.5 3.5 3 3-2.5 5.5 4.5"/>',
  beads:    '<circle cx="12" cy="9" r="5.5"/><path d="M12 14.5v7M10 18h4"/>',
  can:      '<path d="M7 5.5h10v13a2 2 0 01-2 2H9a2 2 0 01-2-2z"/><path d="M8 3.5h8M7 8.5h10"/>',
  roll:     '<ellipse cx="9" cy="12" rx="4" ry="6.5"/><path d="M9 5.5h8c2.2 0 4 2.9 4 6.5s-1.8 6.5-4 6.5H9"/><ellipse cx="9" cy="12" rx="1.2" ry="2"/>',
  biscuit:  '<circle cx="12" cy="12" r="8"/><path d="M9 9h.01M14.5 8.5h.01M15 13.5h.01M10 14.5h.01M12 11.5h.01"/>',
  notebook: '<path d="M6 3h12v18H6z"/><path d="M9 3v18M4.5 7h3M4.5 12h3M4.5 17h3"/>',
  receipt:  '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 11.5h6M9 15h4"/>',
};
function icon(name, cls){
  const d = ICONS[name];
  if(!d) return '';
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}
