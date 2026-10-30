// Main navigation: shared by TabBar (phone) and Sidebar (desktop). Icon paths from the mock-ups.
export const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { to: '/library', label: 'Library', icon: 'M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-1.5zM8 7h7M8 11h5' },
  { to: '/log', label: 'Log', icon: 'M3 20h18M6 20V11M11 20V5M16 20v-6M21 20V9' },
  { to: '/settings', label: 'Settings', icon: 'M4 7h9M17 7h3M15 4v6M4 17h3M11 17h9M9 14v6' },
] as const
