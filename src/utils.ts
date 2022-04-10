export function getRandomString() {
  return Date.now() + Math.random().toFixed(3).slice(3)
}

export function parseJSON<T>(str: string) {
  try {
    return JSON.parse(str) as T
  } catch (_) {}
}
