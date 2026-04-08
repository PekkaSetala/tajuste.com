'use client'

interface Props {
  mode: 'bw' | 'color'
  onToggle: () => void
  disabled?: boolean
}

export default function ModeToggle({ mode, onToggle, disabled }: Props) {
  const label = mode === 'bw'
    ? 'Switch to color photos'
    : 'Switch to black and white photos'

  return (
    <button
      className="mode-toggle"
      data-mode={mode}
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 1a9 9 0 0 1 0 18 9 9 0 0 1 0-18z" />
        <path d="M12 3a9 9 0 0 1 0 18c0-4.97 0-13.03 0-18z" />
        <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="16.5" r="1.5" style={{ color: 'var(--bg)' }} fill="currentColor" />
        <path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9 9 9 0 0 1 0-18z" />
      </svg>
    </button>
  )
}
