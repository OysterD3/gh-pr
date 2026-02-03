import { useCallback, useEffect, useState } from 'react'
import { GitHubClient } from '@/lib/github/api'
import type { PullRequest } from '@/lib/github/types'

function updateBadge(count: number) {
  const text = count > 0 ? String(count) : ''
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color: count > 0 ? '#238636' : '#6e7681' })
}

interface UsePullRequestsState {
  prs: PullRequest[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function usePullRequests(
  accessToken: string | null,
  username: string | null
): UsePullRequestsState {
  const [prs, setPRs] = useState<PullRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPRs = useCallback(async () => {
    if (!accessToken || !username) {
      setPRs([])
      updateBadge(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const client = new GitHubClient(accessToken)
      const pullRequests = await client.getOpenPRs(username)
      setPRs(pullRequests)
      updateBadge(pullRequests.length)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch PRs'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, username])

  useEffect(() => {
    fetchPRs()
  }, [fetchPRs])

  return {
    prs,
    isLoading,
    error,
    refresh: fetchPRs,
  }
}
