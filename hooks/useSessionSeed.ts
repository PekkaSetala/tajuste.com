'use client'
import { useEffect, useState } from 'react'

const SEED_KEY = 'tajuste_seed'

export function useSessionSeed(): number | null {
  const [seed, setSeed] = useState<number | null>(null)

  useEffect(() => {
    // Check URL hash for shareable seed
    const hashSeed = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.hash.slice(1)).get('seed')
      : null

    if (hashSeed) {
      const n = parseInt(hashSeed, 16)
      if (!isNaN(n)) {
        setSeed(n)
        return
      }
    }

    const stored = sessionStorage.getItem(SEED_KEY)
    if (stored) {
      setSeed(parseInt(stored, 10))
    } else {
      const fresh = crypto.getRandomValues(new Uint32Array(1))[0]
      sessionStorage.setItem(SEED_KEY, String(fresh))
      setSeed(fresh)
    }
  }, [])

  return seed
}
