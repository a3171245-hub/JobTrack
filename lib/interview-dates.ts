// Returns a valid ISO string if parseable, otherwise null.
// Guards against AI returning "null" string, Japanese dates, or malformed values.
export function toISODateOrNull(val: string | null | undefined): string | null {
  if (!val || val === 'null' || val === 'undefined') return null
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString()
  } catch {
    return null
  }
}

export function sanitizeCandidates(candidates: string[] | null | undefined): string[] {
  return (candidates ?? []).map(toISODateOrNull).filter((d): d is string => d !== null)
}
