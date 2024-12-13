const CACHE_KEY = 'places_search_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

interface CacheEntry {
  timestamp: number
  query: string
  location?: string
  type?: string
  results: any[]
}

interface SearchCache {
  [key: string]: CacheEntry
}

function generateCacheKey(query: string, location?: string, type?: string): string {
  return `${query}|${location || ''}|${type || ''}`
}

function cleanOldCache() {
  try {
    const now = Date.now()
    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return

    const cache: SearchCache = JSON.parse(stored)
    let hasChanges = false

    // Remove entries older than CACHE_DURATION
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > CACHE_DURATION) {
        delete cache[key]
        hasChanges = true
      }
    })

    if (hasChanges) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    }
  } catch (error) {
    console.error('Error cleaning cache:', error)
  }
}

export function getCachedResults(query: string, location?: string, type?: string): any[] | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return null

    const cache: SearchCache = JSON.parse(stored)
    const key = generateCacheKey(query, location, type)
    const entry = cache[key]

    if (!entry) return null

    // Check if cache is still valid
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      delete cache[key]
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      return null
    }

    return entry.results
  } catch (error) {
    console.error('Error getting cached results:', error)
    return null
  }
}

export function cacheResults(query: string, results: any[], location?: string, type?: string) {
  try {
    // Clean old cache entries first
    cleanOldCache()

    const stored = localStorage.getItem(CACHE_KEY)
    const cache: SearchCache = stored ? JSON.parse(stored) : {}
    const key = generateCacheKey(query, location, type)

    cache[key] = {
      timestamp: Date.now(),
      query,
      location,
      type,
      results
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error caching results:', error)
  }
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

// Get cache statistics
export function getCacheStats() {
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (!stored) return { totalEntries: 0, savedAPICalls: 0 }

    const cache: SearchCache = JSON.parse(stored)
    const entries = Object.keys(cache).length

    // Each cache hit potentially saves 1-2 API calls (search + geocoding)
    const savedCalls = Object.values(cache).reduce((total, entry) => {
      return total + (entry.location ? 2 : 1)
    }, 0)

    return {
      totalEntries: entries,
      savedAPICalls: savedCalls
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { totalEntries: 0, savedAPICalls: 0 }
  }
} 