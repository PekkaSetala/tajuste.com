'use client'
import { useEffect, useState } from 'react'

const COUNTER_KEY = 'tajuste_seen_count'

function readCount(): number {
  try {
    return parseInt(localStorage.getItem(COUNTER_KEY) ?? '0', 10) || 0
  } catch {
    return 0
  }
}

function writeCount(n: number) {
  try {
    localStorage.setItem(COUNTER_KEY, String(n))
  } catch {
    // private browsing — silent fail
  }
}

export function useSeenCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(readCount())
  }, [])

  const increment = () => {
    setCount(prev => {
      const next = prev + 1
      writeCount(next)
      return next
    })
  }

  return { count, increment }
}
