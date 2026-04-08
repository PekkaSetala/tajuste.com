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
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {/* Dark (right) half: S-curve via two r=5 semicircles + right outer r=10 arc */}
        <path d="M12 2a5 5 0 0 1 0 10 5 5 0 0 0 0 10 10 10 0 0 1 0-20z" fill="currentColor" />
        {/* Light dot in dark half */}
        <circle cx="12" cy="7" r="1.5" fill="var(--bg)" />
        {/* Dark dot in light half */}
        <circle cx="12" cy="17" r="1.5" fill="currentColor" />
      </svg>
    </button>
  )
}
