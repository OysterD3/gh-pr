import type { PullRequest } from '@/lib/github/types'
import type { PRCategory } from '@/lib/github/api'

interface CachedCategoryData {
  prs: PullRequest[]
  fetchedAt: number
}

interface PRCache {
  [userId: number]: {
    [category in PRCategory]?: CachedCategoryData
  }
}

const CACHE_KEY = 'gh_pr_cache'

export async function getCachedPRs(
  userId: number,
  category: PRCategory
): Promise<CachedCategoryData | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (result) => {
      const cache = result[CACHE_KEY] as PRCache | undefined
      const data = cache?.[userId]?.[category]
      resolve(data ?? null)
    })
  })
}

export async function setCachedPRs(
  userId: number,
  category: PRCategory,
  prs: PullRequest[]
): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (result) => {
      const cache = (result[CACHE_KEY] as PRCache) || {}

      if (!cache[userId]) {
        cache[userId] = {}
      }

      cache[userId][category] = {
        prs,
        fetchedAt: Date.now(),
      }

      chrome.storage.local.set({ [CACHE_KEY]: cache }, () => resolve())
    })
  })
}

export async function clearUserCache(userId: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (result) => {
      const cache = (result[CACHE_KEY] as PRCache) || {}
      delete cache[userId]
      chrome.storage.local.set({ [CACHE_KEY]: cache }, () => resolve())
    })
  })
}

export function isCacheExpired(fetchedAt: number, intervalMinutes: number): boolean {
  const now = Date.now()
  const expiresAt = fetchedAt + intervalMinutes * 60 * 1000
  return now >= expiresAt
}
