import { useCallback, useEffect, useState } from 'react'
import { GitHubClient, type PRCategory } from '@/lib/github/api'
import type { PullRequest } from '@/lib/github/types'
import { getCachedPRs, isCacheExpired, setCachedPRs } from '@/lib/storage/cache'
import { getSettings } from '@/lib/storage/settings'

export interface CategoryPRs {
  category: PRCategory
  label: string
  prs: PullRequest[]
  isLoading: boolean
  error: string | null
}

function updateBadge(categories: CategoryPRs[]) {
  const totalCount = categories.reduce((sum, cat) => sum + cat.prs.length, 0)
  const text = totalCount > 0 ? String(totalCount) : ''
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color: totalCount > 0 ? '#238636' : '#6e7681' })
}

const CATEGORY_LABELS: Record<PRCategory, string> = {
  created: 'Opened by me',
  review_requested: 'Review requested',
  assigned: 'Assigned',
  mentioned: 'Mentioned',
}

export function useCategorizedPRs(
  accessToken: string | null,
  username: string | null,
  userId: number | null
) {
  const [categories, setCategories] = useState<CategoryPRs[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadCachedData = useCallback(async () => {
    if (!userId) return

    const settings = await getSettings()
    const enabledCategories = settings.categories
      .filter((c) => c.enabled)
      .map((c) => c.id)

    const cachedResults: CategoryPRs[] = []

    for (const categoryId of enabledCategories) {
      const cached = await getCachedPRs(userId, categoryId)
      cachedResults.push({
        category: categoryId,
        label: CATEGORY_LABELS[categoryId],
        prs: cached?.prs ?? [],
        isLoading: false,
        error: null,
      })
    }

    if (cachedResults.some((r) => r.prs.length > 0)) {
      setCategories(cachedResults)
      updateBadge(cachedResults)
    }

    return { cachedResults, settings }
  }, [userId])

  const fetchAllCategories = useCallback(
    async (force = false) => {
      if (!accessToken || !username || !userId) {
        setCategories([])
        updateBadge([])
        return
      }

      const settings = await getSettings()
      const enabledCategories = settings.categories
        .filter((c) => c.enabled)
        .map((c) => c.id)

      // Check if we need to fetch (any category expired or forced)
      let needsFetch = force

      if (!needsFetch) {
        for (const categoryId of enabledCategories) {
          const cached = await getCachedPRs(userId, categoryId)
          if (!cached || isCacheExpired(cached.fetchedAt, settings.refreshInterval)) {
            needsFetch = true
            break
          }
        }
      }

      if (!needsFetch) {
        // All cached data is still fresh, just load from cache
        await loadCachedData()
        return
      }

      setIsLoading(true)

      const client = new GitHubClient(accessToken)

      const results = await Promise.all(
        enabledCategories.map(async (categoryId): Promise<CategoryPRs> => {
          try {
            const prs = await client.getPRsByCategory(username, categoryId)
            // Cache the results
            await setCachedPRs(userId, categoryId, prs)
            return {
              category: categoryId,
              label: CATEGORY_LABELS[categoryId],
              prs,
              isLoading: false,
              error: null,
            }
          } catch (err) {
            // On error, try to use cached data
            const cached = await getCachedPRs(userId, categoryId)
            return {
              category: categoryId,
              label: CATEGORY_LABELS[categoryId],
              prs: cached?.prs ?? [],
              isLoading: false,
              error: err instanceof Error ? err.message : 'Failed to fetch',
            }
          }
        })
      )

      setCategories(results)
      updateBadge(results)
      setIsLoading(false)
    },
    [accessToken, username, userId, loadCachedData]
  )

  // Load cached data immediately, then check if refresh needed
  useEffect(() => {
    const init = async () => {
      // First load cached data to show immediately
      await loadCachedData()
      // Then fetch if needed
      await fetchAllCategories(false)
    }
    init()
  }, [loadCachedData, fetchAllCategories])

  const forceRefresh = useCallback(() => {
    return fetchAllCategories(true)
  }, [fetchAllCategories])

  return {
    categories,
    isLoading,
    refresh: forceRefresh,
  }
}
