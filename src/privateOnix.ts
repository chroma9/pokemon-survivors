/** Temporary private test gate for the Onix → Steelix playable family. */
export const onixTesterAllowed = (id: string): boolean => {
  if (id !== 'onix') return true
  if (typeof localStorage === 'undefined') return false
  try {
    const profile = JSON.parse(localStorage.getItem('ps:trainerProfile') ?? 'null') as { handle?: unknown } | null
    return profile?.handle?.toString().toLowerCase() === 'chroma9'
      && Boolean(localStorage.getItem('ps:trainerSession'))
  } catch { return false }
}
